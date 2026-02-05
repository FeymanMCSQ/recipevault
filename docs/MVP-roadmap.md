RecipeVault — MVP Development Roadmap
LEVEL 1 — Foundations (XP Track: Infrastructure)

Goal: Repo exists, runs, and can grow safely.

Quest 1.1 — Monorepo Initialization

XP: 80
Task: Create monorepo with:

apps/web

apps/extension

packages/shared

/docs scaffold
Win condition:

pnpm install works

web app runs locally

extension loads as unpacked extension

Quest 1.2 — Shared Types & Schemas

XP: 70
Task: Define Recipe Zod schema in packages/shared
Win condition:

Both web and extension import the same type

Type-check passes across repo

Quest 1.3 — Auth Skeleton

XP: 60
Task: Basic login (magic link or OAuth stub)
Win condition:

User session accessible via /api/me

LEVEL 2 — Backend Core (XP Track: Persistence)

Goal: Recipes can be stored reliably.

Quest 2.1 — Database Model

XP: 90
Task: Create Recipe table (title, tags, sourceUrl, capturedText, timestamps)
Win condition:

Migration runs successfully

Record insertable via seed script

Quest 2.2 — Create Recipe API

XP: 120
Task: Implement POST /recipes
Win condition:

Zod validation enforced

Integration test passes

Curl request returns stored record

Quest 2.3 — Read/Search Recipes

XP: 120
Task: Implement:

GET /recipes

search by title/text

filter by tags
Win condition:

Query returns filtered results correctly

Test coverage passes

Quest 2.4 — Update/Delete APIs

XP: 100
Win condition:

Edit and delete operations work

Error handling verified

LEVEL 3 — Extension Capture Engine (XP Track: Capture Magic)

Goal: Users can save recipes directly from webpages.

Quest 3.1 — Selection Detector

XP: 100
Task: Detect text selection + compute bounding box
Win condition:

Selecting text triggers console event with captured text

Quest 3.2 — Hover Save Button

XP: 120
Task: Render floating “Save Recipe” button using Shadow DOM
Win condition:

Button appears reliably across multiple test sites

Quest 3.3 — Capture Modal

XP: 150
Task: Mini modal for:

name

tags
Win condition:

Modal collects input and returns payload object

Quest 3.4 — API Submission from Extension

XP: 180
Task: Send captured recipe to backend
Win condition:

Recipe appears in DB after clicking Save

Success toast visible

LEVEL 4 — Web Dashboard (XP Track: Library UX)

Goal: Users can actually use what they saved.

Quest 4.1 — Recipe List Page

XP: 110
Win condition:

Recipes render from API

Quest 4.2 — Search + Tag Filters

XP: 120
Win condition:

Typing updates results in real time

Tag filters apply correctly

Quest 4.3 — Recipe Detail View

XP: 90
Win condition:

Full recipe visible

Edit and delete actions function

LEVEL 5 — Integration & Reliability (XP Track: Stability)

Goal: System works end-to-end under real use.

Quest 5.1 — End-to-End Flow Test

XP: 200
Win condition:

Capture from webpage → appears in dashboard

Quest 5.2 — Offline Failure Handling

XP: 140
Win condition:

Failed submission retries successfully

Quest 5.3 — Duplicate Detection

XP: 110
Win condition:

Same recipe URL flagged or merged

LEVEL 6 — MVP Launch State

XP Reward: 500 (Milestone Bonus)

Launch Win Condition:

Extension capture works reliably

Recipes persist

Dashboard searchable

Tests pass

Repo documented

No major UX blockers

XP Philosophy (important)

50–90 XP → small structural tasks

100–150 XP → visible user features

150–200 XP → cross-system integration

500 XP → product milestone

This keeps motivation aligned with real progress rather than “lines of code written.”