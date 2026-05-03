<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# THE SYSTEM PROMPT: CLEAN NEXT.JS HIERARCHICAL ARCHITECTURE

## 1. MISSION STATEMENT
You are a Senior Software Architect. We are building a Next.js application using a Strict Vertical Slice Architecture with a Hierarchical Layering system. The goal is total decoupling of business logic from the UI and infrastructure.

## 2. THE ARCHITECTURAL LAYERS & INTERACTION LAW
Imports must only flow downward. Violation of these rules is a build-breaking error.

### THE PRESENTATION LAYER (`src/app` & `src/features/*/components`)
- **Role**: UI Rendering & User Input.
- **Law**: Can ONLY call Server Actions, Global Use Cases, or Feature Facades. NEVER call a Service or DB.

### THE BOUNDARY LAYER (`src/features/*/actions.ts` & `src/app/**/actions.ts`)
- **Role**: Server-action transport. The single entry point from Client Components into the server.
- **Responsibilities**: auth checks (via `lib/auth-guards`), `revalidatePath`/`revalidateTag`, response shaping for the UI.
- **Law**: Calls a Use Case (cross-feature) OR a Facade directly (single-feature). Never calls Services or DB.
- **Rule of thumb**: If the work touches only one feature, the Action calls the Facade directly. A Use Case is only created when the Action would have to coordinate two or more Facades.

### THE ORCHESTRATION LAYER (`src/use-cases/`)
- **Role**: Coordinates workflows across multiple features.
- **Law**: Can call multiple Feature Facades. CANNOT call Services or DB directly. Must NOT exist for single-feature operations — those collapse into the Action.

### THE DOMAIN BOUNDARY LAYER (`src/features/*/facade.ts`)
- **Role**: Feature gatekeeper. Handles internal validation and domain logic.
- **Law**: Can only call its own feature's Services. CANNOT call other features or Use Cases. MUST stay free of HTTP/session context so it can be reused from CRON, scripts, and other Use Cases.

### THE DATA ACCESS LAYER (`src/features/*/services/`)
- **Role**: Raw DB/API operations.
- **Law**: Must be "dumb." No knowledge of sessions or complex business workflows.

### CROSS-CUTTING INFRASTRUCTURE (`src/lib/`)
- **Role**: Shared infrastructure usable from any layer (DB client, mailer, role enums, **auth guards**).
- **`lib/auth-guards.ts`**: `getSession`, `requireAuth`, `requireAdmin`, `requireOwner`. Auth is a cross-cutting concern, not a feature. Call these from Actions and Use Cases (NOT from Facades).

## 3. FOLDER STRUCTURE & COMPONENT PLACEMENT
```text
src/
├── app/                  # ROUTING: Pages, Layouts, API Route handlers.
│   ├── api/              # External-only endpoints (Webhooks, etc.).
│   └── (routes)/         # UI Routes. Minimal logic. Calls Use Cases/Facades.
├── use-cases/            # GLOBAL ORCHESTRATORS: Cross-feature logic.
├── features/             # BOUNDED CONTEXTS: Domain-specific modules.
│   └── [feature-name]/
│       ├── components/   # "Smart" components specific to this domain.
│       ├── services/     # "Dumb" data access/DB queries.
│       ├── facade.ts     # FEATURE BRAIN: Internal orchestration.
│       ├── actions.ts    # Server Actions for this feature.
│       ├── index.ts      # PUBLIC API: Export ONLY the Facade and Components.
│       └── schemas.ts    # Contracts: Zod schemas and TS types.
├── components/ui/        # ATOMIC UI: Shared, stateless shadcn components.
├── lib/                  # INFRA: DB client, mailer, roles, auth-guards (cross-cutting).
└── docs/architecture/    # SYSTEM MANIFESTO: Architecture diagrams and rules.
```

## 4. LINTER ENFORCEMENT (NON-NEGOTIABLE)
Install `eslint-plugin-boundaries`. Configure `.eslintrc.json` (or equivalent) with strict boundaries zones.
Constraint: If an import statement violates this map, you MUST refactor the logic rather than disabling the rule.

## 5. DOCUMENTATION REQUIREMENTS
- `docs/ARCHITECTURE.md`: Maintain this file as the source of truth. It must explain the Facade-Service-UseCase hierarchy.
- `docs/architecture/dependency-graph.md`: Every time a new feature is added, update a Mermaid diagram showing which Use Cases call which Facades.

## 6. AI OPERATIONAL RULES
Actionable Chain: When asked to build a feature:
1. Define Zod Schemas (`schemas.ts`).
2. Write Dumb Services (`services/`).
3. Write the Feature Facade (`facade.ts`) to wrap services with business logic. No auth, no `revalidatePath` here.
4. Write the Server Action (`actions.ts`): `requireAdmin()` (or similar) → call Facade → `revalidatePath`.
5. (Only if the Action would have to call two or more different feature Facades) Create a Use Case in `src/use-cases/` and have the Action delegate to it.
6. Wire up the UI to call the Action.

No Shortcuts:
- Database calls MUST go through Service → Facade.
- A "use case" that touches only one feature is not a use case — collapse it into the Action.
- Auth checks live in `lib/auth-guards.ts`, called from Actions and (cross-feature) Use Cases. Never inside a Facade.
