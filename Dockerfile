# Dockerfile para Next.js News Aggregator

# Stage 1: Dependencies
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci

# Stage 2: Builder
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de Next.js
RUN npm run build

# Stage 3: Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
    ELPAIS_PYTHON=/opt/elpais-venv/bin/python

RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv \
    && python3 -m venv /opt/elpais-venv \
    && /opt/elpais-venv/bin/pip install --no-cache-dir playwright==1.52.0 beautifulsoup4==4.13.4 \
    && /opt/elpais-venv/bin/python -m playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root por seguridad
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs --home-dir /app nextjs

# Copiar archivos necesarios para producción
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts/elpais_capture.py ./scripts/elpais_capture.py

# Cambiar permisos
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
