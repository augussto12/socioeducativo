FROM node:20-alpine

# Instalar OpenSSL para resolver el problema de Prisma en Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

RUN mkdir -p uploads/shields

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
