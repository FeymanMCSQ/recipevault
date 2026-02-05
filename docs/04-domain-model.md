
```md
# /docs/04-domain-model.md

## Purpose
This document defines the canonical domain concepts so fields don’t proliferate randomly across the codebase.  
If a field isn’t defined here, it doesn’t exist in MVP.

---

## Entities (MVP)

### Recipe (primary entity)
A saved capture of recipe content from the web.

#### Canonical fields (MVP)
- `id: string`
- `title: string` — user-controlled name of the recipe
- `tags: string[]` — user-controlled labels
- `notes: string` — optional user notes

- `sourceUrl: string` — URL where capture came from
- `sourceTitle: string` — page title where capture came from
- `capturedText: string` — raw selected text captured by user

- `createdAt: ISO datetime`
- `updatedAt: ISO datetime`

#### Derived / internal fields (optional implementation details)
These may exist in DB but are not part of external API unless explicitly added:
- `capturedTextHash: string` — for dedupe
- `normalizedTitle: string` — for search (optional)
- `normalizedTags: string[]` — (server-normalized tags; can be same as tags)

---

## Tags (representation)
### MVP representation: tags are strings
We do not create a Tag entity/table in MVP unless needed.

Pros:
- simple
- fast
- less schema complexity

### Tag constraints
- Trim whitespace
- Lowercase normalization (recommended)
- Max length: 32 characters
- Max tags per recipe: 20

Allowed characters (MVP rule, flexible):
- letters, numbers, spaces, hyphens
- reject or sanitize emojis/special chars if problematic

Normalization example:
- `"  Week Night  "` → `"week night"`
- `"Low-Carb"` → `"low-carb"`

**Server is the source of truth** for normalized output.

---

## Allowed states and constraints

### Title constraints
- Required
- `1..120` characters
- Must not be only whitespace

### CapturedText constraints
- Required
- `1..50,000` characters (prevent abuse)
- Stored as plain text exactly as received (after trimming optional)

### Notes constraints
- Optional
- `0..2,000` characters

### Source constraints
- `sourceUrl` must be a valid URL (string)
- `sourceTitle` optional, max 200 chars

### Ownership constraint
Every recipe belongs to exactly one user.
- `userId` is server-derived (session/token), never client-provided.

---

## Duplicates strategy (MVP)
We define duplicates as:

**Potential duplicate** if:
- same `userId`
- same `sourceUrl`
- same `capturedTextHash`

MVP handling options (choose one):
1) Allow duplicates (simplest).
2) Return `409 CONFLICT` and do not create.
3) Merge: update existing recipe’s `updatedAt` (and possibly tags) and return existing.

**Recommended for MVP:** allow duplicates initially, add detection later if it becomes noisy.

---

## What is explicitly NOT in the domain model (MVP)
These fields are forbidden in MVP:
- `ingredients: string[]`
- `steps: string[]`
- `servings: number`
- `prepTime/cookTime/totalTime`
- `nutrition`
- `imageUrl`
- `rating`, `favorite`, `folderId`, `collectionId`
- `shareId`, `publicSlug`
- `comments`, `collaboration`
- `aiSummary`

If the agent tries to add them “because it’s easy,” it is violating scope.

---

## Future fields (later, explicitly listed)
These are allowed later, but must not be implemented now:
- Structured extraction via JSON-LD Recipe schema
- Ingredient parsing + step parsing
- Primary image thumbnail
- Export/import (JSON/CSV)
- Grocery list generation
- Meal planning
- Sharing/public links
- Full-text search index (Elastic/Meilisearch/etc.)
- Recipe source snapshot (HTML or PDF capture)

---

## Domain events (optional, later)
- `RecipeCreated`
- `RecipeUpdated`
- `RecipeDeleted`

Not required for MVP.

