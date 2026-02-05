# /docs/02-invariants.md

## Non-negotiable invariants (the lawbook)
These rules are enforced by code review (human or AI), tests, and repo structure.
Refactors are allowed. Breaking these invariants is not.

---

## A) Single source of truth (schemas + types)
### A1 — Canonical domain model lives in `packages/shared`
- The `Recipe` shape is defined once, in `packages/shared`.
- All apps import it from there.

**Forbidden:**
- re-declaring the `Recipe` type in `apps/web` or `apps/extension`
- “similar but slightly different” types

**Enforcement:**
- TypeScript path imports
- no duplicate schema definitions

### A2 — All API inputs are validated at the boundary
Every API route must validate:
- request body (POST/PATCH)
- query params (GET list/search)
- route params (GET detail/DELETE)

Validation uses Zod schemas from `packages/shared`.

**Forbidden:**
- trusting raw `req.json()` without schema validation
- ad-hoc validation inside route logic

---

## B) Proof Before Progress (testing + debugging gate)
Nothing moves forward until the current task is proven done.

### B1 — Backend route done gate
A backend route/change is “done” only if:
- ✅ Zod validation implemented using shared schemas
- ✅ status codes match API contract
- ✅ at least:
  - happy path test
  - auth failure test (401)
  - invalid input test (400)
  - not-found test (404) where applicable
- ✅ tests are executed locally and pass
- ✅ one manual E2E call is provided (curl or equivalent) with expected output

**Forbidden:**
- “Implemented but untested”
- “We’ll test later”
- changing tests to match broken behavior without updating contract docs

### B2 — Debugging discipline
When tests fail:
1) reproduce with simplest command
2) isolate failing assertion
3) fix root cause
4) rerun tests
5) summarize cause in 1–2 lines

No thrashing edits. No moving on while red.

---

## C) Boundary separation (no layer leaks)
### C1 — UI stays thin
React components should mostly:
- render
- call services/hooks
- handle UI state

**Forbidden:**
- business logic inside UI components
- DB/API logic inside UI components

### C2 — Persistence stays isolated
DB queries are isolated in the backend (web app API layer + db module).

**Forbidden:**
- DB access from shared package
- DB logic creeping into route handlers without a data layer

---

## D) Extension robustness
### D1 — Injected UI must be isolated
The extension UI must use **Shadow DOM** to avoid CSS collisions.

**Forbidden:**
- injecting UI directly into page DOM without isolation
- relying on page CSS for extension UI

### D2 — No silent failure
If save fails:
- user must see a clear message
- request must be queued for retry (unless explicitly disabled)

---

## E) Reliability and data safety
### E1 — Network failures must not lose user data
If the API call fails due to connectivity or transient errors:
- payload is queued locally (extension storage)
- retries occur with backoff
- user is informed (“Saved pending sync” / “Will retry”)

**Forbidden:**
- discarding a capture payload on failure
- requiring the user to reselect text to retry

### E2 — Every feature has a delete path
If the user can create data, they must be able to remove it.
No permanent clutter.

**Applies to:**
- recipes
- tags (implicitly by editing/removing from recipes)
- queued retry items (must be clearable)

---

## F) Repository hygiene (anti-spaghetti, anti-cathedral)
### F1 — No “junk drawer” modules
No `utils.ts` dumping grounds. Utilities must be named by concept and placed near usage.

### F2 — No premature frameworks
No plugin systems, generic repositories, elaborate abstractions “for later.”
Build explicit, readable code first.

### F3 — Changes must be local
A small feature should not require editing 7 files across the repo.
If it does, architecture is drifting and must be corrected.

### F4 — Contracts are documented
If any API contract changes:
- update `/docs/03-api-contract.md` (when it exists)
- update shared schemas
- update tests

---

## G) Security + privacy baseline (MVP)
- Store only what’s required for MVP: selected text, url, title, user-provided title/tags/notes.
- Do not scrape unrelated page content.
- Do not request extension permissions beyond what is needed.

---

## H) The “stop and fix” rule
If an invariant is violated:
- stop current work
- fix the violation
- add a test or guardrail to prevent recurrence

Speed is irrelevant if the codebase becomes unmaintainable.

