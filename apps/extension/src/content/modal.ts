/**
 * RecipeVault Content Script - Modal Functions
 */

import type { CapturePayload } from "./types";
import {
    modal,
    currentSelectionData,
    setCurrentSelectionData,
    setIsModalOpen,
} from "./state";
import { hideButton } from "./button";
import { showToast } from "./toast";
import { saveRecipeToAPI } from "./api";

const LOGIN_URL = "http://localhost:3000";

export function openModal(): void {
    if (!modal || !currentSelectionData) return;

    setIsModalOpen(true);

    const titleInput = modal.querySelector(".title-input") as HTMLInputElement;
    const tagsInput = modal.querySelector(".tags-input") as HTMLInputElement;
    const notesInput = modal.querySelector(".notes-input") as HTMLTextAreaElement;
    const previewText = modal.querySelector(".preview-text") as HTMLElement;
    const saveBtn = modal.querySelector(".btn-save") as HTMLButtonElement;

    if (titleInput) {
        titleInput.value = currentSelectionData.pageTitle || "";
        saveBtn.disabled = !titleInput.value.trim();
    }
    if (tagsInput) tagsInput.value = "";
    if (notesInput) notesInput.value = "";
    if (previewText) {
        const preview = currentSelectionData.text.substring(0, 200);
        previewText.textContent = preview + (currentSelectionData.text.length > 200 ? "..." : "");
    }

    modal.classList.add("visible");
    hideButton();
    setTimeout(() => titleInput?.focus(), 50);
    console.log("[RecipeVault] Modal opened");
}

export function closeModal(): void {
    if (!modal) return;

    setIsModalOpen(false);
    modal.classList.remove("visible");
    setCurrentSelectionData(null);

    const saveBtn = modal.querySelector(".btn-save") as HTMLButtonElement;
    if (saveBtn) {
        saveBtn.classList.remove("loading");
        saveBtn.textContent = "Save";
        saveBtn.disabled = true;
    }

    console.log("[RecipeVault] Modal closed");
}

export async function handleModalSave(): Promise<void> {
    if (!modal || !currentSelectionData) return;

    const titleInput = modal.querySelector(".title-input") as HTMLInputElement;
    const tagsInput = modal.querySelector(".tags-input") as HTMLInputElement;
    const notesInput = modal.querySelector(".notes-input") as HTMLTextAreaElement;
    const saveBtn = modal.querySelector(".btn-save") as HTMLButtonElement;

    const title = titleInput?.value.trim() || "";
    if (!title) return;

    const tags = (tagsInput?.value || "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

    const notes = notesInput?.value.trim() || "";

    const payload: CapturePayload = {
        title,
        tags,
        notes,
        capturedText: currentSelectionData.text,
        sourceUrl: currentSelectionData.sourceUrl,
        sourceTitle: currentSelectionData.pageTitle,
    };

    if (saveBtn) {
        saveBtn.classList.add("loading");
        saveBtn.textContent = "Saving...";
    }

    console.log("[RecipeVault] Submitting recipe...", payload);
    const result = await saveRecipeToAPI(payload);

    if (result.success) {
        showToast("Saved ✓", "success");
        closeModal();
    } else if (result.queued) {
        // Saved offline for later sync
        showToast("Saved offline • Will sync when online", "offline", 5000, true);
        closeModal();
    } else {
        if (saveBtn) {
            saveBtn.classList.remove("loading");
            saveBtn.textContent = "Save";
        }

        if (result.error === "AUTH_REQUIRED") {
            showToast(`Please log in at ${LOGIN_URL}`, "warning", 6000);
        } else if (result.error === "CONTEXT_INVALIDATED") {
            showToast("Extension updated. Please refresh the page.", "warning", 8000);
        } else if (result.error === "NETWORK_ERROR") {
            showToast("Network error. Check your connection.", "error");
        } else {
            showToast(result.error || "Save failed", "error");
        }
    }
}
