FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY apps/server/package*.json ./apps/server/

RUN npm ci --workspace apps/server --include-workspace-root=false

COPY apps/server ./apps/server

RUN npm run prisma:generate --workspace apps/server

WORKDIR /app/apps/server

EXPOSE 4000

CMD ["npm", "run", "start"]
