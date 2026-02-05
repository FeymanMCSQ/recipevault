# /docs/00-vision.md

## One-sentence definition
RecipeVault is a browser extension + web dashboard that lets you highlight recipe text anywhere on the internet, save it with a name and tags, and later search/edit/delete it from a personal library.

## Why it exists (the pain it kills)
Bookmarks and screenshots are “storage,” not “retrieval.” RecipeVault turns messy capture into a searchable collection with minimal friction at the moment you find something worth keeping.

## Target user
People who frequently find recipes online and want to reliably find them again later without hunting through bookmarks, notes apps, or browser history.

## MVP scope (what we are building)
### Core capabilities
1) **Capture**
- User highlights text on any webpage.
- A small in-page “Save Recipe” button appears near the selection.
- Clicking opens a mini modal to:
  - set a **Recipe title** (required)
  - set **tags** (optional)
  - add **notes** (optional)
- System automatically captures:
  - `sourceUrl` (current page URL)
  - `sourceTitle` (document title)
  - `capturedText` (the selected text)
- User clicks **Save** and receives a success toast.

2) **Library (Web Dashboard)**
- User can view a list of saved recipes.
- User can search recipes by text/title.
- User can filter by tags.
- User can open a recipe detail view.
- User can edit title/tags/notes.
- User can delete a recipe.

3) **Account + persistence**
- Recipes are tied to a user account.
- Data is stored server-side in a database.
- The extension is a capture interface; the web app is the long-term storage and management interface.

## Primary user flows (MVP)
### Flow A — Capture from the web
1. User highlights recipe text.
2. Floating “Save Recipe” button appears.
3. User clicks button.
4. Mini modal opens near selection.
5. User sets title + tags (optional) + notes (optional).
6. User clicks Save.
7. Confirmation toast appears (“Saved ✓ View”).
8. Recipe is visible in web dashboard.

### Flow B — Browse & search library
1. User opens RecipeVault web dashboard.
2. Sees recipe list (newest first).
3. Searches by keyword (title + full text).
4. Filters by tags.

### Flow C — Edit a saved recipe
1. User opens a recipe detail.
2. Edits title/tags/notes.
3. Saves changes.
4. Sees updated recipe immediately.

### Flow D — Delete
1. User deletes recipe from detail view (or list).
2. Recipe disappears from list.
3. No “orphaned” data remains.

## MVP boundaries (explicitly out)
These are not part of MVP and should not be implemented “just in case”:
- Parsing ingredient lists / instructions / structured recipe extraction
- Images (uploading images, scraping images, thumbnails)
- Grocery list generation
- Meal planning / calendar integration
- Sharing recipes with others / social features
- Rating, favorites, collections, folders
- Offline-first library access in web app
- Browser sync between accounts
- Mobile app
- Import/export (CSV/JSON) beyond basic internal debugging
- Full-text search engine (Postgres basic search is fine for MVP)

## Non-goals (guardrails against scope creep)
- **Not a recipe discovery platform** (no recommendations, feeds, trends).
- **Not a cooking assistant** (no timers, conversions, substitutions).
- **Not a clipper for everything** (we’re clipping recipes, not building Evernote).
- **Not a perfect extractor** (MVP stores what the user selected; no magic parsing required).

## Success criteria (MVP)
MVP is considered successful when:
- A user can save a recipe snippet from 10 random recipe pages reliably.
- Saved recipes appear in the web dashboard within seconds.
- Search and tag filtering make it easy to retrieve.
- Edit + delete work with predictable behavior.
- The system is stable under normal usage (no silent failures, no data loss on transient network errors).

## Quality bar (MVP)
- Minimal friction capture experience (no mandatory new tab).
- Predictable contracts (shared schemas).
- Tests for backend routes and core behaviors.
- Good error messages (user-facing + dev-facing logs).

