# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
ENV npm_config_cache=/tmp/.npm-cache
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts

FROM deps AS builder
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate && npm run build

FROM base AS production-deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --ignore-scripts \
  && npx prisma generate \
  && npm cache clean --force

FROM base AS production
ENV NODE_ENV=production
ENV PORT=8080
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node --from=production-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
CMD ["node", "dist/server.js"]
