# ============================================================
# Gestor Financiero - Frontend Dockerfile
# React (Vite)
# ============================================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de producción de React/Vite
# La variable VITE_API_URL se inyecta en tiempo de build
ARG VITE_API_URL=http://localhost/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Etapa 3: Runner con Nginx ----------
FROM nginx:1.25-alpine AS runner

# Eliminar la config por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuración personalizada de Nginx para el frontend
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copiar el build estático de React
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
