# Lebenshilfe

A Next.js application for Lebenshilfe, built with Prisma and Better Auth.

## Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Docker](https://www.docker.com/) (for the local PostgreSQL database)

### 1. Install dependencies

```bash
npm install
```

### 2. Start the database

Spin up the local PostgreSQL instance:

```bash
docker compose up -d
```

This starts a PostgreSQL 17 container on port `5432` with default dev credentials (see `docker-compose.yml`).

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then generate a secret for Better Auth:

```bash
# macOS / Linux
openssl rand -base64 32
```

Paste the output into `BETTER_AUTH_SECRET` in your `.env` file.

### 4. Set up the database

Push the Prisma schema to your local PostgreSQL:

```bash
npx prisma db push
```

Generate the Prisma client:

```bash
npx prisma generate
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| Framework      | [Next.js](https://nextjs.org/) (App Router)       |
| Database       | PostgreSQL (via Docker Compose)                    |
| ORM            | [Prisma](https://www.prisma.io/)                  |
| Authentication | [Better Auth](https://www.better-auth.com/)       |
| Styling        | [Tailwind CSS](https://tailwindcss.com/)           |

## Authentication

Authentication is handled by Better Auth with email/password sign-up/sign-in. The admin plugin provides two roles:

- **admin** — full control over user management
- **user** — default role for regular users

API routes for auth are served at `/api/auth/*`.

## Deployment

The application is automatically deployed to the c4c VPS on every push to the `main` branch
(`.github/workflows/deploy.yml`). The deployment itself lives in the infra repo
([`coding-for-change-infra`](https://github.com/coding-for-change/coding-for-change-infra),
`docs/LEBENSHILFE_BLUE_GREEN.md`): the pipeline builds and pushes the image, commits the new image
tag to `ansible/releases/lebenshilfe.yml` in the infra repo and runs its
`playbooks/lebenshilfe-deploy.yml`. That starts the inactive blue/green slot, waits until it is
healthy and then switches Caddy over. Runtime secrets, the Compose file and the Caddyfile are managed
in the infra repo, not here.

### GitHub Repository Secrets

These **must** be set in GitHub → Settings → Secrets and Variables → Actions:

| Secret | Description |
|--------|-------------|
| `ANSIBLE_VAULT_PASSWORD` | Password to decrypt `.config/secrets.yml` (registry login, build args, deploy SSH key) and the infra repo's vault values |
| `INFRA_REPO_TOKEN` | Token that can push to `main` of the infra repo (release commit) |

### Non-Secret Environment Variables

These are set in the infra repo (`ansible/roles/lebenshilfe`, defaults and Compose template), not in this repo:

| Variable | Value | Description |
|----------|-------|-------------|
| `BETTER_AUTH_URL` | `https://lebenshilfe.codingforchange.com` | Canonical URL used by Better Auth |
| `NEXT_PUBLIC_APP_URL` | `https://lebenshilfe.codingforchange.com` | Base URL used in email links (invitations, password reset) |
| `EMAIL_FROM` | `info@codingforchange.de` | "From" address for all outgoing emails |