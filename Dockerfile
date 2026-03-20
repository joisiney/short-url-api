FROM node:20-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["sh", "-c", "npm install && npm run start:dev"]
