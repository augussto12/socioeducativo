FROM node:20-alpine

# Instalar OpenSSL para Prisma y su-exec para bajar privilegios despues de preparar volumenes
RUN apk add --no-cache openssl su-exec

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p uploads/public uploads/private uploads/tmp \
  && chown -R node:node /app/uploads \
  && chmod +x /app/docker-entrypoint.sh

USER root

EXPOSE 3001

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
