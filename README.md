
  <img src="https://res.cloudinary.com/dmoi0mmuj/image/upload/c_pad,w_900/v1773872265/Gemini_Generated_Image_r1wqexr1wqexr1wq_r7xz8y.png" alt="Short URL API Banner" />


<br/>

API REST de encurtamento de URLs. Permite criar, consultar, atualizar e remover URLs curtas, além de consultar estatísticas de acesso. 
Arquitetura orientada por domínio, tipagem estrita, validação com Zod e alto foco em segurança, escalabilidade e qualidade guiada por **TDD (Test-Driven Development)**.

## Stack

- Node.js 20+
- TypeScript (strict mode)
- NestJS
- PostgreSQL
- Drizzle ORM
- Zod
- Swagger/OpenAPI
- Docker Compose
- Redis

## Requisitos

### Funcionais
- Criar short URL
- Obter URL original por short code
- Atualizar short URL
- Deletar short URL
- Consultar estatísticas de acesso

### Não funcionais
- Rate limit: 2 req/min por IP em POST /shorten e GET /shorten/:shortCode (Throttler + Redis)
- Cache Redis para consultas por shortCode; invalidação em PUT e DELETE
- Validação Zod em payloads; schemas strict
- Throttler distribuído via Redis (contador compartilhado entre instâncias)

### Detalhes críticos (evitar dor de cabeça)
- **Proxy**: Se a API estiver atrás de proxy (nginx, load balancer), configurar `trust proxy` no adapter HTTP para que o IP real venha de `X-Forwarded-For`. Sem isso, todos os clientes são vistos como o mesmo IP (o do proxy) e o rate limit não funciona por usuário.
- **Redis para rate limit**: Se Redis cair, o Throttler pode degradar; cache retorna miss e vai ao DB.

### Regras de negócio

**Aplicadas no código**
- URL válida (formato URI) em POST e PUT; validação Zod
- ShortCode único: gerado por ID sequencial (Redis INCR) + Base62; constraint UNIQUE no banco
- ShortCode 4-7 caracteres, apenas alfanuméricos; validado em parâmetros
- accessCount nunca negativo (check constraint); incremento atômico no DB
- Cache invalidado em PUT e DELETE

**Não aplicadas (podem causar dúvidas)**
- Mesma URL pode gerar vários shortCodes; não há deduplicação por URL
- URL não é normalizada: `https://example.com`, `https://example.com/` e `https://www.example.com` são tratadas como distintas
- Sem autenticação: qualquer um pode criar, editar e deletar qualquer shortCode

**Melhorias de requisitos (a implementar)**
- Deduplicação: retornar shortCode existente quando a URL já foi encurtada
- Normalização de URL antes de criar/atualizar
- Autenticação/autorização para operações de escrita (PUT, DELETE)

## Arquitetura e Soluções

O projeto foi desenhado buscando uma forte consistência estrutural. Abaixo detalhamos a modelagem através da visão de Contexto, Container, Componentes e Fluxo Interno.

### 1. Diagrama de Contexto
```mermaid
flowchart LR
    User[Cliente API / Frontend] --> API[URL Shortening API]
    API --> PG[(PostgreSQL)]
    API --> Redis[(Redis)]
    Dev[Developer] --> Swagger[Swagger / OpenAPI]
    Swagger --> API
```

### 2. Diagrama de Container
```mermaid
flowchart TB
    Client[Cliente HTTP / Frontend]
    ReverseProxy[Gateway / Reverse Proxy / TLS]
    NestApi[NestJS API Container]
    Postgres[(PostgreSQL Container)]
    Redis[(Redis Container)]
    Obs[Logs / Metrics / Healthchecks]

    Client --> ReverseProxy
    ReverseProxy --> NestApi
    NestApi --> Postgres
    NestApi --> Redis
    NestApi --> Obs
```

### 3. Diagrama de Componente (Módulo: `short-url`)
```mermaid
flowchart LR
    Controller[Controllers]
    Throttler[ThrottlerGuard]
    ZodValidation[Zod Validation Pipe/Layer]
    UseCases[Use Cases]
    Generator[ShortCodeGeneratorService]
    RepoPort[ShortUrlRepository Port]
    CachedRepo[CachedShortUrlRepository]
    DrizzleRepo[DrizzleShortUrlRepository]
    Redis[(Redis)]
    Mapper[Persistence Mapper]
    DrizzleSchema[Drizzle Schema]
    Postgres[(PostgreSQL)]
    Presenter[Presenters]

    Controller --> Throttler
    Throttler --> Controller
    Controller --> ZodValidation
    ZodValidation --> UseCases
    UseCases --> Generator
    UseCases --> RepoPort
    RepoPort --> CachedRepo
    CachedRepo --> Redis
    CachedRepo --> DrizzleRepo
    DrizzleRepo --> Mapper
    DrizzleRepo --> DrizzleSchema
    DrizzleSchema --> Postgres
    UseCases --> Presenter
```

### 4. Fluxo Interno da Aplicação (Code Diagram)
```mermaid
flowchart TD
    A[HTTP Request] --> B[Controller]
    B --> C[Validation Layer Zod]
    C --> D[Use Case]
    D --> E[Domain Rules]
    D --> F[Repository Port]
    F --> G[Drizzle Repository]
    G --> H[(PostgreSQL)]
    D --> I[Presenter]
    I --> J[HTTP Response]
```

## Modelo de Dados (ER)
Estrutura simples e objetiva em uma única tabela para suprir a necessidade de rastreio de URLs curtas e cliques totais.
```mermaid
erDiagram
    SHORT_URLS {
        uuid id PK
        text url
        varchar short_code UK
        bigint access_count
        timestamptz created_at
        timestamptz updated_at
    }
```

## Escalabilidade e Segurança

O projeto adotou as seguintes práticas visando controle de concorrência massiva e proteção superficial de ataques comuns:

### Escalabilidade
- **Stateless API:** A API baseada em NestJS não retém estado na sua infraestrutura, os controles e cachês em requisições intensas são deslocados para serviços externos como o Redis, permitindo instanciar "N" réplicas no provisionamento cloud via Load Balancer.
- **Throttling Distribuído e Cache:** O Rate Limit utiliza o Redis como storage permitindo que o limite de bloqueio por IP ou chaves customizadas seja globalizado em todas as instâncias da API.
- **Isolamento e Índices do Banco:** A criação do índice simples e das constraints de integridade no banco delegam do motor NodeJS a responsabilidade de travar acessos concorrentes para criar nomes (short codes) já existentes.

### Segurança
- **Proteção do Endpoint e Headers:** A biblioteca `Helmet` embutida garante proteções contra Clickjacking (X-Frame-Options), restrições MIME e Sniffing de conteúdo, enquanto mantemos o `x-powered-by` oculto para ofuscar o Stack técnico utilizado. As regras de CORS são rigorosas para bloquear requests não autorizados num front-end externo.
- **Gatekeeper Rigoroso (Zod):** A API adota `strict()` schema rules para rejeitar e padronizar toda entrada externa (payloads HTTP), não permitindo chaves surpresas. Tudo é sanitizado e validado antes mesmo do trânsito na Controller e nos Use Cases.
- **Query Builds Seguras e Tratamento Drizzle:** Proteção contra SQL injections nativamente implementadas no uso restrito dos Query Builders. Não utilizamos concatenações abertas para evitar execução indevida. O Drizzle mapeia apenas tabelas autorizadas na memória e oculta relatórios de erro do DB.

## Estrutura do projeto

```
src/
  modules/short-url/     # Domínio short-url
    domain/              # Entidades, value objects, erros
    application/         # Use cases, serviços de aplicação
    infra/               # Repositórios (Drizzle)
    http/                # Controller, contracts, presenter
  shared/                # Base HTTP, contratos, pipes, interceptors
  config/                # Configuração e validação de env
  infra/                 # Database, migrations
```

Organização por feature/domínio. Regras de negócio nos use cases; controller apenas orquestra. Acesso a dados via repositório.

## Pré-requisitos

- Docker e Docker Compose
- Node.js 20+ (para rodar fora dos containers)
- npm

## Configuração de environment

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
2. Ajuste valores conforme necessário. Variáveis obrigatórias: `DB_*`, `REDIS_*`, `APP_*`. O boot falha se env estiver inválida.
3. Para testes: existe `.env.test`; testes de integração e e2e usam esse arquivo automaticamente.

## Como subir localmente

1. Configure o env (ver seção anterior).
2. Instale dependências (necessário para migrations e comandos locais):
   ```bash
   npm install
   ```
3. Suba a infraestrutura:
   ```bash
   docker compose up -d
   ```
4. Aplique as migrations:
   ```bash
   npm run db:migrate
   ```
5. A API sobe no container com hot reload. Swagger em http://localhost:3000/api/docs.

Para rodar a API fora do container (com postgres e Redis já no ar via Docker):

```bash
npm install
npm run db:migrate
npm run start:dev
```

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `docker compose up -d` | Sobe ambiente (api, postgres, redis) |
| `docker compose down` | Derruba ambiente |
| `npm run start:dev` | App em modo dev (watch) |
| `npm run build` | Build de produção |
| `npm run start:prod` | Executa build (node dist) |
| `npm run format` | Prettier (formata arquivos) |
| `npm run format:check` | Prettier (valida sem alterar) |
| `npm run lint` | ESLint (validação) |
| `npm run lint:fix` | ESLint (corrige automaticamente) |
| `npm run typecheck` | Checagem de tipos (tsc --noEmit) |
| `npm run test` | Testes unitários |
| `npm run test:unit` | Alias para testes unitários |
| `npm run test:integration` | Testes de integração |
| `npm run test:e2e` | Testes HTTP/e2e |
| `npm run test:http` | Alias para test:e2e |
| `npm run test:all` | Unit + integration + e2e |
| `npm run db:generate` | Gera migration a partir do schema |
| `npm run db:migrate` | Aplica migrations pendentes |
| `npm run db:create-test` | Cria banco `short_url_test` (para testes) |

## Redis

O Redis e usado para **cache** e **seguranca**:

- **Rate limit distribuido**: Throttler com storage Redis; 2 req/min por IP em POST /shorten e GET /shorten/:shortCode
- **Cache**: consultas `findByShortCode` cacheadas com TTL configurável (`CACHE_TTL_SECONDS`); invalidacao em PUT e DELETE
- **Health**: `/health/ready` inclui Redis; retorna `degraded` se Redis estiver down

Variaveis: `REDIS_*`, `CACHE_TTL_SECONDS` (opcional, default 60).

## Banco de dados e migrations

- Banco: PostgreSQL
- ORM: Drizzle
- Migrations aplicadas via `npm run db:migrate`
- Novas migrations: edite o schema em `src/infra/database/schema/`, depois `npm run db:generate`
- **Não edite migrations já aplicadas**
- Seed: não implementado neste projeto

## Testes e Cobertura (TDD)

Toda essa feature foi construída estruturada na metodologia **Test-Driven Development (TDD)** focada na robustez e confiabilidade dos cenários base e fluxos alternativos da implementação do encurtador. Esta arquitetura reflete uma pirâmide abrangente:

### 1. Unitários (Regras de Domínio/Aplicação)

Rodam rapidamente em memória, abstraindo o contato de dependências reais (como Banco/Rede). Testamos pesadamente as regras dos UseCases usando um Repository "In-Memory" para cobrir 100% de cenários críticos.
```bash
npm run test
```
Arquivos: `src/**/*.spec.ts`.

### 2. Integração e E2E (Casos de uso completos e HTTP)

Os testes de integração focam na comunicação e comportamento persistente do Repositório (Drizzle) diretamente num banco efêmero de testes.
Em paralelo, os testes E2E validam fluxos da camada externa em diante, testando inclusive Headers HTTP e os erros formatados pelo Exception Filter, batendo do endpoint HTTP montado até o Banco.

Testes de integração (repositório contra banco real) e e2e (API completa via supertest) precisam de **PostgreSQL** e **Redis** rodando. Usam `.env.test` e o banco `short_url_test`.

**Passo a passo para rodar integration e e2e:**

1. Suba apenas postgres e redis (sem a API):
   ```bash
   docker compose up -d postgres redis
   ```

2. Crie o banco de teste:
   ```bash
   npm run db:create-test
   ```
   (ou `docker compose run --rm create-test-db`)

3. Execute os testes Específicos:
   ```bash
   npm run test:integration   # Repositório + banco de teste
   npm run test:e2e           # API completa acoplada HTTP supertest
   ```

   Ou ambos os escopos integrados: `npm run test:all`

**Observações Técnicas:**
- Os testes e2e bootam a aplicação NestJS em memória e fazem requisições simuladas via supertest; não é necessário rodar "npm run start" em background na maioria dos casos.
- O `.env.test` aponta para `localhost:5432` e `localhost:6379`; o Docker Compose expõe essas portas automaticamente nos serviços.
- Se o postgres isolado de teste ou o container do redis não estiverem acessíveis, eles apresentarão erro de pool conectction e falharão propositalmente.

## Swagger

- URL local: http://localhost:3000/api/docs
- Requer a aplicação rodando
- Documentação interativa da API

## Convenções do projeto

- Organização por feature/domínio
- Validação com Zod (schemas nos contracts)
- Regras de negócio nos use cases, não no controller
- Acesso a banco via repositório (interface no domain)
- TypeScript strict mode
- Contratos HTTP tipados e documentados com Swagger

## Fluxo de qualidade (antes de PR)

Execute localmente (ordem recomendada):

```bash
npm run format          # quando necessário
npm run lint
npm run typecheck
npm run test:all
npm run build
```

Commits devem seguir [Conventional Commits](https://www.conventionalcommits.org/): `tipo(escopo): descrição` (ex: `feat(short-url): add create endpoint`).

## Cobertura de Testes Atual

Refletindo a adoção rigorosa de **TDD**, possuímos diferentes suítes de teste que garantem a segurança do ciclo de vida da _feature_ de encurtamento. A cobertura foi instrumentada individualmente para provar a eficácia e robustez em todas as camadas arquiteturais:

### 1. Testes Unitários (`npm run test:cov`)
Extremo foco no isolamento do domínio (Use Cases cobrem **100%**) resolvendo regras com o Repository _In-Memory_.
```text
--------------------------------------|---------|----------|---------|---------|
File                                  | % Stmts | % Branch | % Funcs | % Lines |
--------------------------------------|---------|----------|---------|---------|
All files                             |   37.76 |    28.51 |    29.7 |   38.23 |
 modules/short-url/application/use-cases|   100 |    92.85 |     100 |     100 |
 modules/short-url/domain/errors      |      75 |      100 |      75 |      75 |
 modules/short-url/domain/repositories|     100 |      100 |     100 |     100 |
 modules/short-url/http/contracts     |     100 |      100 |     100 |     100 |
 modules/short-url/http/controllers   |    91.8 |       75 |     100 |   91.52 |
 shared/http/pipes                    |     100 |      100 |     100 |     100 |
--------------------------------------|---------|----------|---------|---------|
```

### 2. Testes de Integração (`npm run test:integration -- --coverage`)
Garantem com segurança o comportamento real persistente (`DrizzleShortUrlRepository`) disparando _Query Builds_ no PostgreSQL e avaliando transações, locks de concorrência e violações constraint.
```text
=============================== Coverage summary ===============================
Statements   : 14.12%
Branches     : 10.52% 
Functions    : 16.75%
Lines        : 14.28%
================================================================================
```

### 3. Testes End-to-End (`npm run test:e2e -- --coverage`)
Instrumentação completa simulando os endpoints via `supertest` e interceptando as fronteiras globais pelo boot do App (`AppExceptionFilter`, Zod `ValidationPipe` customizado e Redis ThrottlerGuard).
```text
=============================== Coverage summary ===============================
Statements   : 38.84%
Branches     : 43.85% 
Functions    : 32.60%
Lines        : 39.69%
================================================================================
```