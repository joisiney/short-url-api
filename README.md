# Short URL API

API REST de encurtamento de URLs. Permite criar, consultar, atualizar e remover URLs curtas, além de consultar estatísticas de acesso. Arquitetura orientada por domínio, tipagem estrita e validação com Zod.

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

## Funcionalidades

- Criar short URL
- Obter URL original por short code
- Atualizar short URL
- Deletar short URL
- Consultar estatísticas de acesso

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

1. Copie o env:
   ```bash
   cp .env.example .env
   ```
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

O Redis e usado para **cache** e **seguranca** (ADR-00-14):

- **Rate limit distribuido**: Throttler com storage Redis; limites por rota (POST /shorten: 20 req/min, GET /shorten/:shortCode: 100 req/min)
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

## Testes

### Unitários

Rodam em memória, sem banco nem Redis:

```bash
npm run test
```

Arquivos: `src/**/*.spec.ts`.

### Integração e E2E

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

3. Execute os testes:
   ```bash
   npm run test:integration   # Repositório + banco
   npm run test:e2e           # API completa (NestJS in-memory + supertest)
   ```

   Ou ambos: `npm run test:all`

**Observações:**

- Os testes e2e bootam a aplicação NestJS em memória e fazem requisições via supertest; não é necessário subir a API em outro processo.
- O `.env.test` aponta para `localhost:5432` e `localhost:6379`; o Docker Compose expõe essas portas.
- Se postgres ou redis não estiverem rodando, os testes falham com erro de conexão.

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

## ADRs

Decisões arquiteturais estão em `adr/`. O README cobre onboarding e execução; os ADRs detalham trade-offs e racional técnico.
