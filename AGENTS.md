<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Lebenshilfe Project Architecture

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: MySQL via Prisma ORM
- **Auth**: better-auth (email/password + admin plugin)
- **API Contracts**: ts-rest (v3.53+) with Zod schemas
- **Styling**: Tailwind CSS v4
- **Linting**: ESLint + Prettier

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── page.tsx                  # Landing page
│   │
│   ├── _components/              # Shared frontend components (app-wide)
│   ├── _lib/                     # Shared frontend utilities (app-wide)
│   │   └── auth-client.ts        # better-auth browser client
│   │
│   ├── (public)/                 # Route group: public pages (no auth)
│   │   └── [feature]/
│   │       ├── page.tsx
│   │       ├── _components/      # Page-specific components
│   │       └── _lib/             # Page-specific utilities
│   │
│   ├── (auth)/                   # Route group: authenticated pages
│   │   ├── layout.tsx            # Auth guard layout
│   │   └── [feature]/
│   │       ├── page.tsx
│   │       ├── _components/
│   │       └── _lib/
│   │
│   └── api/                      # Backend API routes
│       ├── _lib/                 # Server-only infrastructure
│       │   ├── prisma.ts         # Prisma client singleton
│       │   └── auth.ts           # better-auth server config
│       │
│       ├── _services/            # Business logic layer
│       ├── _repositories/        # Data access layer (Prisma wrappers)
│       │
│       └── [resource]/           # REST API routes
│           ├── route.ts          # GET (list), POST (create)
│           └── [id]/route.ts     # GET (detail), PUT, DELETE
│
├── contracts/                    # ts-rest API contracts (shared boundary)
│   └── index.ts
│
├── types/                        # Shared TypeScript types (frontend + backend)
│
└── generated/                    # Auto-generated code (Prisma client)
    └── prisma/
```

## Architecture Rules

### 1. Frontend/Backend Separation

The frontend and backend are **strictly separated** by the `api/` boundary:

- **Everything under `app/api/`** is backend (server-only).
- **Everything else under `app/`** is frontend (pages + components).
- **`contracts/`** is the shared boundary — neither side owns it, both conform to it.
- **`types/`** holds shared TypeScript types used by both sides.

### 2. Co-located Components Pattern

Components and utilities live **next to where they are used**:

| Scope                          | Location                           |
| ------------------------------ | ---------------------------------- |
| Used by **one page**           | `app/.../page/_components/`        |
| Used by **one route group**    | `app/(group)/_components/`         |
| Used **app-wide**              | `app/_components/`                 |

The same applies to frontend utilities (`_lib/` folders).

**The `_` prefix** excludes these folders from Next.js routing — they will never become pages.

### 3. Backend Layering

Backend code follows a three-layer architecture:

```
route.ts  →  service  →  repository  →  Prisma/DB
(controller)  (business logic)  (data access)
```

- **Route handlers** (`route.ts`): Parse requests, call services, return responses. Thin.
- **Services** (`_services/`): Business logic, validation, orchestration. Framework-agnostic.
- **Repositories** (`_repositories/`): Prisma queries. No business logic.

### 4. ts-rest Contracts (Type-Safe API)

All API routes MUST be defined as **ts-rest contracts** in `src/contracts/`.

#### Defining a Contract

```typescript
// src/contracts/event.contract.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const eventContract = c.router({
  getAll: {
    method: "GET",
    path: "/api/events",
    responses: {
      200: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
        }),
      ),
    },
  },
  create: {
    method: "POST",
    path: "/api/events",
    body: z.object({
      title: z.string().min(1),
    }),
    responses: {
      201: z.object({ id: z.string(), title: z.string() }),
    },
  },
});
```

#### Backend: Implementing a Contract

```typescript
// src/app/api/events/route.ts
import { eventContract } from "@/contracts/event.contract";
import { eventService } from "@/app/api/_services/event.service";
import type { ServerInferResponses } from "@ts-rest/core";

type EventResponses = ServerInferResponses<typeof eventContract.getAll>;

export async function GET(): Promise<Response> {
  const events = await eventService.getAll();
  return Response.json(events satisfies EventResponses["200"]);
}
```

#### Frontend: Calling a Contract

```typescript
// In a client component
import { initClient } from "@ts-rest/core";
import { eventContract } from "@/contracts/event.contract";

const api = initClient(eventContract, { baseUrl: "" });

// Fully typed — body, params, and response
const { status, body } = await api.create({
  body: { title: "Workshop" },
});
```

**NEVER use raw `fetch()` for API calls.** Always use the ts-rest client.

### 5. Server-Only Guards

All server-side infrastructure files MUST include:

```typescript
import "server-only";
```

This causes a **compile-time error** if the file is accidentally imported from a client component. Apply to:

- `app/api/_lib/*.ts`
- `app/api/_services/*.ts`
- `app/api/_repositories/*.ts`

### 6. Route Groups

- `(public)/` — Pages that do NOT require authentication. Use a public layout (e.g., marketing navbar).
- `(auth)/` — Pages that REQUIRE authentication. The layout wraps children with an auth check.

Route groups do NOT affect the URL structure.

### 7. File Naming

- Components: `kebab-case.tsx` (e.g., `event-card.tsx`)
- Utilities/services: `kebab-case.ts` (e.g., `event.service.ts`)
- Types: `kebab-case.ts` (e.g., `event.ts`)
- Contracts: `[resource].contract.ts` (e.g., `event.contract.ts`)

### 8. Validation

Use **Zod** for all input validation. Define schemas in contracts (for API inputs) or in service files (for internal validation).

### 9. Data Fetching Patterns

| Pattern                              | When to Use                                                  |
| ------------------------------------ | ------------------------------------------------------------ |
| **Server Component** (direct import) | Reading data for a page. No client JS needed.                |
| **ts-rest client** (`initClient`)    | Client component needs data from the API.                    |
| **API Route** (`route.ts`)           | External consumers, webhooks, or when you need explicit REST. |

**Do NOT use Server Actions** (`"use server"`). They bypass the API contract boundary by letting frontend code call backend functions directly, breaking the strict frontend/backend separation.

### 10. Database

- **Provider**: MySQL
- **ORM**: Prisma
- **Schema**: `prisma/schema.prisma`
- **Generated client**: `src/generated/prisma/`
- **Prisma singleton**: `src/app/api/_lib/prisma.ts`

Always access Prisma through repositories, never directly from route handlers or services.
