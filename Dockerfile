# Imagem base com versão fixada
FROM node:22.14.0-alpine

# Define diretório de trabalho padrão
WORKDIR /usr/src/app

# Copia arquivos de definição de pacotes
COPY package*.json ./

# Instala todas as dependências do projeto
RUN npm ci

# Copia o restante do código da aplicação
COPY . .

# Expõe a porta que o NestJS utilizará
EXPOSE 3000

# Comando para iniciar em desenvolvimento (com hot-reload configurado via volume no compose)
CMD ["npm", "run", "start:dev"]
