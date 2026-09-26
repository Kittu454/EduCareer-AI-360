FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci

COPY backend ./
COPY database/prisma ../database/prisma

RUN npx prisma generate --schema ../database/prisma/schema.prisma

RUN npm run build

EXPOSE 8000

ENV PORT=8000
ENV NODE_ENV=production

CMD ["npm", "start"]
