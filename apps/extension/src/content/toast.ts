/**
 * RecipeVault Content Script - Toast Notifications
 */

import { toastContainer } from "./state";

const ICONS = {
    success: `<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`,
    error: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`,
    warning: `<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
    offline: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
};

export function showToast(
    message: string,
    type: "success" | "error" | "warning" | "offline",
    duration = 4000,
    showRetry = false
): void {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type === "offline" ? "warning" : type}`;

    let content = ICONS[type] + `<span>${message}</span>`;

    if (showRetry) {
        content += `<button class="toast-retry">Retry</button>`;
    }

    toast.innerHTML = content;
    toastContainer.appendChild(toast);

    // Handle retry button click
    if (showRetry) {
        const retryBtn = toast.querySelector(".toast-retry") as HTMLButtonElement;
        retryBtn?.addEventListener("click", () => {
            toast.remove();
            triggerQueueRetry();
        });
    }

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";
        toast.style.transition = "all 0.25s ease";
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

export function triggerQueueRetry(): void {
    chrome.runtime.sendMessage({ action: "RETRY_QUEUE" }, (response) => {
        if (response?.success && response.data) {
            const { synced, failed } = response.data;
            if (synced > 0) {
                showToast(`Synced ${synced} recipe${synced > 1 ? "s" : ""} ✓`, "success");
            } else if (failed > 0) {
                showToast(`${failed} recipe${failed > 1 ? "s" : ""} failed to sync`, "error");
            } else {
                showToast("No connection yet", "warning");
            }
        }
    });
}
