FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/src ./packages/database/src
COPY apps/api/package.json ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src

RUN npm install --workspace=packages/shared --workspace=packages/database --workspace=apps/api
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/database/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/index.js"]
