# ============================================================
# Gestor Financiero - Backend Dockerfile
# Node.js + Express + Prisma
# ============================================================

FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# ---------- Etapa 2: Builder ----------
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

# ---------- Etapa 3: Runner (producción) ----------
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl dumb-init

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

WORKDIR /app

# Copiar solo lo necesario para producción
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/src ./src
COPY --from=builder --chown=expressjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=expressjs:nodejs /app/package*.json ./

USER expressjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# dumb-init maneja correctamente las señales del SO (SIGTERM, etc.)
ENTRYPOINT ["dumb-init", "--"]

# Ejecutar migraciones de Prisma y luego iniciar el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
