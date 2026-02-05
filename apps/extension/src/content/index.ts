/**
 * RecipeVault Content Script
 * Quest 3.1: Selection Detector
 * Quest 3.2: Hover Save Button
 */

// Immediate log to confirm script is running
console.log("%c[RecipeVault] Content script LOADED", "color: green; font-weight: bold; font-size: 14px");

const MAX_CAPTURE_CHARS = 50000;
const BUTTON_OFFSET = 8; // px offset from selection

interface SelectionData {
    text: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    sourceUrl: string;
    pageTitle: string;
}

// ============================================
// Shadow DOM UI Container
// ============================================

let shadowHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let saveButton: HTMLButtonElement | null = null;
let currentSelectionData: SelectionData | null = null;

function initShadowDOM(): void {
    if (shadowHost) return; // Already initialized

    // Create host element
    shadowHost = document.createElement("div");
    shadowHost.id = "recipevault-shadow-host";
    shadowHost.style.cssText = "all: initial; position: fixed; z-index: 2147483647; pointer-events: none;";
    document.documentElement.appendChild(shadowHost);

    // Attach shadow root
    shadowRoot = shadowHost.attachShadow({ mode: "open" });

    // Inject styles into shadow root
    const styles = document.createElement("style");
    styles.textContent = `
        * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .save-button {
            position: fixed;
            display: none;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            pointer-events: auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            white-space: nowrap;
        }

        .save-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.12);
        }

        .save-button:active {
            transform: translateY(0);
        }

        .save-button svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        .save-button.visible {
            display: flex;
        }
    `;
    shadowRoot.appendChild(styles);

    // Create save button
    saveButton = document.createElement("button");
    saveButton.className = "save-button";
    saveButton.setAttribute("aria-label", "Save recipe");
    saveButton.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </svg>
        Save Recipe
    `;
    saveButton.addEventListener("click", handleSaveClick);
    shadowRoot.appendChild(saveButton);

    console.log("[RecipeVault] Shadow DOM initialized");
}

// ============================================
// Button Positioning
// ============================================

function positionButton(boundingBox: SelectionData["boundingBox"]): void {
    if (!saveButton) return;

    const buttonWidth = 120; // Approximate width
    const buttonHeight = 36; // Approximate height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position: prefer above-right of selection
    let x = boundingBox.x + boundingBox.width + BUTTON_OFFSET;
    let y = boundingBox.y - buttonHeight - BUTTON_OFFSET;

    // If no space above, place below
    if (y < BUTTON_OFFSET) {
        y = boundingBox.y + boundingBox.height + BUTTON_OFFSET;
    }

    // If no space to the right, place to the left
    if (x + buttonWidth > viewportWidth - BUTTON_OFFSET) {
        x = boundingBox.x - buttonWidth - BUTTON_OFFSET;
    }

    // Clamp to viewport
    x = Math.max(BUTTON_OFFSET, Math.min(x, viewportWidth - buttonWidth - BUTTON_OFFSET));
    y = Math.max(BUTTON_OFFSET, Math.min(y, viewportHeight - buttonHeight - BUTTON_OFFSET));

    saveButton.style.left = `${x}px`;
    saveButton.style.top = `${y}px`;
}

function showButton(data: SelectionData): void {
    if (!saveButton) {
        initShadowDOM();
    }

    currentSelectionData = data;
    positionButton(data.boundingBox);
    saveButton?.classList.add("visible");

    console.log("[RecipeVault] Button shown at", data.boundingBox);
}

function hideButton(): void {
    if (saveButton) {
        saveButton.classList.remove("visible");
        currentSelectionData = null;
    }
}

// ============================================
// Event Handlers
// ============================================

function handleSaveClick(e: Event): void {
    e.preventDefault();
    e.stopPropagation();

    if (currentSelectionData) {
        console.log("[RecipeVault] Save clicked!", {
            textLength: currentSelectionData.text.length,
            textPreview: currentSelectionData.text.substring(0, 100),
            sourceUrl: currentSelectionData.sourceUrl,
            pageTitle: currentSelectionData.pageTitle,
        });

        // TODO: Quest 3.3 - Open capture modal here
        hideButton();
    }
}

let lastMousePosition = { x: 0, y: 0 };

// Track mouse position for fallback bounding box
document.addEventListener("mousemove", (e) => {
    lastMousePosition = { x: e.clientX, y: e.clientY };
});

/**
 * Get the current text selection and compute its bounding box
 */
function getSelectionData(): SelectionData | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return null;
    }

    const text = selection.toString().trim();

    // Validate: must have content
    if (text.length === 0) {
        return null;
    }

    // Validate: must not exceed max chars
    if (text.length > MAX_CAPTURE_CHARS) {
        console.warn(
            `[RecipeVault] Selection too large: ${text.length} chars (max: ${MAX_CAPTURE_CHARS})`
        );
        return null;
    }

    // Check if selection is inside our own UI
    if (shadowHost && selection.anchorNode) {
        const node = selection.anchorNode.parentElement;
        if (node && shadowHost.contains(node)) {
            return null; // Ignore selections inside our UI
        }
    }

    // Compute bounding box
    let boundingBox: SelectionData["boundingBox"];
    try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Check if rect is valid (non-zero dimensions)
        if (rect.width > 0 && rect.height > 0) {
            boundingBox = {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
            };
        } else {
            // Fallback to last known mouse position
            boundingBox = {
                x: lastMousePosition.x,
                y: lastMousePosition.y,
                width: 0,
                height: 0,
            };
        }
    } catch {
        // Fallback to mouse position
        boundingBox = {
            x: lastMousePosition.x,
            y: lastMousePosition.y,
            width: 0,
            height: 0,
        };
    }

    return {
        text,
        boundingBox,
        sourceUrl: window.location.href,
        pageTitle: document.title,
    };
}

/**
 * Handle selection event (mouseup or keyup)
 */
function handleSelectionEvent(): void {
    const data = getSelectionData();

    if (data) {
        showButton(data);
    } else {
        hideButton();
    }
}

// Listen for mouseup (primary detection)
document.addEventListener("mouseup", (e) => {
    // Ignore clicks on our own button
    if (shadowHost && e.target === shadowHost) {
        return;
    }

    // Small delay to ensure selection is finalized
    setTimeout(handleSelectionEvent, 10);
});

// Listen for keyup (keyboard selection via Shift+arrows)
document.addEventListener("keyup", (e) => {
    // Only trigger for selection-related keys
    if (e.shiftKey || e.key === "Shift") {
        setTimeout(handleSelectionEvent, 10);
    }

    // Hide on Escape
    if (e.key === "Escape") {
        hideButton();
        window.getSelection()?.removeAllRanges();
    }
});

// Hide button on scroll
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
window.addEventListener("scroll", () => {
    hideButton();

    // Re-evaluate after scroll stops
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        handleSelectionEvent();
    }, 150);
}, { passive: true });

// Hide on click elsewhere (when selection is cleared)
document.addEventListener("mousedown", (e) => {
    // Don't hide if clicking our button
    if (saveButton && shadowRoot?.contains(e.target as Node)) {
        return;
    }

    // Check if click will clear selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
            // Selection exists, will likely be cleared by this click
            setTimeout(() => {
                if (!window.getSelection()?.toString().trim()) {
                    hideButton();
                }
            }, 10);
        }
    }
});

// Initialize Shadow DOM on load
initShadowDOM();

console.log("[RecipeVault] Selection detector + Save button active");
