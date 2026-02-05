/**
 * RecipeVault Content Script
 * Quest 3.1: Selection Detector
 */

// Immediate log to confirm script is running
console.log("%c[RecipeVault] Content script LOADED", "color: green; font-weight: bold; font-size: 14px");

const MAX_CAPTURE_CHARS = 50000;

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
        console.log("[RecipeVault] Selection detected:", {
            textLength: data.text.length,
            textPreview: data.text.substring(0, 100) + (data.text.length > 100 ? "..." : ""),
            boundingBox: data.boundingBox,
            sourceUrl: data.sourceUrl,
            pageTitle: data.pageTitle,
        });

        // TODO: Quest 3.2 - Show floating save button here
    }
}

// Listen for mouseup (primary detection)
document.addEventListener("mouseup", () => {
    // Small delay to ensure selection is finalized
    setTimeout(handleSelectionEvent, 10);
});

// Listen for keyup (keyboard selection via Shift+arrows)
document.addEventListener("keyup", (e) => {
    // Only trigger for selection-related keys
    if (e.shiftKey || e.key === "Shift") {
        setTimeout(handleSelectionEvent, 10);
    }
});

console.log("[RecipeVault] Content script loaded - Selection detector active");
