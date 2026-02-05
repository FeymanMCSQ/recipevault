# /docs/07-extension-ui-spec.md

## Purpose
This document defines how the extension’s selection-capture UI behaves so it remains consistent, robust, and predictable across hostile webpages.

---

## UI Goals (MVP)
- Fast capture: select → click save → title/tags → saved
- Minimal disruption: no forced tab opens
- Robust against page CSS and layout chaos
- Accessible: usable by keyboard and screen readers (as feasible in MV3)

---

## Components (MVP)
1) **Selection Detector**
- listens for user text selection changes
- determines if selection is valid (non-empty, within limits)

2) **Floating Save Button**
- appears near selection
- click opens capture modal

3) **Capture Modal**
- anchored mini-modal near selection
- collects title/tags/notes
- on save: sends payload to background worker
- on success: toast “Saved ✓ View”
- on failure: toast “Save failed—queued for retry” (if queued)

4) **Background Worker**
- handles auth + API calls
- queues on failure

---

## Selection detection spec
### Events
- primary detection: `mouseup` and `keyup` (for keyboard selection)
- monitor `selectionchange` with throttling (avoid performance issues)

### Valid selection criteria
Selection is valid if:
- selected text trimmed length >= 1
- selection length <= `MAX_CAPTURE_CHARS` (e.g. 50,000)
- selection is not inside the extension’s own injected UI
- selection belongs to the top document (MVP) OR handle iframe later (fallback paths)

### Extracting selection text
Use:
- `window.getSelection()?.toString()`

For position anchoring:
- `getRangeAt(0).getBoundingClientRect()` where possible
- If rect is empty (some edge cases), fallback to mouse coordinates captured on mouseup

---

## Button placement rules
### Placement algorithm (MVP)
- Anchor to selection bounding box
- Place button:
  - above-right of selection if space available
  - otherwise below-right
  - clamp within viewport (avoid off-screen)

### Layout constraints
- Must not cover selected text if avoidable
- Must not jitter on scroll: hide button on scroll and re-evaluate on selection change
- Hide button when:
  - selection cleared
  - user clicks elsewhere
  - escape key pressed

### Z-index
- Use high z-index (but within shadow host) to avoid being buried.
- Avoid interfering with site fixed headers by clamping.

---

## Shadow DOM requirement (hard invariant)
All injected UI must be isolated with Shadow DOM.

### Required approach
- create a container element appended to `document.documentElement` or `document.body`
- attach `shadowRoot = container.attachShadow({ mode: "open" })`
- render UI into shadowRoot

### Why
- prevents site CSS from breaking the button/modal
- prevents your CSS from polluting the site

---

## Accessibility basics (MVP)
### Keyboard support
- If selection is made via keyboard:
  - button should appear
  - pressing Enter on the button should open modal
- Escape closes modal
- Tab cycles through modal fields

### ARIA
- Button has `aria-label="Save recipe"`
- Modal has a title + role dialog semantics
- Save/Cancel buttons are reachable via keyboard

### Focus management
- When modal opens: focus title input
- When modal closes: restore focus to prior active element if possible

---

## Capture modal spec
### Fields
- Title (required)
- Tags (optional, comma-separated or token input)
- Notes (optional, small textarea)

### Prefills
- Title default:
  - page title trimmed (best effort), or
  - first non-empty line of selection (fallback)
- Tags default: empty

### Actions
- Save: disabled until title is non-empty
- Cancel: closes modal, does not change selection

---

## Feedback (toasts)
- Success: “Saved ✓” with optional “View” action
- Failure (network): “Save failed—queued for retry” (if queued)
- Failure (validation/auth): show actionable message (“Please log in”)

Do not spam toasts on repeated retries.

---

## Fallback capture paths (nice-to-have but designed now)
### Context menu
- Right click selection → “Save to RecipeVault”
- If no selection → prompt user to select or capture page link only

### Toolbar/popup action
- Clicking extension icon opens a small popup:
  - “Save current selection”
  - “Save current page link”
This is a fallback for sites where injected UI fails.

---

## Known tricky cases (documented upfront)
- pages with Shadow DOM of their own
- content inside iframes (MVP may not capture; context menu fallback helps)
- sites that disable selection or manipulate selection
- mobile responsive layouts with weird scrolling containers

MVP must handle normal pages reliably; edge cases get fallback.

