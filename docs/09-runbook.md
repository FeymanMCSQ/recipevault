 /docs/09-runbook.md

## Purpose
This runbook enables fast onboarding and debugging.  
It should allow a new developer (or AI agent) to run everything in under 15 minutes.

---

## Prerequisites
- Node.js (LTS recommended)
- pnpm
- A Postgres database (local or hosted)
- Chrome (or Chromium) for extension testing

---

## Repo setup
```bash
pnpm install
Environment variables
Web app (apps/web)
Create apps/web/.env:

Required (example names; adjust to actual stack):

DATABASE_URL=postgresql://...

AUTH_SECRET=... (if using auth)

NEXT_PUBLIC_APP_URL=http://localhost:3000

If using token auth for extension:

EXTENSION_TOKEN_SECRET=... (if needed)

Shared package (packages/shared)
No env vars expected.

Extension (apps/extension)
No env vars in production (MVP).
For local dev, optionally configure:

API base URL (if not hardcoded)

API_BASE_URL=http://localhost:3000

Prefer to store config in a config.ts that can switch between dev/prod.

Run the web app
From repo root:

pnpm --filter web dev
Expected:

web app at http://localhost:3000

API endpoints available under /api/* (if Next API routes)

Database setup:

pnpm --filter web db:migrate
pnpm --filter web db:seed
(Commands depend on Prisma setup; define them in apps/web/package.json.)

Run tests
From repo root:

pnpm test
pnpm lint
pnpm typecheck
If splitting:

pnpm test:unit
pnpm test:api
Load the extension (unpacked)
Build or use dev output (depending on setup)

Open Chrome → chrome://extensions

Enable Developer mode

Click Load unpacked

Select the extension build folder (e.g. apps/extension/dist)

Confirm it loaded
Extension icon appears in toolbar

No red errors in extension card

Service worker is running (inspect view)

Extension debugging
Content script logs
Open the target webpage

DevTools → Console

Filter logs for [RecipeVault] prefix (recommended logging convention)

Background/service worker logs
Chrome → chrome://extensions

Find RecipeVault → “Service Worker” → Inspect

Console logs appear there

Common failure modes (and fixes)
1) CORS errors
Symptoms:

extension requests blocked
Fix:

ensure API allows extension origin (if using fetch from extension)

or route requests via background with correct permissions

if using cookie auth, ensure same-site/cookie policies are correct

2) Auth failures (401)
Symptoms:

API returns AUTH_REQUIRED
Fix:

log into web app first

ensure extension has token/cookie access

verify request includes Authorization header or cookies as intended

3) MV3 permissions issues
Symptoms:

content script not running

selection detector never triggers
Fix:

verify manifest.json includes:

content_scripts matches URL patterns

required host permissions

activeTab or <all_urls> (be conservative)

reload extension after changes

4) Button not appearing / UI broken
Symptoms:

selection occurs but no button
Fix:

check content script is injected

ensure selection detector is listening to mouseup and selectionchange

verify Shadow DOM host element exists

check z-index / viewport clamp logic

5) API base URL mismatch
Symptoms:

requests go to wrong domain
Fix:

confirm dev config points to http://localhost:3000

ensure production build points to deployed URL

6) Database connection errors
Symptoms:

API fails with 500 on create/list
Fix:

verify DATABASE_URL

run migrations

confirm DB reachable

Minimal end-to-end verification (MVP smoke test)
Start web app

Load extension

Visit a test page (Wikipedia)

Select a paragraph

Click Save

Enter title + tags

Save

Open dashboard → verify recipe appears

Search by keyword → verify found

Delete recipe → verify removed

If this fails, do not proceed to new features.