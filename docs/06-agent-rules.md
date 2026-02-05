# /docs/06-agent-rules.md

## Purpose
This is the operating manual for any AI agent (or human acting like one) that writes code in this repo.
The goal is speed **with correctness**, and progress **with proof**—without spaghetti or absurd abstraction.

If these rules conflict with convenience, convenience loses.

---

## Prime Directive: Proof Before Progress
Nothing moves forward until the current quest is proven complete.

**For backend routes, “proven complete” means:**
- shared schema exists/updated in `packages/shared`
- tests added/updated
- tests executed and passing
- manual E2E proof provided (curl or equivalent)
- contract doc updated if behavior changed

See `/docs/02-invariants.md` for the full Done Gate.

---

## 1) Plan before code (mandatory)
Before writing any code, produce a plan that includes:

### 1.1 What you are building
- a one-paragraph description of the change
- what is explicitly not being changed (scope fence)

### 1.2 Checklist of files to touch
List every file you expect to edit or create.

Example:
- `packages/shared/src/schemas/recipe.ts` (update)
- `apps/web/src/app/api/recipes/route.ts` (create)
- `apps/web/tests/recipes.post.test.ts` (create)

**Rule:** If you later need new files not in the plan, update the plan first.

### 1.3 Acceptance tests (win conditions)
Write explicit verifiable outcomes:
- “POST /recipes returns 201 with RecipeSchema”
- “Unauthenticated request returns 401”
- “Invalid title returns 400 with VALIDATION_FAILED”

### 1.4 Risk assessment (tiny)
- list 1–3 likely failure points
- describe how you’ll detect them (tests/logs)

---

## 2) Small diffs (one feature per chunk)
### 2.1 Atomic changes
Each change set should implement **one cohesive feature**.

Good examples:
- “Add POST /recipes endpoint + tests”
- “Implement selection detector + floating button”
- “Add recipe list page + search query wiring”

Bad examples:
- “Add endpoint, refactor auth system, reorganize folders, redo UI styling”

### 2.2 Commit/PR chunking rules
If you’re committing (or simulating it):
- Commit 1: shared schema changes
- Commit 2: API implementation + tests
- Commit 3: client wiring (extension/web UI)

This prevents large diffs that are impossible to debug.

---

## 3) No drive-by refactors (hard ban)
### 3.1 What counts as a drive-by refactor
- renaming unrelated variables “for clarity”
- reformatting unrelated files
- changing folder structure unrelated to the quest
- “while I’m here” edits

### 3.2 Allowed refactors
Only if:
- the refactor is required to complete the quest, AND
- it is minimal, AND
- it is included in the plan, AND
- it is covered by tests

Otherwise, leave it.

---

## 4) Always update docs when contracts change
### 4.1 “Contract” includes
- request/response JSON shapes
- validation rules
- status codes
- auth requirements
- business logic semantics (e.g. tag filtering AND vs OR)

### 4.2 Required updates on contract change
If any contract changes, update:
1) `packages/shared` Zod schemas
2) `/docs/03-api-contract.md`
3) tests that assert the contract
4) both clients (extension + web) if they depend on it

**Forbidden:** changing behavior without updating contract docs and tests.

---

## 5) If uncertain: TODO with rationale (don’t invent architecture)
### 5.1 When to add TODO
Add TODO only when:
- uncertainty is real and blocks correctness
- a decision requires product input or further research
- it is explicitly scoped out of MVP

### 5.2 How to write TODOs
A TODO must contain:
- what is missing
- why it’s missing
- the smallest next action

Example:
> TODO: Decide whether duplicate recipes should be blocked (409) or allowed.
> Rationale: MVP doesn’t define dedupe policy yet; allowing duplicates is simplest.
> Next: Add `capturedTextHash` and enforce 409 if duplicates become noisy.

**Forbidden:** vague TODOs like “improve later” or “refactor.”

---

## 6) Boundary discipline (agent-safe coding)
### 6.1 Validate at boundaries
- API inputs validated immediately
- extension message payload validated before processing
- never cast untrusted JSON

### 6.2 Prefer explicit code
- avoid generic frameworks
- avoid “future-proof” abstractions
- name functions after what they do

---

## 7) Debugging protocol (no thrash)
When tests fail or a bug appears:

1) Reproduce with the smallest possible command
2) Identify the failing expectation
3) Fix root cause (not symptoms)
4) Rerun tests
5) Summarize cause + fix in 1–2 lines

**Forbidden:** random edits until it “seems fixed.”

---

## 8) Output format (what the agent must report after changes)
After completing a quest, report:

- What changed (1–3 bullets)
- Files added/modified
- Tests added/modified
- Commands executed (and results)
- Manual proof (curl or UI steps)
- Any TODOs introduced (with rationale)

---

## 9) Stop conditions (when you must pause)
Stop and ask for direction (or create TODO) if:
- requirements are ambiguous enough to affect contracts
- security/privacy implication appears
- major architectural change seems required
- you cannot satisfy Proof Before Progress

---

## 10) Definition of “done” (repeat)
A task is done when:
- it meets the win condition
- tests pass
- docs reflect reality
- code respects invariants

Anything else is cosplay.

