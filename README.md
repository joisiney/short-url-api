# Short URL API

## Objetivo do projeto
Este projeto implementa uma API REST de encurtamento de URLs, com operações de criação, consulta, atualização, remoção e leitura de estatísticas. O foco é uma arquitetura orientada por domínio/feature, alta qualidade de código com tipagem estrita, além de foco em escalabilidade e previsibilidade no desenvolvimento.

## Stack principal
- Node.js com TypeScript Estrito
- NestJS
- PostgreSQL com Drizzle ORM
- Zod para validação
- Swagger/OpenAPI para documentação completa
- Docker Compose para infraestrutura local

## Pré-requisitos
- Node.js (>= 20.x)
- npm ou yarn
- Docker e Docker Compose

## Comandos básicos

```bash
# Instalar dependências
npm install

# Rodar em modo de desenvolvimento
npm run start:dev

# Rodar build
npm run build

# Executar formatação
npm run format

# Executar lint
npm run lint

# Checagem de tipagem
npm run typecheck
```

## Como rodar localmente com Docker Compose

A forma recomendada de rodar o projeto localmente é utilizando o Docker Compose, que configurará automaticamente a API, o banco de dados PostgreSQL e o Redis.

1. Clone o repositório.
2. Certifique-se de que as portas `3000`, `5432` e `6379` estão livres.
3. Copie o arquivo de exemplo de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
4. Suba a infraestrutura local:
   ```bash
   docker compose up -d
   ```
5. O container da API suporta hot reload através de mapeamento de volume. Qualquer alteração no código refletirá automaticamente.
6. Acesse a documentação Swagger em http://localhost:3000/api/docs.

Para derrubar a infraestrutura local:
```bash
docker compose down
```

**Observação:**
Novos ADRs detalharão banco, domínio e infraestrutura. Atualmente o repositório encontra-se na fase de Bootstrap Inicial.

## Banco de Dados e Migrations

A camada de dados utiliza Drizzle ORM. Quando houver alterações de schema, ou na necessidade de aplicar as migrações criadas para o banco, utilize os seguintes comandos:

```bash
# Gerar uma nova migration baseada nas alterações feitas no schema
npm run db:generate

# Aplicar as migrations pendentes no banco de dados
npm run db:migrate
```
