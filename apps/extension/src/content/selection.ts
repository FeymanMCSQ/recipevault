/**
 * RecipeVault Content Script - Selection Detection
 */

import type { SelectionData } from "./types";
import { shadowHost, lastMousePosition } from "./state";

const MAX_CAPTURE_CHARS = 50000;

export function getSelectionData(): SelectionData | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return null;
    }

    const text = selection.toString().trim();

    if (text.length === 0) return null;

    if (text.length > MAX_CAPTURE_CHARS) {
        console.warn(`[RecipeVault] Selection too large: ${text.length} chars (max: ${MAX_CAPTURE_CHARS})`);
        return null;
    }

    // Ignore selections inside our Shadow DOM
    if (shadowHost && selection.anchorNode) {
        const node = selection.anchorNode.parentElement;
        if (node && shadowHost.contains(node)) {
            return null;
        }
    }

    let boundingBox: SelectionData["boundingBox"];
    try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
            boundingBox = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        } else {
            boundingBox = { x: lastMousePosition.x, y: lastMousePosition.y, width: 0, height: 0 };
        }
    } catch {
        boundingBox = { x: lastMousePosition.x, y: lastMousePosition.y, width: 0, height: 0 };
    }

    return {
        text,
        boundingBox,
        sourceUrl: window.location.href,
        pageTitle: document.title,
    };
}
