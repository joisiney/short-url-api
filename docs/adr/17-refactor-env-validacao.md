# ADR 17 — Refatoração de responsabilidades (env + validação)

## Status

**Implementado** (março/2026). Refatoração interna: sem mudança de contrato HTTP público nem de regras de negócio de env.

## Contexto

Após a migração Zod para class-validator ([ADR 16](16-refactor-zod-to-class-validator.md)), surgiram dois pontos de arquitetura:

1. **Acoplamento config para HTTP:** `parseEnv` em [`src/config/env.parser.ts`](../src/config/env.parser.ts) importava `flattenValidationErrors` de [`src/shared/http/utils/validation-exception.factory.ts`](../src/shared/http/utils/validation-exception.factory.ts). A função só depende de tipos do `class-validator` e produz uma lista genérica `field` / `message`; não é específica da borda HTTP.

2. **Defaults de variáveis opcionais em dois lugares:** valores padrão aplicados em `normalizeEnvInput` (ex.: timeouts numéricos) e outros em `@Transform` na classe [`EnvVariables`](../src/config/env-variables.ts) (ex.: `APP_GLOBAL_PREFIX`, `APP_BODY_LIMIT`). Isso dificulta descobrir a lista completa de defaults e aumenta risco de divergência.

3. **Diagnóstico na falha de env:** `console.error` antes do `throw` permanece aceitável para bootstrap; não faz parte do escopo trocar por stack de logging estruturada neste ADR.

## Decisão

1. **Módulo neutro de flatten:** criar [`src/shared/validation/flatten-validation-errors.ts`](../src/shared/validation/flatten-validation-errors.ts) com o tipo `ValidationErrorDetail` e a função `flattenValidationErrors`, copiando o comportamento atual.

2. **Factory HTTP:** [`validation-exception.factory.ts`](../src/shared/http/utils/validation-exception.factory.ts) importa o módulo neutro e **reexporta** `ValidationErrorDetail` e `flattenValidationErrors` para manter caminhos de import existentes estáveis onde aplicável.

3. **Parser de env:** [`env.parser.ts`](../src/config/env.parser.ts) importa `flattenValidationErrors` **apenas** do módulo `shared/validation`, eliminando dependência da pasta `http`.

4. **Defaults centralizados:** criar [`src/config/env-defaults.ts`](../src/config/env-defaults.ts) com o mapa único `ENV_OPTIONAL_DEFAULTS` (`APP_HTTP_TIMEOUT_MS`, `CACHE_TTL_SECONDS`, `APP_GLOBAL_PREFIX`, `APP_BODY_LIMIT`). [`normalizeEnvInput`](../src/config/env.parser.ts) aplica esse mapa quando o valor está ausente, é `null` ou string vazia (após trim quando string).

5. **Classe `EnvVariables`:** remover ramos de default duplicados em `@Transform` para `APP_GLOBAL_PREFIX` e `APP_BODY_LIMIT`, mantendo apenas normalização de forma (trim / coerção já necessária). Os defaults passam a vir exclusivamente de `ENV_OPTIONAL_DEFAULTS` + `normalizeEnvInput`.

## Alternativas consideradas

| Alternativa | Motivo de não escolha como principal |
|-------------|--------------------------------------|
| Manter flatten só em `http/utils` | Mantém acoplamento semântico incorreto de config para HTTP. |
| Barrel `shared/validation/index.ts` | Evitado (MEC); imports diretos por ficheiro. |
| Defaults 100% só em decorators | Fragilidade com chaves ausentes no objeto passado ao `plainToInstance` já observada na prática; tabela no parser é explícita. |
| Unificar mensagens de erro env com HTTP | Fora de escopo; contrato de falha de env permanece payload JSON no stderr + `Error` genérico. |

## Consequências

- **Positivas:** responsabilidade clara (validação genérica vs factory HTTP vs defaults vs classe tipada); uma lista única de defaults documentada no código (`env-defaults.ts`).
- **Negativas / trade-off:** quem adicionar nova variável com default deve atualizar `ENV_OPTIONAL_DEFAULTS` e não depender só de `@Transform` para default (disciplina de equipe).

## Plano de implementação

1. Adicionar `src/shared/validation/flatten-validation-errors.ts` com tipo e função atuais.
2. Ajustar `validation-exception.factory.ts` para importar e reexportar; manter `validationExceptionFactory` inalterado.
3. Ajustar `env.parser.ts`: import de flatten do módulo neutro; `normalizeEnvInput` iterar `ENV_OPTIONAL_DEFAULTS`.
4. Adicionar `src/config/env-defaults.ts` com as quatro chaves: `APP_HTTP_TIMEOUT_MS`, `CACHE_TTL_SECONDS`, `APP_GLOBAL_PREFIX`, `APP_BODY_LIMIT`.
5. Simplificar `@Transform` de `APP_GLOBAL_PREFIX` e `APP_BODY_LIMIT` em `env-variables.ts`.
6. Testes: extrair ou duplicar cobertura mínima de `flattenValidationErrors` em `flatten-validation-errors.spec.ts`; reduzir `validation-exception.factory.spec.ts` ao factory se fizer sentido.
7. Gate: `npm run lint`, `npm run typecheck`, `npm test`.

## Critérios de aceite

- Nenhuma mudança no corpo JSON de `BadRequestException` produzido por `validationExceptionFactory` (código, mensagem, forma de `details`).
- `parseEnv` não importa de `src/shared/http/**`.
- Lista de defaults opcionais visível e única em `env-defaults.ts`.
- Suite de testes e análise estática passam.

## Não objetivos

- Alterar `collectEnvCrossRuleViolations` ou mensagens de regras cruzadas.
- Substituir `class-validator` / `class-transformer`.
- Editar `README.md` ou outros Markdown fora deste ADR, salvo pedido explícito.
