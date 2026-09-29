# Dockerfile
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN GENERATE_OPENAPI=true npm run build

EXPOSE 3001
CMD ["node", "dist/main.js"]