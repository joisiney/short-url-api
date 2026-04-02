# ADR 20 — Validação compartilhada de conexão PostgreSQL

## Status

Aceito.

## Contexto

- O CLI do Drizzle (`drizzle.config.ts`) e o helper de testes (`test/helpers/db-test.helper.ts`) precisam das mesmas variáveis `PG_*` que a aplicação NestJS.
- Defaults silenciosos em um lugar e regras estritas em outro geram divergência e falhas difíceis de diagnosticar.
- O projeto já valida o ambiente completo com `class-validator` em `EnvVariables`, mas `parseEnv` cobre o conjunto inteiro de chaves e aplica defaults opcionais, o que não serve para um recorte só Postgres fora do bootstrap.

## Decisão

1. **DTO `PgConnectionEnvDto`** em `src/config/pg-connection-env.dto.ts` concentra os campos `PG_HOST` a `PG_SSL` com os mesmos decorators já usados em `EnvVariables` (fonte única de regras).
2. **`PgConnectionEnv` estende o DTO** em `src/config/pg-connection-env.ts` e expõe projeções explícitas: `toDatabaseUrl()` (Drizzle) e `toPgPoolConfig()` (`pg` Pool).
3. **`parsePgConnectionEnv(input, contextLabel)`** em `src/config/parse-pg-connection-env.ts` usa `plainToInstance`, `validateSync` e `flattenValidationErrors`; em falha lança `Error` com prefixo identificável (`[drizzle.config]`, `[db-test.helper]`) e lista campo/mensagem. Não há cache (diferente de `parseEnv`).
4. **`EnvVariables` estende `PgConnectionEnvDto`** para não duplicar o bloco `PG_*`.
5. **`IsHostLikeConstraint`** foi movido para `src/shared/validation/is-host-like.constraint.ts`; `envScalarToString` para `src/shared/validation/env-scalar-to-string.ts` para reutilização sem dependência circular.
6. **`import 'reflect-metadata'`** no módulo do parser garante metadata de decorators quando o código roda fora do Nest (CLI Drizzle, Jest).

## Consequências

- **Positivas**: uma única definição de regras para Postgres; mensagens de validação consistentes; erros explícitos quando `.env` / `.env.test` estão incompletos ou inválidos.
- **Negativas / cuidados**: qualquer mudança nas regras de `PG_*` deve ocorrer no DTO (ou ser refletida nele se ainda existir duplicação acidental em outro lugar).
- **Operação**: desenvolvedores devem manter `.env` e `.env.test` alinhados ao `.env.example` para comandos `db:*` e testes que usam `createTestDb`.

## Referências de código

- `src/config/pg-connection-env.dto.ts`
- `src/config/pg-connection-env.ts`
- `src/config/parse-pg-connection-env.ts`
- `src/config/env-variables.ts`
- `src/infra/database/drizzle.config.ts`
- `test/helpers/db-test.helper.ts`
