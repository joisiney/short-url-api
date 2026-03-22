# ADR 18 — Path Aliases e Regras para IA

## Status

Implementado

## Contexto

O projeto utiliza imports relativos profundos entre camadas (`../../../../shared/utils/result`, `../../../modules/short-url/domain/constants/...`), o que prejudica legibilidade, manutenção e facilita erros ao mover arquivos. Além disso, não existe documentação persistente para que agentes de IA (ex.: Cursor) sigam convenções do projeto após cada tarefa, como executar `lint:fix` e testes para validar alterações.

O tsconfig atual possui `baseUrl: "./"` mas não define `paths`. O NestJS usa `moduleResolution: nodenext` e `module: nodenext`. O pacote `tsconfig-paths` já está presente em devDependencies.

## Decisão

1. **Path aliases por camada:** configurar aliases no TypeScript para as pastas raiz de `src/`:
   - `@config` / `@config/*` -> `src/config`
   - `@infra` / `@infra/*` -> `src/infra`
   - `@shared` / `@shared/*` -> `src/shared`
   - `@modules` / `@modules/*` -> `src/modules`

2. **Runtime:** registrar `tsconfig-paths/register` no script `start:prod` para que o Node resolva os aliases em produção.

3. **Jest:** adicionar `moduleNameMapper` espelhando os paths em todos os configs (unit, integration, e2e).

4. **Migração e regra de imports:** todas as importações devem usar aliases absolutos, exceto imports do mesmo diretório para frente (`./`). Qualquer import que use `../` (sobe na árvore) deve ser convertido para alias. Exceção: apenas imports com `./` (ex.: `./use-cases/create-short-url.use-case`, `./env-variables`) permanecem relativos.

5. **Regras Cursor:** criar arquivos em `.cursor/rules/`:
   - `path-aliases.mdc`: documenta os aliases e convenções de import (globs: `**/*.ts`, alwaysApply: false).
   - `post-task-checklist.mdc`: checklist pós-tarefa (lint:fix, testes) para a IA seguir (alwaysApply: true).

## Mapeamento de aliases

| Alias | Caminho | Exemplo de import |
|-------|---------|-------------------|
| `@config` | `src/config` | `import { AppConfig } from '@config/app.config'` |
| `@infra` | `src/infra` | `import { RedisService } from '@infra/redis/redis.service'` |
| `@shared` | `src/shared` | `import { Result } from '@shared/utils/result'` |
| `@modules` | `src/modules` | `import { SHORT_CODE_MIN_LENGTH } from '@modules/short-url/domain/constants/short-code.constants'` |

## Alternativas consideradas

| Alternativa | Motivo de não escolha |
|-------------|------------------------|
| Aliases por módulo (`@short-url/domain`) | Mais verboso; `@modules/short-url/domain` já cobre o caso e escala para novos módulos. |
| Manter apenas imports relativos | Legibilidade ruim; imports com 4+ níveis são frágeis. |
| Barrel exports (`shared/index.ts`) | Evitado (MEC); imports diretos por arquivo. |
| Regras apenas em user rules | Regras em `.cursor/rules/` são específicas do projeto e versionadas no repositório. |

## Consequências

- **Positivas:** imports mais legíveis; convenções documentadas e versionadas; checklist pós-tarefa para IA; menor risco de quebra ao mover arquivos.
- **Negativas:** dependência de `tsconfig-paths` em runtime; necessidade de manter `moduleNameMapper` em sincronia com `tsconfig.paths`.
- **Trade-off:** o `tsc` não resolve paths no output; o Node precisa de `tsconfig-paths` em runtime. Alternativa seria `tsc-alias` no build para substituir paths no output; optou-se por `tsconfig-paths` por simplicidade e dependência já existente.

## Plano de implementação

1. Adicionar `paths` em `tsconfig.json`.
2. Alterar `package.json`: `start:prod` com `-r tsconfig-paths/register`; `moduleNameMapper` no Jest unit.
3. Alterar `test/jest-integration.json` e `test/jest-e2e.json` com `moduleNameMapper`.
4. Migrar imports nos arquivos identificados (shared, infra, config, modules).
5. Criar `.cursor/rules/path-aliases.mdc` e `.cursor/rules/post-task-checklist.mdc`.
6. Gate: `pnpm lint:fix`, `pnpm test`, `pnpm build`, `pnpm start:prod` (smoke).

## Regra de imports

- **Obrigatório:** todo import que use `../` (sobe na árvore) deve usar alias absoluto.
- **Exceção:** imports do mesmo diretório ou para frente (`./`) podem permanecer relativos (ex.: `./use-cases/create-short-url.use-case`, `./contracts/short-url.response`).

## Critérios de aceite

- Todas as importações com `../` usam aliases absolutos.
- `pnpm build` e `pnpm start:prod` executam sem erro.
- `pnpm test`, `pnpm test:integration`, `pnpm test:e2e` passam.
- Regras Cursor criadas e documentadas.

## Referências

- [ADR 13](13-convencoes-de-ci-lint-format-e-commit.md) — Convenções de CI, lint, format e commit
- Plano: aliases e regras IA (path aliases, checklist pós-tarefa)
