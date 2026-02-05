# /docs/03-api-contract.md

## Purpose
This document is the single source of truth for the MVP API contract.  
It exists to prevent drift between:
- `apps/web` (API + dashboard)
- `apps/extension` (capture client)
- `packages/shared` (schemas/types)

**Rule:** If behavior changes, update:
1) `packages/shared` schemas
2) this document
3) tests

---

## Base Concepts

### Resource: Recipe
A Recipe is a saved capture consisting of:
- user-provided metadata (title, tags, notes)
- automatic metadata (sourceUrl, sourceTitle)
- captured content (capturedText)

### Content format
For MVP, `capturedText` is plain text (string).  
No parsing or structure is assumed.

### API versioning (MVP)
No version prefix in MVP. Contract is stabilized via shared schemas + tests.
If future breaking changes occur, introduce `/v1`.

---

## Authentication (MVP)

### Overview
All endpoints require authentication. Anonymous access is not supported in MVP.

### Recommended mechanism
**Cookie-based session** for web app + extension (if feasible), OR **Bearer token** (access token) for extension.

Choose one and enforce consistently. MVP-friendly approach:
- Web dashboard uses cookie session (NextAuth / custom session).
- Extension uses a Bearer access token obtained after user logs in to the web app.

### Required auth behavior
- Missing/invalid auth → `401 Unauthorized` with structured error body.
- Authenticated user ID is derived from the session/token (never provided by client).

### Extension auth rule
The extension must not store long-lived secrets in plaintext.
- Store only a short-lived token or rely on cookie session.
- If token expires, extension prompts user to log in (open web app).

---

## Error Envelope (Conventions)

### Shape (shared across all endpoints)
All errors use the following envelope:

```ts
// packages/shared (conceptual)
type ApiError = {
  error: {
    code: string;           // machine-readable
    message: string;        // human-readable safe summary
    details?: unknown;      // optional structured info
  };
};
Status code mapping (MVP)
400 Bad Request → invalid input, schema failure

401 Unauthorized → missing/invalid auth

403 Forbidden → authenticated but not allowed (rare in MVP)

404 Not Found → resource not found

409 Conflict → duplicate or conflict (optional for MVP)

429 Too Many Requests → rate limiting (optional)

500 Internal Server Error → unexpected server failure

Standard error codes
Use stable, low-granularity codes:

AUTH_REQUIRED

AUTH_INVALID

VALIDATION_FAILED

NOT_FOUND

CONFLICT

INTERNAL_ERROR

Validation errors should include field-level issues in details.

Shared Schemas (Zod)
Rule: The canonical Zod schemas live in packages/shared.
This document mirrors them for human readability.

Tag format (MVP)
We represent tags as strings on the Recipe model.

Constraint:

tags: array of normalized strings (lowercase, trimmed, hyphen/space allowed by rule below)

Normalization strategy:

Client and server both normalize, server is source of truth.

Example normalization: trim, collapse whitespace, lowercase.

Endpoint: POST /recipes
Create a recipe capture.

Request schema
CreateRecipeInputSchema = z.object({
  title: z.string().min(1).max(120),
  tags: z.array(z.string().min(1).max(32)).max(20).default([]),
  notes: z.string().max(2000).optional().default(""),

  sourceUrl: z.string().url(),
  sourceTitle: z.string().max(200).optional().default(""),

  capturedText: z.string().min(1).max(50000),
});
Response schema
RecipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  notes: z.string(),

  sourceUrl: z.string().url(),
  sourceTitle: z.string(),

  capturedText: z.string(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
Example request
{
  "title": "Spicy Lentil Soup",
  "tags": ["soup", "lentils", "spicy"],
  "notes": "Try with extra lemon.",
  "sourceUrl": "https://example.com/recipes/lentil-soup",
  "sourceTitle": "Best Lentil Soup Ever",
  "capturedText": "Ingredients:\n- lentils...\nInstructions:\n1) ..."
}
Example response (201)
{
  "id": "rcp_01HZZ...",
  "title": "Spicy Lentil Soup",
  "tags": ["soup", "lentils", "spicy"],
  "notes": "Try with extra lemon.",
  "sourceUrl": "https://example.com/recipes/lentil-soup",
  "sourceTitle": "Best Lentil Soup Ever",
  "capturedText": "Ingredients:\n- lentils...\nInstructions:\n1) ...",
  "createdAt": "2026-02-05T07:15:30.000Z",
  "updatedAt": "2026-02-05T07:15:30.000Z"
}
Errors
401 AUTH_REQUIRED

400 VALIDATION_FAILED (include field issues)

500 INTERNAL_ERROR

Endpoint: GET /recipes?query=&tags=
List/search recipes for the authenticated user.

Query schema
ListRecipesQuerySchema = z.object({
  query: z.string().max(200).optional(),
  tags: z.string().optional(), // comma-separated, e.g. "soup,spicy"
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  cursor: z.string().optional(), // pagination cursor, optional in MVP
});
Response schema
For list view, return summaries to keep payload light.

RecipeSummarySchema = RecipeSchema.pick({
  id: true,
  title: true,
  tags: true,
  sourceUrl: true,
  sourceTitle: true,
  createdAt: true,
  updatedAt: true
});
ListRecipesResponseSchema = z.object({
  items: z.array(RecipeSummarySchema),
  nextCursor: z.string().optional()
});
Example request
GET /recipes?query=lentil&tags=soup,spicy&limit=20

Example response (200)
{
  "items": [
    {
      "id": "rcp_01HZZ...",
      "title": "Spicy Lentil Soup",
      "tags": ["soup", "lentils", "spicy"],
      "sourceUrl": "https://example.com/recipes/lentil-soup",
      "sourceTitle": "Best Lentil Soup Ever",
      "createdAt": "2026-02-05T07:15:30.000Z",
      "updatedAt": "2026-02-05T07:15:30.000Z"
    }
  ],
  "nextCursor": null
}
Filtering semantics
query searches title + capturedText (basic DB search is fine).

tags means: recipe must include all tags listed (AND semantics) for MVP.

Errors
401 AUTH_REQUIRED

400 VALIDATION_FAILED

Endpoint: GET /recipes/:id
Fetch full recipe detail.

Params schema
RecipeIdParamSchema = z.object({
  id: z.string().min(1)
});
Response schema
RecipeSchema

Example response (200)
{
  "id": "rcp_01HZZ...",
  "title": "Spicy Lentil Soup",
  "tags": ["soup", "lentils", "spicy"],
  "notes": "Try with extra lemon.",
  "sourceUrl": "https://example.com/recipes/lentil-soup",
  "sourceTitle": "Best Lentil Soup Ever",
  "capturedText": "Ingredients:\n- lentils...\nInstructions:\n1) ...",
  "createdAt": "2026-02-05T07:15:30.000Z",
  "updatedAt": "2026-02-05T07:15:30.000Z"
}
Errors
401 AUTH_REQUIRED

404 NOT_FOUND

Endpoint: PATCH /recipes/:id
Update user-editable fields.

Request schema
We only allow editing:

title

tags

notes

UpdateRecipeInputSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  tags: z.array(z.string().min(1).max(32)).max(20).optional(),
  notes: z.string().max(2000).optional()
}).refine(obj => Object.keys(obj).length > 0, {
  message: "At least one field must be provided"
});
Response schema
RecipeSchema (return updated record)

Example request
{
  "tags": ["soup", "weeknight"],
  "notes": "Works well with crusty bread."
}
Errors
401 AUTH_REQUIRED

400 VALIDATION_FAILED

404 NOT_FOUND

Endpoint: DELETE /recipes/:id
Delete a recipe.

Response schema
Use a minimal success envelope:

DeleteRecipeResponseSchema = z.object({
  ok: z.literal(true)
});
Example response (200)
{ "ok": true }
Errors
401 AUTH_REQUIRED

404 NOT_FOUND

Notes on duplicates (MVP)
Optional: server may enforce a duplicate rule:

If same sourceUrl + same capturedTextHash exists → 409 CONFLICT
This is not required for MVP unless it becomes annoying.

Security constraints
All endpoints are user-scoped: user can only access their own recipes.

Never allow client to set userId.

Validate URL string is a URL; do not fetch remote content server-side in MVP.

