# ADR 16 — Refatoração Zod para class-validator / class-transformer

## Status

**Implementado** (março/2026). Checklist da Fase A–F concluído; ver implementação em `src/config/env-variables.ts`, `src/shared/http/utils/validation-exception.factory.ts`, `src/shared/http/pipes/short-code-param.pipe.ts`, `ValidationPipe` em `src/app/bootstrap.ts` e `test/app.e2e-spec.ts`.

## Contexto

A base usava **Zod 4** em três frentes: variáveis de ambiente, payloads HTTP e parâmetro `shortCode`, com um pipe dedicado que padroniza erros HTTP. A implementação atual remove Zod e usa **class-validator** / **class-transformer** nas mesmas frentes. O **SecurityInputGuard** permanece independente e implementa política de rejeição de entrada; não faz parte desta troca, mas entra na matriz de não-regressão.

**Ordem de execução no NestJS (obrigatório manter o modelo mental correto):** middleware → **guards** → interceptors (pré) → **pipes** → handler. O `SecurityInputGuard` (APP_GUARD) corre **antes** de qualquer `ValidationPipe`, global ou local. Portanto:

- **`useGlobalPipes(ValidationPipe)`** no [`src/app/bootstrap.ts`](src/app/bootstrap.ts): padrão de mercado para validação e transformação de DTOs (`whitelist`, `transform`, coerência com `class-transformer`). Isso **complementa** a arquitetura; **não substitui** o guard.

- **SecurityInputGuard** ([`src/shared/http/guards/security-input.guard.ts`](src/shared/http/guards/security-input.guard.ts)): continua responsável apenas por **rejeitar** padrões perigosos; a normalização interna (`normalizeForInspection`) é só para **detecção**, não altera o request. **Não** migrar essa lógica para dentro de pipes nem “fundir” guard com `useGlobalPipes`.

Em termos de produto: “sanitização/higiene” no sentido Nest para payloads tipados = `ValidationPipe` (ex.: remover propriedades não decoradas com `whitelist: true`). Filtro de segurança transversal = guard. Camadas **ortogonais**.

Objetivos:

- Remover a dependência **zod** mantendo **paridade funcional**.
- Adotar o padrão mais comum em **NestJS**: DTOs em classe com **class-validator** + **class-transformer** e **@ApiProperty** no mesmo tipo (KISS: uma fonte de verdade na borda HTTP).
- Registrar **`app.useGlobalPipes(new ValidationPipe({ ... }))`** no bootstrap com **`exceptionFactory`** que preserve o contrato consumido pelo [`AppExceptionFilter`](src/shared/http/filters/app-exception.filter.ts): `VALIDATION_ERROR`, `message: 'Request validation failed'`, `details` com `field` e `message` alinhados ao comportamento anterior do pipe Zod (hoje substituído por [`validationExceptionFactory`](src/shared/http/utils/validation-exception.factory.ts)).
- Manter **`shortCode`** como valor primitivo no `@Param`, validado por **pipe dedicado** (paridade com o uso atual do Zod), evitando depender só do fluxo de objeto do ValidationPipe para esse caso.

## Inventário: como o Zod está implementado hoje

### 1. Bootstrap de configuração

**Arquivos:** `src/config/env-variables.ts`, `src/config/env-cross-rules.ts`, `src/config/env.parser.ts`, `src/config/config.module.ts`

- `ConfigModule.forRoot({ validate: parseEnv })` chama `parseEnv(process.env)` na subida.
- `parseEnv`:
  - Faz cache em memória (`cachedEnv`): primeira parse bem-sucedida congela o resultado (comportamento atual a preservar).
  - Usa `envSchema.safeParse(input)`.
  - Em falha: `console.error` com `z.treeifyError(result.error)` e `throw new Error('Configuração de ambiente inválida')`.
- `export type Env = EnvVariables` tipa `ConfigService` (ex.: `src/infra/database/database.service.ts`).

**Primitivos reutilizáveis no schema:**

| Nome lógico       | Comportamento Zod |
|-------------------|-------------------|
| `booleanString`   | Enum `'true' \| 'false'` transformado em `boolean` |
| `portNumber`      | Coerce número inteiro 1024–65535 |
| `milliseconds`    | Coerce inteiro 0–86400000 (mensagem custom se > 24h) |
| `hostSchema`      | `localhost` OU IPv4 OU hostname (comentário: evita limitação de URL para host) |

**Campos do objeto (resumo):**

- App: `NODE_ENV`, `APP_PORT`, `APP_HOST`, `APP_GLOBAL_PREFIX` (trim, regex, default `api`), `APP_CORS_ORIGIN` (split por vírgula, trim cada item, refine: cada item `*` ou URL http válida via `z.httpUrl()`), `APP_BODY_LIMIT` (regex tamanho + unidade, default `100kb`), `APP_HTTP_TIMEOUT_MS` (default 5000), `APP_ENABLE_SWAGGER`.
- DB: host/port, `DB_NAME`/`DB_USER` (trim, max 63, regex), `DB_PASSWORD` (tamanho + 4 refines: maiúscula, minúscula, dígito, especial), `DB_SSL`, pool min/max, idle/connection timeouts em ms.
- Redis: host/port, password min/max, `REDIS_DB` 0–15, TLS flag, connect timeout, `CACHE_TTL_SECONDS` opcional default 60.
- Logger: `LOG_LEVEL`, `LOG_PRETTY`, `LOG_REDACT_SENSITIVE`.
- OTEL: nome opcional (trim ou undefined), endpoint URL ou `''` virando undefined, `OTEL_TRACES_EXPORTER` opcional.

**`superRefine` (regras cruzadas — obrigatório replicar):**

1. `DB_POOL_MAX >= DB_POOL_MIN` (senão issue em `DB_POOL_MAX`).
2. Se `NODE_ENV === 'production'`:
   - `APP_ENABLE_SWAGGER` não pode ser true.
   - `REDIS_TLS_ENABLED` deve ser true.
   - `DB_SSL` deve ser true.
   - `APP_CORS_ORIGIN` não pode conter `*`.
   - `LOG_PRETTY` deve ser false.
3. Se ambos timeouts DB > 0: `DB_CONNECTION_TIMEOUT_MS < DB_IDLE_TIMEOUT_MS`.

### 2. Borda HTTP — body

**Arquivos:** `src/modules/short-url/http/contracts/create-short-url.request.ts`, `update-short-url.request.ts`

- Schemas: `z.object({ url: z.url({ message: '...' }) })`.
- Mensagens distintas: create `"A URL deve ser válida"`; update `"O formato da URL é inválido"`.
- Classes Nest existem **só** com `@ApiProperty` (duplicação com Zod hoje).
- Tipos de handler: `z.infer<typeof schema>`.

### 3. Borda HTTP — parâmetro `shortCode`

**Arquivo:** `src/shared/http/pipes/short-code-param.pipe.ts` (substitui `short-code.schema.ts`)

- Schema em `z.string()`: min 4, max 8, regex `^[a-zA-Z0-9]+$`, mensagens em português para tipo/tamanho/padrão.
- Uso: valor **primitivo** string no `@Param` passado ao `ZodValidationPipe` (o pipe recebe a string diretamente, não um objeto).

### 4. Pipe HTTP

**Arquivo removido:** `zod-validation.pipe.ts` — substituído por `validation-exception.factory.ts` + ValidationPipe global + `ShortCodeParamPipe`.

- `safeParse(value)`; sucesso retorna `data`; falha lança `BadRequestException` com:
  - `code: 'VALIDATION_ERROR'`
  - `message: 'Request validation failed'`
  - `details: [{ field: path joined by '.', message }]`

### 5. Controller

**Arquivo:** `src/modules/short-url/http/controllers/shorten.controller.ts`

| Rota | Validação |
|------|-----------|
| POST `shorten` | `@UsePipes(new ZodValidationPipe(createShortUrlSchema))` no método; body tipado como DTO inferido |
| GET/PUT/DELETE/stats `shorten/:shortCode` | `new ZodValidationPipe(shortCodeSchema)` no `@Param('shortCode', ...)` |
| PUT | param pipe + `@Body(new ZodValidationPipe(updateShortUrlSchema))` |

**Ordem Nest:** guards (incl. `SecurityInputGuard`) **antes** dos pipes. Com `useGlobalPipes`, o ValidationPipe global ainda corre **depois** do guard; comportamento desejado preservado.

**Pós-refatoração prevista:** body validado pelo **ValidationPipe global** + DTOs com `class-validator`; `shortCode` continua com **pipe dedicado**; evitar `@UsePipes(ValidationPipe)` duplicado no mesmo método se o global já cobre o body.

### 6. Testes afetados (referência para não-regressão)

- `src/shared/http/utils/validation-exception.factory.spec.ts`
- `src/modules/short-url/http/contracts/create-short-url.request.spec.ts`
- `src/modules/short-url/http/contracts/update-short-url.request.spec.ts` (mensagem exata em URL inválida)
- `src/shared/http/pipes/short-code-param.pipe.spec.ts`

E2E: `test/app.e2e-spec.ts` (400 genérico em URL inválida; 400 `SECURITY_INPUT_REJECTED` no guard — independente do Zod).

### 7. O que não é Zod (permanece)

- `src/shared/http/guards/security-input.guard.ts`: inspeção recursiva body/params/query/headers; normalização interna só para **detecção** (não muta request).

---

## Decisão de desenho (KISS + mercado)

1. **DTO único** por entrada HTTP (body): decorators `class-validator` / `class-transformer` + `@ApiProperty` na mesma classe; remover schemas Zod e tipos `z.infer`.

2. **`ValidationPipe` global** em [`bootstrap.ts`](src/app/bootstrap.ts): `transform: true`, `whitelist: true`. **Não** habilitar `forbidNonWhitelisted` na primeira entrega sem validar impacto em clientes que enviam propriedades extras (paridade com o comportamento atual).

3. **Contrato de erro único:** função utilitária (ex.: construir `BadRequestException` a partir de `ValidationError[]`) usada pelo **`exceptionFactory` do ValidationPipe global**, de forma que o payload siga idêntico ao do `ZodValidationPipe` atual (`VALIDATION_ERROR`, `details` com `field` + `message`).

4. **`shortCode`:** **pipe dedicado** validando string primitiva com as mesmas regras e mensagens (decisão fixa; evita ambiguidade com DTO de rota nesta entrega).

5. **Ambiente:** classe (ex.: `EnvVariables`) com transforms e validadores; após `validateSync`, aplicar as mesmas regras do `superRefine` via função pura `assertEnvCrossRules(instance)` ou equivalente KISS.

6. **Sem novas sanitizações** nas URLs (ex.: `@Trim`) se não existirem hoje no schema Zod, para não mudar idempotência/`findByUrl` de forma silenciosa.

7. **SecurityInputGuard:** sem alteração de responsabilidade; permanece APP_GUARD; **não** mover sua lógica para `useGlobalPipes`.

---

## Fases de execução (checklist)

Marcar `[ ]` para `[x]` ao concluir. Ordem intencional: **A.1** (deps) → **B** (env, maior risco) → **A.2/A.3** (mapeamento de erro HTTP + teste) → **C/D/E** (DTOs, pipe `shortCode`, bootstrap, controller) → **F**.

### Fase A — Preparação e contrato de erro

- [x] **A.1** Adicionar dependências diretas `class-validator` e `class-transformer` (versões compatíveis com `@nestjs/swagger` / Nest 11).
- [x] **A.2** Implementar função reutilizável que converte falhas do class-validator em `BadRequestException` com `code`, `message`, `details` **idênticos** ao `ZodValidationPipe` (campo: `property` / path compatível com testes atuais).
- [x] **A.3** Criar teste unitário mínimo para esse mapeamento (substituindo ou evoluindo `zod-validation.pipe.spec.ts`).

### Fase B — Variáveis de ambiente (paridade com o schema Zod anterior, hoje `env-variables.ts`)

- [x] **B.1** Modelar classe (ou módulo) de env com todos os campos e tipos finais iguais ao `Env` atual (boolean, number, `string[]` para CORS, opcionais OTEL).
- [x] **B.2** Replicar transforms: strings `'true'/'false'`, coerce de portas/números, split/trim de CORS, defaults (`APP_GLOBAL_PREFIX`, `APP_BODY_LIMIT`, `APP_HTTP_TIMEOUT_MS`, `CACHE_TTL_SECONDS`).
- [x] **B.3** Replicar validações de string: regex prefixo global, body limit, DB name/user, password (quatro regras), Redis password, enums (`NODE_ENV`, `LOG_LEVEL`, etc.).
- [x] **B.4** Replicar host: localhost | IPv4 | hostname para `APP_HOST`, `DB_HOST`, `REDIS_HOST`.
- [x] **B.5** Replicar `superRefine` na íntegra (pool, produção, timeouts DB); mensagens e `path` conceituais alinhados para depuração.
- [x] **B.6** Atualizar `parseEnv`: usar a nova validação; manter cache `cachedEnv`; em falha, manter comportamento de throw (log útil sem depender de Zod).
- [x] **B.7** Expor tipo `Env` consumido por `ConfigService` / `database.service` sem quebrar `infer: true` (ajustar import do tipo se o arquivo renomear).

### Fase C — DTOs HTTP (body)

- [x] **C.1** `CreateShortUrlRequest`: `@IsUrl` (ou equivalente com mensagem `"A URL deve ser válida"`), `@ApiProperty` preservado.
- [x] **C.2** `UpdateShortUrlRequest`: mensagem `"O formato da URL é inválido"` na regra de URL.
- [x] **C.3** Remover exports `*Schema` e tipos `z.infer`; tipar handlers com a própria classe DTO (padrão mercado).

### Fase D — Parâmetro `shortCode`

- [x] **D.1** Implementar **pipe dedicado** com mesmas regras e mensagens (min/max/regex).
- [x] **D.2** Encaixar no controller nos `@Param('shortCode', ...)` sem mudar assinaturas públicas dos métodos onde possível.
- [x] **D.3** Atualizar testes que hoje importam `shortCodeSchema`.

### Fase E — Bootstrap, controller e remoção Zod HTTP

- [x] **E.0** Em [`src/app/bootstrap.ts`](src/app/bootstrap.ts): `app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, exceptionFactory: ... }))` usando a função da fase A.2.
- [x] **E.1** Ajustar [`ShortenController`](src/modules/short-url/http/controllers/shorten.controller.ts): remover `ZodValidationPipe` / `UsePipes` de body onde o global bastar; manter apenas pipe dedicado em `shortCode`.
- [x] **E.2** Confirmar que `whitelist`/`transform` e ausência de `forbidNonWhitelisted` preservam comportamento aceitável para clientes existentes.
- [x] **E.3** Remover `zod-validation.pipe.ts` e specs obsoletos após migração.
- [x] **E.4** Remover `zod` de `package.json` e lockfile quando nenhum import restar.

### Fase F — Verificação e documentação

- [x] **F.1** Rodar `npm run typecheck`, `npm run test`, `npm run test:e2e`.
- [x] **F.2** Conferir matriz de não-regressão abaixo manualmente ou via testes.
- [x] **F.3** **Obrigatório nesta entrega:** atualizar [`README.md`](README.md) e [`docs/planejamento_feature_url_shortener_c_4.md`](docs/planejamento_feature_url_shortener_c_4.md) para refletir class-validator, `class-transformer`, `ValidationPipe` global e a separação guard vs validação.
- [x] **F.4** Atualizar **Status** deste ADR e marcar checklists quando a implementação estiver concluída.

---

## Matriz de não-regressão (Definition of Done)

| Área | Critério |
|------|----------|
| Env | Mesmos limites, defaults, tipos transformados e falhas em `production` |
| POST URL | Aceite/recusa alinhada aos specs; mensagem create |
| PUT URL | Mensagem fixa do spec em URL inválida |
| shortCode | Limites 4–8, charset, mensagens |
| Erro validação | `VALIDATION_ERROR`, `Request validation failed`, `details` com campo e mensagem |
| Bootstrap | `useGlobalPipes(ValidationPipe)` ativo; erros de DTO usam o mesmo contrato do filter |
| Security guard | Inalterado em papel e ordem; e2e `SECURITY_INPUT_REJECTED` continua passando |
| Cache parseEnv | Primeira validação sucesso ainda cacheia |

---

## Notas

- Paridade exata entre `z.url()` e `@IsUrl()` pode exigir ajuste fino de opções; tratar como risco controlado na Fase C com os casos dos testes existentes.
- Rotas somente GET (ex.: health) não perdem body; o pipe global não substitui validação de `shortCode` primitivo — por isso o pipe dedicado na Fase D.
- Decisão consolidada: **borda HTTP** = DTO class-validator + Swagger + **ValidationPipe global**; **config** = classe/validação na subida; **SecurityInputGuard** = política transversal **antes** dos pipes, sem fusão com `useGlobalPipes`.
