# Base images are pinned by digest for supply-chain integrity (audit finding F-18).
# The sha256 below is the multi-arch index digest of node:22-alpine, so the build
# still resolves the correct per-architecture image while the tag stays immutable.
#
# Update cadence: Dependabot (docker ecosystem, see .github/dependabot.yml) opens a
# PR weekly to bump these digests. To update manually, run:
#   docker buildx imagetools inspect node:22-alpine --format '{{.Manifest.Digest}}'
# and replace the sha256 on all three FROM lines below.

# ---- Dependencies ----
FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Builder ----
FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Build Next.js (standalone output)
RUN npm run build

# ---- Runner ----
FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone server
COPY --from=builder /app/.next/standalone ./
# Copy static assets
COPY --from=builder /app/.next/static ./.next/static
# Copy public assets
COPY --from=builder /app/public ./public
# Copy required files for Prisma migrations and seeding
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
