# /docs/01-architecture.md

## Architecture at a glance
RecipeVault is a monorepo containing:
- A **Next.js web app** for the recipe library dashboard.
- A **Chrome MV3 extension** for capture (content script UI + background worker).
- A **shared package** that defines the canonical data model and validation.

This system is intentionally “small, hard-edged, and refactorable.”

---

## Monorepo layout
repo/
apps/
web/ # Next.js dashboard + API routes (or separate backend if chosen later)
extension/ # MV3 extension: content script + background + UI components
packages/
shared/ # shared types, zod schemas, API client, error types
docs/ # architecture reservoir (these files)


### What goes where (strict rules)
- `apps/web`:
  - UI pages/components
  - server API routes (if using Next.js API routes)
  - DB access layer (prisma client usage)
- `apps/extension`:
  - selection detection & floating UI
  - capture modal UI
  - background worker logic (auth token, request retry, queue)
- `packages/shared`:
  - Zod schemas for all API inputs/outputs
  - TypeScript types derived from schemas
  - Shared error shapes and helpers
  - Shared API client wrapper (fetch wrapper used by web + extension)

No other package is allowed to define domain shapes.

---

## Data flow (text diagram)
### Capture flow
User selects text on a webpage
-> Content Script detects selection and shows floating "Save Recipe" UI
-> User clicks Save
-> Content Script opens mini modal and gathers: title, tags, notes
-> Content Script sends a message to Background Worker with payload
-> Background Worker:
- attaches auth/session
- calls Web API POST /recipes
- on failure: queues request locally + retries
-> Web API validates input (Zod) and writes to DB
-> Web Dashboard fetches recipes and displays them


### Library flow
User opens web dashboard
-> Web UI calls Web API GET /recipes?query=&tags=
-> Web API validates query (Zod) and reads from DB
-> returns list of Recipe summaries
-> UI renders list; user can open detail, edit, delete


---

## Layers (don’t mix these)
Think in “layers” even if the code isn’t huge:

1) **UI Layer**
- React components (rendering + event wiring)
- No domain logic beyond trivial formatting

2) **Application Layer**
- “Use-cases” / services:
  - create recipe
  - list recipes
  - update recipe
  - delete recipe
- Orchestrates validation, API calls, retries, transformations

3) **Domain Layer**
- The `Recipe` model and constraints (in `packages/shared`)
- Invariants and validation schemas

4) **Persistence Layer**
- Prisma / DB queries and migrations
- No UI code, no browser code

### Where to place code
- UI components: `apps/web/src/components/*`, `apps/extension/src/ui/*`
- App services: `apps/web/src/services/*`, `apps/extension/src/services/*`
- DB: `apps/web/src/db/*`
- Shared schemas/types: `packages/shared/src/*`

---

## Contracts (single source of truth)
All request/response shapes are defined in `packages/shared` as Zod schemas.

Example pattern:
- `RecipeSchema` in shared
- `CreateRecipeInputSchema` in shared
- API route uses Zod schema to validate body
- UI and extension use the same schema/types

No duplicated type definitions in `apps/web` or `apps/extension`.

---

## Error handling (predictable, not vibes)
We use a shared error envelope.

Rules:
- API returns structured errors (code + message + field issues when relevant).
- Extension and web UI display user-friendly messages but keep structured info for debugging.
- No “string soup” errors; no `throw "error"`.

---

## Anti-patterns (hard bans)
### 1) “Logic in components”
Bad:
- components that fetch, validate, transform, and mutate state in 200 lines

Good:
- components call a service function and render results

Rule:
- React components should be mostly declarative UI.
- Business logic lives in services/hooks.

### 2) “Fetch scattered everywhere”
Bad:
- random `fetch()` calls in many files with inconsistent headers/error handling

Good:
- a shared API client in `packages/shared` or app-level `apiClient.ts`

Rule:
- Only one “HTTP gateway” per app.

### 3) “utils.ts dumping ground”
Bad:
- `utils.ts` becomes a junk drawer of unrelated functions

Good:
- create named modules:
  - `selectionPositioning.ts`
  - `recipeText.ts`
  - `tagFormat.ts`

Rule:
- If a util isn’t clearly tied to one concept, it doesn’t belong.

### 4) Premature abstraction
Bad:
- plugin systems, factories, generic repositories for a 5-route app

Good:
- explicit code with good names and boundaries

Rule:
- Add abstraction only when duplication is real and stable.

---

## Extension UI resilience
Webpages are hostile environments (CSS wars, z-index chaos, weird layouts).

Rules:
- All injected UI must be isolated via **Shadow DOM**.
- UI must tolerate scroll/resize/selection changes.
- Provide fallback capture path later (context menu / toolbar capture) but MVP can start with selection-only.

---

## Testing architecture (high level)
- Shared schemas: unit tests in `packages/shared`
- Web API routes: integration tests in `apps/web`
- Extension: minimal unit tests for selection + payload building (E2E optional later)

Backend routes must follow “Proof Before Progress” (see invariants).

