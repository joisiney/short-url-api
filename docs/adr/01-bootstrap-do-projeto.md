# ADR 01 — Bootstrap do Projeto

## Status

Proposto

## Contexto

O projeto consiste em uma API REST de encurtamento de URLs com operações de criação, consulta, atualização, remoção e leitura de estatísticas. A implementação deve usar **TypeScript com Node.js**, **NestJS**, **PostgreSQL**, **Swagger** e **Docker Compose**, além de seguir um conjunto extenso de diretrizes arquiteturais e de segurança.

Entre os direcionadores mais relevantes para a base inicial do projeto estão:

- organização por **domínio/feature**, não por tipo de arquivo global
- código em **TypeScript strict**
- uso de **Zod** para validação
- uso de **Drizzle** como modelagem e acesso ao banco
- bootstrap mínimo e simples
- observabilidade e segurança presentes desde o início
- facilidade para evolução incremental com commits pequenos
- ambiente previsível para desenvolvimento local e execução em container

Como este é o primeiro ADR da implementação, ele precisa estabelecer a base técnica e estrutural do projeto sem antecipar decisões detalhadas de domínio, banco, cache ou casos de uso específicos, que devem ficar em ADRs próprios.

## Decisão

Será criado um **bootstrap mínimo, tipado e orientado por feature**, com as seguintes decisões iniciais:

### 1. Framework principal

Adotar **NestJS** como framework backend da aplicação.

### 2. Linguagem e modo de compilação

Adotar **TypeScript** com modo estrito habilitado, incluindo no mínimo:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUncheckedIndexedAccess: true`

### 3. Estrutura inicial do projeto

A estrutura inicial será organizada por **contexto compartilhado + módulos por feature**, evitando diretórios globais gigantes por tipo de arquivo.

Estrutura base inicial:

```text
src/
  app/
    app.module.ts
    bootstrap.ts

  config/
    env.schema.ts
    app.config.ts

  shared/
    contracts/
    http/
    logger/
    utils/

  modules/
    short-url/
      short-url.module.ts
```

### 4. Validação

A estratégia oficial de validação do projeto será baseada em **Zod**.

Neste bootstrap inicial:

- Zod será preparado como biblioteca padrão de schemas
- a validação de variáveis de ambiente será feita com Zod
- a validação HTTP por pipes/camada dedicada será definida e introduzida em ADR específico posterior

### 5. Configuração da aplicação

A leitura de configuração será centralizada via **@nestjs/config**.

Regras iniciais:

- não espalhar `process.env` pelo código
- validar variáveis obrigatórias logo no boot
- falhar a inicialização se ambiente estiver inválido
- criar config factories por contexto conforme o projeto evoluir

No bootstrap inicial, será criada ao menos a configuração do contexto `app`.

### 6. Documentação da API

**Swagger/OpenAPI** será habilitado desde o início no projeto, ainda que inicialmente com poucos endpoints reais.

O objetivo é:

- deixar a base pronta para documentação viva
- garantir alinhamento entre contrato e implementação desde os primeiros casos de uso
- facilitar inspeção e avaliação incremental do projeto

### 7. Padrões de qualidade

Desde o bootstrap, o projeto deve incluir:

- lint
- format
- typecheck
- build

Esses comandos devem existir em `package.json` e servir de base para CI futura.

### 8. Organização mínima do bootstrap

O bootstrap inicial deve ser deliberadamente pequeno. Ele deve preparar somente o essencial para o projeto começar corretamente, sem antecipar complexidades que ainda não precisam existir.

Inclui:

- inicialização do Nest
- configuração global mínima
- desabilitar `x-powered-by` quando aplicável
- preparação para prefixo global de API, se adotado
- preparação para Swagger
- tratamento básico de shutdown para evolução futura

Não inclui ainda:

- implementação completa de filtros/interceptors/pipes
- módulo de banco completo
- Redis completo
- throttling
- domínio da feature implementado
- repositórios concretos
- casos de uso completos

### 9. Convenções iniciais de nomenclatura

Desde o bootstrap, o projeto deve adotar convenções previsíveis:

- pastas em `kebab-case`
- arquivos com nomes explícitos por responsabilidade
- classes em PascalCase
- módulos pequenos e coesos
- evitar exports desnecessários

### 10. README inicial

Já no bootstrap, deve existir um `README.md` na raiz contendo ao menos:

- objetivo do projeto
- stack principal
- pré-requisitos
- comandos básicos
- como rodar localmente
- observação de que novos ADRs detalharão banco, domínio e infraestrutura

## Consequências

### Positivas

- cria uma base previsível para desenvolvimento incremental
- reduz retrabalho estrutural nas próximas tasks
- força disciplina de tipagem desde o começo
- prepara a aplicação para validação forte com Zod
- facilita evolução por feature em vez de estrutura genérica por tipo de arquivo
- deixa o projeto pronto para documentação com Swagger
- melhora a clareza para avaliação técnica e revisão de código

### Negativas

- adiciona um pouco mais de rigor inicial do que um bootstrap improvisado
- exige definição de convenções cedo
- pode parecer mais “formal” para um desafio pequeno, embora essa formalidade reduza débito técnico futuro

### Riscos controlados

- risco de overengineering no bootstrap: mitigado mantendo o escopo mínimo
- risco de acoplamento precoce: mitigado separando apenas a base necessária e adiando detalhes para ADRs específicos
- risco de estrutura inflada: mitigado criando apenas diretórios essenciais no primeiro commit

## Alternativas consideradas

### 1. Usar Express puro

Rejeitada.

Motivo:

- o desafio permite NestJS ou Express, mas NestJS oferece melhor estrutura para modularidade, providers, interceptors, filtros e organização arquitetural que combinam melhor com os requisitos exigidos.

### 2. Estruturar por tipo de arquivo global

Exemplo rejeitado:

```text
src/
  controllers/
  services/
  repositories/
  dto/
```

Motivo:

- esse formato degrada rapidamente conforme a aplicação cresce
- aumenta acoplamento entre contextos
- dificulta manutenção orientada por domínio/feature

### 3. Adiar strict mode para depois

Rejeitada.

Motivo:

- ativar strict mais tarde normalmente aumenta custo de correção
- o projeto já nasce pequeno, então o momento ideal para endurecer tipagem é no primeiro commit

### 4. Usar class-validator/class-transformer

Rejeitada.

Motivo:

- a diretriz da solução é usar **Zod**
- queremos uma estratégia única e explícita de validação, sem duplicar modelos ou misturar abordagens

### 5. Não subir Swagger no bootstrap

Rejeitada.

Motivo:

- deixar Swagger pronto desde cedo reduz fricção para documentação incremental e teste manual
- combina com a exigência do desafio e com a necessidade de refletir a implementação real

## Escopo deste ADR

Este ADR define somente a **base inicial do projeto**.

Ele não decide detalhadamente:

- modelagem do banco
- migrations
- estratégia de repositório com Drizzle
- schema da feature short-url
- rate limit com Redis
- contratos HTTP finais
- filtros/interceptors definitivos
- estratégia de testes detalhada
- Docker Compose final

Esses pontos devem ser cobertos em ADRs próprios.

## Critérios de aceite do bootstrap

O bootstrap será considerado concluído quando o projeto tiver:

- aplicação NestJS inicializando corretamente
- TypeScript strict configurado
- estrutura inicial por feature criada
- `@nestjs/config` configurado
- validação de env com Zod funcionando
- Swagger disponível
- scripts de lint, format, typecheck e build configurados
- README inicial presente

## Exemplo de resultado esperado

Ao final desta tarefa, o projeto já deve permitir:

- instalar dependências
- subir a aplicação localmente
- validar ambiente no boot
- acessar documentação Swagger
- servir como fundação limpa para os próximos ADRs e próximas tasks

## Próximos ADRs relacionados

- ADR 02 — Infra local com Docker Compose
- ADR 03 — Configuração e validação de environment
- ADR 04 — Base compartilhada HTTP
- ADR 05 — Schema do banco e migrations
- ADR 06 — Módulo de domínio short-url

