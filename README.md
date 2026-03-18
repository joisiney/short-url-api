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

## Como rodar localmente

1. Clone o repositório.
2. Crie seu arquivo de ambiente:
   - Para rodar via Docker Compose: `cp .env.docker.example .env`
   - Para rodar sem Docker Compose: `cp .env.example .env`
3. Inicie o ambiente completo com Docker Compose:
   ```bash
   docker compose up -d
   ```
4. A API estará acessível. Certifique-se de que a porta `3000` está livre.
5. Acesse a documentação Swagger em http://localhost:3000/api/docs.

### Como rodar localmente (sem Docker Compose para a API)
1. Suba apenas as dependências (Banco e Redis):
   ```bash
   docker compose up -d postgres redis
   ```
2. Instale as dependências usando `npm install`.
3. Inicie o projeto em modo dev `npm run start:dev`.

**Observação:**
Novos ADRs detalharão banco, domínio e infraestrutura. Atualmente o repositório encontra-se na fase de Bootstrap Inicial.
