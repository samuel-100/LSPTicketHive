FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
COPY apps/web/ ./apps/web/

RUN npm install --workspace=packages/shared --workspace=apps/web
RUN npm run build --workspace=apps/web

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
