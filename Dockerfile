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
# Railway does NOT inject service env into Dockerfile builds. Two consequences:
#  1) NEXT_PUBLIC_* vars must be baked in at build -> pass them as ARGs (Railway
#     injects matching service variables as build args) so the self-host domains stick.
#  2) module-scope SDK clients (Stripe/Upstash Vector/QStash/Resend/...) THROW on
#     missing env during "collect page data" -> give them dummy build-time values.
#     Real values come from Railway service vars at RUNTIME (they override these).
ARG NEXT_PUBLIC_APP_DOMAIN
ARG NEXT_PUBLIC_SHORT_DOMAIN
ENV NEXT_PUBLIC_APP_DOMAIN=$NEXT_PUBLIC_APP_DOMAIN \
    NEXT_PUBLIC_SHORT_DOMAIN=$NEXT_PUBLIC_SHORT_DOMAIN \
    STRIPE_SECRET_KEY=sk_test_dummy \
    STRIPE_APP_SECRET_KEY=sk_test_dummy \
    UPSTASH_REDIS_REST_URL=http://localhost \
    UPSTASH_REDIS_REST_TOKEN=dummy \
    UPSTASH_VECTOR_REST_URL=http://localhost \
    UPSTASH_VECTOR_REST_TOKEN=dummy \
    QSTASH_URL=https://qstash.upstash.io \
    QSTASH_TOKEN=dummy \
    QSTASH_CURRENT_SIGNING_KEY=sig_dummy \
    QSTASH_NEXT_SIGNING_KEY=sig_dummy \
    RESEND_API_KEY=re_dummy \
    TINYBIRD_API_KEY=dummy \
    TINYBIRD_API_URL=https://api.tinybird.co \
    OPENAI_API_KEY=sk-dummy \
    ANTHROPIC_API_KEY=sk-ant-dummy \
    UNKEY_ROOT_KEY=dummy \
    AXIOM_TOKEN=dummy \
    ENCRYPTION_KEY=ZHVtbXlfYnVpbGRfa2V5X18zMmJ5dGVzX18wMDAwMDA= \
    NEXTAUTH_SECRET=build_dummy_secret \
    UNSUBSCRIBE_TOKEN_SECRET=build_dummy_secret
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
