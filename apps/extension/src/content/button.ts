/**
 * RecipeVault Content Script - Button Functions
 */

import type { SelectionData } from "./types";
import {
    saveButton,
    isModalOpen,
    setCurrentSelectionData,
} from "./state";

const BUTTON_OFFSET = 8;

export function positionButton(boundingBox: SelectionData["boundingBox"]): void {
    if (!saveButton) return;

    const buttonWidth = 120;
    const buttonHeight = 36;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = boundingBox.x + boundingBox.width + BUTTON_OFFSET;
    let y = boundingBox.y - buttonHeight - BUTTON_OFFSET;

    if (y < BUTTON_OFFSET) {
        y = boundingBox.y + boundingBox.height + BUTTON_OFFSET;
    }

    if (x + buttonWidth > viewportWidth - BUTTON_OFFSET) {
        x = boundingBox.x - buttonWidth - BUTTON_OFFSET;
    }

    x = Math.max(BUTTON_OFFSET, Math.min(x, viewportWidth - buttonWidth - BUTTON_OFFSET));
    y = Math.max(BUTTON_OFFSET, Math.min(y, viewportHeight - buttonHeight - BUTTON_OFFSET));

    saveButton.style.left = `${x}px`;
    saveButton.style.top = `${y}px`;
}

export function showButton(data: SelectionData): void {
    if (isModalOpen) return;

    setCurrentSelectionData(data);
    positionButton(data.boundingBox);
    saveButton?.classList.add("visible");
}

export function hideButton(): void {
    saveButton?.classList.remove("visible");
}
