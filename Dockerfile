# Base images are pinned by digest for supply-chain integrity (audit finding F-18).
# The sha256 below is the multi-arch index digest of node:22-alpine, so the build
# still resolves the correct per-architecture image while the tag stays immutable.
#
# Update cadence: Dependabot (docker ecosystem, see .github/dependabot.yml) opens a
# PR weekly to bump these digests. To update manually, run:
#   docker buildx imagetools inspect node:22-alpine --format '{{.Manifest.Digest}}'
# and replace the sha256 on all three FROM lines below.

# ---- Dependencies ----
FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Builder ----
FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Encrypts Server Action references. Must be the SAME value at build and runtime
# and stable across deploys, otherwise a tab from a previous build can no longer
# invoke actions (its encrypted args fail to decrypt). If unset, Next generates
# a fresh key per build — which is what breaks open tabs on every deploy.
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

# Build Next.js (standalone output)
RUN npm run build

# ---- Runner ----
FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS runner
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
