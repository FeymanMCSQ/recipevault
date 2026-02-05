# /docs/08-testing-strategy.md

## Purpose
Prevent regressions and enforce contracts without turning this repo into a test-themed religion.

We test what matters:
- schemas (because they define reality)
- API routes (because they mutate data)
- extension capture flow (because it’s user-facing and fragile)

---

## Testing layers

### 1) Unit tests (fast, pure)
Target:
- `packages/shared` schemas and normalization functions
- pure helper functions (tag normalization, selection anchoring calculations)

#### What to unit test
- Tag normalization:
  - trims
  - lowercases
  - rejects invalid
- Schema validation:
  - CreateRecipeInput accepts valid payload
  - rejects invalid title/tags/oversized capturedText
- Error mapping:
  - Zod issues → VALIDATION_FAILED shape

#### What NOT to unit test
- React component rendering details
- framework behavior
- fetch mocks everywhere (integration tests cover routes)

---

### 2) Integration tests (API routes)
Target:
- all MVP endpoints in `/docs/03-api-contract.md`

Each route must have minimum tests:
- happy path
- auth failure (401)
- validation failure (400)
- not-found (404) where applicable

#### DB strategy
- Use a test database or transactional test isolation.
- Clean up between tests.
- Keep tests deterministic.

#### What integration tests must assert
- status codes
- response shape matches schema
- DB mutation occurred (or not)
- ownership rules (cannot access another user’s recipe)

---

### 3) Manual tests (extension)
The extension UI is notoriously tricky to fully automate early. We use a manual checklist as an MVP gate.

#### Manual test checklist (MVP)
Test on at least 10 sites including:
1) Wikipedia (clean DOM)
2) A major recipe site (Allrecipes / BBC Good Food style)
3) A blog recipe page with ads and popups
4) A site with heavy CSS (news site)
5) Reddit post page (selection in complex layout)
6) Medium article
7) A page with code blocks/pre tags
8) A page with very long content
9) A page with scroll containers
10) A page in dark mode (site-driven)

For each site:
- Selecting text shows button within 200ms–500ms
- Button appears in the right place (not off-screen)
- Modal opens and is readable (styles not broken)
- Save succeeds and toast appears
- Saved recipe appears in web dashboard
- Clearing selection hides button
- Scroll hides button (or repositions reliably)

#### Edge cases checklist
- Very small selection (1–2 words)
- Huge selection (ensure capped or rejected gracefully)
- Selection across multiple paragraphs
- Selection near top/bottom of viewport
- Selection then scroll
- Selection inside an iframe (expected failure in MVP; verify fallback is available or documented)

---

## Test execution rules (Proof Before Progress)
For backend tasks:
- tests must be run locally
- failing tests block progress
- the agent must report:
  - the command run
  - the result

---

## Practical test commands (to be implemented)
Standardize on:
- `pnpm test` (runs all tests)
- `pnpm test:unit` (shared schemas + pure)
- `pnpm test:api` (integration)
- `pnpm lint`
- `pnpm typecheck`

---

## CI (recommended early)
Add GitHub Actions:
- install
- lint
- typecheck
- test

This is enforcement against agent optimism.

---

## What “enough testing” means for MVP
MVP is acceptable when:
- shared schemas are covered by unit tests
- all API endpoints have integration tests
- extension passes the manual checklist on 10 sites

We don’t need 100% coverage. We need confidence.
