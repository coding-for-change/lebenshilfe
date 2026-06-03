# Next.js Application Architecture

We are building a Next.js application using a Strict Vertical Slice Architecture with a Hierarchical Layering system. The goal is total decoupling of business logic from the UI and infrastructure, ensuring the app remains maintainable and type-safe as it scales.

## The Architectural Layers & Interaction Law

You must strictly adhere to these four layers. Imports may only flow downward.

### 1. The Presentation Layer (`src/app` & `src/features/*/components`)
- **Components**: Responsible for UI only.
- **Server Actions**: Entry point for mutations.
- **Law**: Can ONLY call Global Use Cases or Feature Facades. Never call a Service or Database directly.

### 2. The Orchestration Layer (`src/use-cases/`)
- **Role**: Coordinates workflows that involve multiple features.
- **Example**: `processCheckout.ts` might call `CartFacade`, `PaymentFacade`, and `EmailFacade`.
- **Law**: Can call multiple Feature Facades. Cannot call Services or DB directly.

### 3. The Domain Boundary Layer (`src/features/*/facade.ts`)
- **Role**: The "Brain" of the feature. Handles Zod validation, internal permission checks, and domain-specific business rules.
- **Law**: Acts as the Gatekeeper. It coordinates the feature's internal Services. It cannot call other Features or Global Use Cases.

### 4. The Data Access Layer (`src/features/*/services/`)
- **Role**: Infrastructure-specific code (Drizzle/Prisma queries, external API fetches).
- **Law**: "Dumb" and reusable. Does not know about the user session or complex business workflows.

## Folder Structure Definition

```text
src/
├── app/                  # ROUTING: Pages, Layouts, and API Route handlers.
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
├── components/           # ATOMIC UI: Shared, stateless shadcn components.
├── lib/                  # INFRA: DB clients, Auth config, Shared utils.
└── docs/                 # ARCHITECTURE: The system manifesto.
```

## Manifesto Rules
- **Deep-linking into a feature's `/services` folder is a build-breaking offense.**
- **Every Feature MUST expose its logic through a single `facade.ts`.**

## Feature Notes

### Handlungsbedarf dashboard (COD-50)
`/admin/handlungsbedarf` surfaces problematic cases for a selectable week
(sick Schulbegleiter without a Vertretung, sick substitutes, abated children
who still have a booked Einsatz, unstaffed Stundenplan blocks, booked hours
over the Stundenplan, and missing Stammdaten such as the
Schweigepflichtsentbindung).

It lives **inside the `children` feature** rather than in a Use Case: every
input is reachable from the children domain (children with their assignments,
Stundenplan, absences and Vertretungen, plus the `Event` rows the children
services already own), so it is a single-feature operation. Per the rules, a
single-feature operation is **not** a Use Case.

- **Detection** is a pure, side-effect-free function in
  `features/children/handlungsbedarf.ts` (`detectHandlungsbedarf`). It takes
  already-serialized data and returns a sorted list of cases — trivially
  testable, no DB/session.
- **Facade**: `ChildrenFacade.getHandlungsbedarf(weekStartIso)` fetches the data
  via the children services and delegates to the pure detector.
- **Action**: `getHandlungsbedarfAction` (`requireAdmin` → Facade) feeds the
  client week-switcher; the inline "Vertretung zuweisen" reuses the existing
  `createVertretungAction` / `updateVertretungAction`.

See `docs/architecture/dependency-graph.md` for the diagram.

### Vertretung-Requests: free-text child matching (COD-51)
A Schulbegleiter can report a Vertretung for a child they are **not** assigned
to. The child is entered as **free text** (`childNameText`) — the roster is
never shown to the companion (Datenschutz). The server fuzzy-matches the text
against the roster and stores a *suggestion only*; nothing is auto-confirmed.
An admin resolves each report in the "Zuzuordnen" section of the Handlungsbedarf
tab (COD-50): confirming materialises the billable `WORK` `Event` (carrying the
companion's signature) **and** a `ChildVertretung`, so an unresolved report
never reaches billing/export.

It lives in its own bounded context, `features/vertretung-requests/`, because it
owns a new table (`VertretungRequest`) and is initiated from the timesheet UI,
independent of the children domain.

- **Matching** is split cleanly: the pure string math is `lib/fuzzy.ts`
  (`nameSimilarity`, robust to umlauts/diacritics/word-order); the roster
  ranking is a children service (`rankChildrenByName`); the threshold decision
  is `ChildrenFacade.matchChildByFreeText` (suggests only when confident AND
  unambiguous). The roster never leaves the server.
- **Facade**: `VertretungRequestsFacade` owns the `VertretungRequest` table only
  (create / listPending / get / markConfirmed / markRejected) and uploads the
  companion's signature. It stays free of auth/HTTP.
- **Use Cases** (cross-feature, two facades each):
  - `submit-vertretung-request` — `ChildrenFacade.matchChildByFreeText` →
    `VertretungRequestsFacade.createRequest`.
  - `resolve-vertretung-request` — on admin confirm, `ChildrenFacade`
    creates the signed `Event` + the `ChildVertretung`, then
    `VertretungRequestsFacade.markConfirmed`.
- **Actions**: `submitVertretungRequestAction` (`requireAuth` → submit use case),
  `confirmVertretungRequestAction` (`requireAdmin` → resolve use case),
  `rejectVertretungRequestAction` (`requireAdmin` → Facade directly,
  single-feature), `listPendingVertretungRequestsAction` (`requireAdmin`).
- **UI**: a third "Vertretung" mode in the timesheet new-entry sheet (free-text
  child, manual time, signature) and the `VertretungQueue` component mounted in
  the Handlungsbedarf page.
