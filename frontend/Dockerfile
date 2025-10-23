# Usa una imagen oficial de Node.js versión 20
FROM node:20

# Crea y establece el directorio de trabajo dentro del contenedor
WORKDIR /app

ENV NPM_CONFIG_LEGACY_PEER_DEPS=1 \
    NEXT_TELEMETRY_DISABLED=1S

COPY package*.json  package-lock.json* ./

RUN npm install --legacy-peer-deps

COPY next.config.ts ./
COPY src ./src
COPY public ./public

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
