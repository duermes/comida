# Usa una imagen oficial de Node.js versión 20
FROM node:20

# Crea y establece el directorio de trabajo dentro del contenedor
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY next.config.ts ./
COPY src ./src
COPY public ./public

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
