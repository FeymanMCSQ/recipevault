# /docs/05-engineering-standards.md

## Purpose
These standards are here to keep the codebase:
- readable
- refactorable
- testable
- resistant to “agent spaghetti” and “cathedral architecture”

They are intentionally concrete. If something isn’t specified, prefer simplicity.

---

## 1) File and module size rules (anti-entropy)
### File size guideline
- Preferred: **50–200 lines**
- Allowed: up to **350 lines** if cohesive
- Hard stop: **>600 lines** = must split

### Micro-file guideline (anti-cathedral)
- Avoid 3–10 line files unless they are:
  - schema definition files
  - route index/export files
  - tiny stable constants

**Rule of thumb:** split by *concept*, not by “every function gets a file.”

### Cohesion rule
A file/module should answer one question.
Example good modules:
- `recipeService.ts`
- `selectionAnchor.ts`
- `apiClient.ts`
Bad modules:
- `utils.ts`
- `helpers.ts` dumping ground

---

## 2) Naming conventions (predictable + searchable)
### General
- Use **nouns** for data structures: `Recipe`, `RecipeSummary`
- Use **verbs** for actions: `createRecipe`, `listRecipes`, `saveCapture`
- Use **clear prefixes** for handlers: `handleSaveClick`, `onSelectionChange`

### Files
- `camelCase.ts` for TS files (or `kebab-case` if repo standard, pick one and stick to it)
- React components: `PascalCase.tsx`

### Folder conventions
- `services/` for business/application logic
- `db/` for Prisma + queries
- `routes/` or `api/` for API endpoints
- `ui/` for extension UI primitives

---

## 3) Error handling (no “console.log and pray”)
### Principles
- Errors are structured and predictable.
- UI shows friendly messages.
- Logs contain debug detail.
- Never swallow errors silently.

### Backend pattern
- Validate inputs with Zod at the boundary.
- Convert Zod errors into `VALIDATION_FAILED` with field issues.
- For expected errors:
  - throw/return typed errors with code + message
- For unexpected errors:
  - return `INTERNAL_ERROR` and log details

### Forbidden
- `console.log("error", err)` as the only action
- returning random strings as errors
- throwing plain strings

---

## 4) Logging policy (useful, not noisy)
### Where logging is allowed
- Backend: request errors, unexpected exceptions, auth issues
- Extension background worker: network retries, queue state changes
- Avoid logging in UI components unless temporary debug mode

### Logging rules
- Logs must include:
  - event name
  - relevant identifiers (recipeId, route, userId if safe)
  - error code if applicable
- Never log:
  - full capturedText (privacy + noise)
  - auth tokens
  - sensitive headers

### Debug flag
If needed, implement a `DEBUG=true` flag to increase verbosity.

---

## 5) Async patterns (no unhandled promises)
### Rules
- Always `await` async calls that can fail.
- In event handlers, catch and handle errors explicitly.
- Background retry loops must not create runaway concurrent tasks.

### Forbidden
- floating promises (no `void someAsync()` unless intentionally fire-and-forget with internal error handling)
- retry loops without backoff
- parallel requests without limits

### Preferred patterns
- `try/catch` around route logic
- `Result`-style return objects for predictable flows (optional)
- use a simple `retryWithBackoff()` helper for extension queue sending

---

## 6) TypeScript strictness (no “any” and no unchecked JSON)
### Rules
- `strict: true`
- No `any` in app code.
- `unknown` is allowed only if narrowed/validated.
- Any JSON input must be validated with Zod before use.

### Boundary rule
At boundaries (API body, query params, extension messages):
- Parse + validate immediately
- Then operate on typed data

### Forbidden
- `as SomeType` on untrusted JSON
- “trust me bro” casting

---

## 7) No circular dependencies
### Rules
- Shared package must not import from apps.
- `db/` must not import from `ui/`.
- Services may import shared schemas, never vice versa.

If circular deps appear, architecture is drifting.

---

## 8) Feature structure (how to add code without chaos)
### Feature locality principle
A feature should live in one place, with clear exports.

Suggested pattern in web app:
apps/web/src/features/recipes/
recipeService.ts # calls API or internal handlers
recipeQueries.ts # query building, filtering logic
recipeComponents.tsx # list/detail components (thin)
index.ts # public exports


Suggested pattern in extension:
apps/extension/src/features/capture/
selectionDetector.ts
floatingButton.tsx
captureModal.tsx
captureService.ts # constructs payload + sends via background
index.ts


### Export rule
- Each feature folder has an `index.ts` that exports the public surface.
- Other parts of the app import from the feature root, not deep paths.

---

## 9) API client rule (no scattered fetch)
- Web app and extension must use a single API client abstraction each.
- The client must:
  - attach auth
  - parse JSON safely
  - map errors into structured error objects

---

## 10) Testing standards (minimum viable rigor)
### Backend routes
Each route must have:
- happy path test
- invalid input test
- auth test
- not found test (where applicable)

### Shared schemas
Unit tests for:
- normalization rules (tags/title)
- schema acceptance/rejection

### Forbidden
- skipping tests because “it’s trivial”
- changing behavior without updating tests and docs

---

## 11) Refactor rules (agent-safe)
- No drive-by refactors.
- If a refactor is required, do it as a separate commit/quest.
- If changing a contract:
  - update shared schemas
  - update API contract doc
  - update tests
  - update both clients (extension + web)

---

## 12) Review checklist (apply before declaring a quest complete)
- ✅ Does code obey invariants?
- ✅ Are boundaries respected?
- ✅ Are types and schemas shared, not duplicated?
- ✅ Are errors structured?
- ✅ Are tests written and executed?
- ✅ Is there a delete path?
- ✅ Did we avoid premature abstraction?

These standards are how we go fast without breaking the future.