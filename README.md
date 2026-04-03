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

The application is automatically deployed to the c4c VPS via a GitHub Actions workflow (`.github/workflows/deploy.yml`) on every push to the `main` branch. 

To enable deployments, the following **Repository Secrets** must be configured in GitHub:

| Secret | Description |
|--------|-------------|
| `REGISTRY_USERNAME` | Username for the private Docker registry |
| `REGISTRY_PASSWORD` | Password for the private Docker registry |
| `VPS_DEPLOY_KEY` | SSH private key for the `deploy-lebenshilfe` user on the VPS |
| `DATABASE_URL` | Production PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Production secret for Better Auth sessions |
