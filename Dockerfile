# Self-host Dub (links-only, no-auth) on Railway.
# Builds apps/web as a Next.js standalone Node server from the pnpm/turbo monorepo.
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
# openssl needed by Prisma engines
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# ---- deps: install the whole workspace (needs every package.json for the graph) ----
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile --prod=false

# ---- builder: build web (turbo builds its workspace deps first) ----
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Dub's Next.js build is large; default ~4GB heap OOMs (exit 134). Give it room.
ENV NODE_OPTIONS=--max-old-space-size=8192
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# reinstall to link workspace packages that were copied after deps stage
RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm turbo run build --filter=web...

# ---- runner: standalone server ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
# standalone output (outputFileTracingRoot = monorepo root) lands the whole traced tree here
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
# Prisma query engine + generated client (in case tracing misses them)
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]

# self-host build 1784296837
