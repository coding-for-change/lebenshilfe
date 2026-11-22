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

Every push to `main` builds the image and deploys it to infra-v2 (`.github/workflows/deploy.yml`):
the image goes to `docker-registry.codingforchange.com/lebenshilfe:<git sha>`, then the deploy job starts
the workflow `deploy-dispatch.yml` in `coding-for-change/infra-v2` and waits for it: it starts the
inactive blue/green slot, waits for its health check and switches Caddy. The deploy logs are in
infra-v2 (private). `prisma migrate deploy` runs when the container
starts, so every migration must also work with the previous version (both slots share the database).

The server side (compose file, runtime secrets, database, Caddy) lives in infra-v2, role
`lebenshilfe`. Runtime configuration and secrets are changed there, not in this repo.

Until the DNS switch, deploys land on `https://lebenshilfe-new.codingforchange.com`.

### GitHub secrets

| Secret | Where | Description |
|--------|-------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | repo | Build argument |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | repo | Build argument; must equal the value in infra-v2's vault and never change |
| `REGISTRY_*`, `DEPLOY_APP_ID`, `DEPLOY_APP_PRIVATE_KEY` | org | Set by infra-v2 (`playbook-setup-github.yml`) |
| `ANSIBLE_VAULT_PASSWORD` | repo | Only for `.config/secrets.yml`, still used by `deploy-feature.yml` |
