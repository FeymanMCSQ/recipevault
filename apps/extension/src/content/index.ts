/**
 * RecipeVault Content Script - Entry Point
 * Quests: 3.1 Selection Detector, 3.2 Save Button, 3.3 Modal, 3.4 API
 */

console.log("%c[RecipeVault] Content script LOADED", "color: green; font-weight: bold; font-size: 14px");

import { contentStyles } from "./styles";
import { extractYouTubeSubtitles, isYouTubePage } from "./youtube";
import {
    shadowHost,
    shadowRoot,
    setShadowHost,
    setShadowRoot,
    setSaveButton,
    setModal,
    setToastContainer,
    isModalOpen,
    currentSelectionData,
    setLastMousePosition,
} from "./state";
import { openModal, closeModal, handleModalSave } from "./modal";
import { showButton, hideButton } from "./button";
import { getSelectionData } from "./selection";

// ============================================
// Initialize Shadow DOM
// ============================================

function initShadowDOM(): void {
    if (shadowHost) return;

    const host = document.createElement("div");
    host.id = "recipevault-shadow-host";
    host.style.cssText = "all: initial; position: fixed; z-index: 2147483647; pointer-events: none;";
    document.documentElement.appendChild(host);
    setShadowHost(host);

    const root = host.attachShadow({ mode: "open" });
    setShadowRoot(root);

    // Inject styles
    const styles = document.createElement("style");
    styles.textContent = contentStyles;
    root.appendChild(styles);

    // Create save button
    const saveBtn = document.createElement("button");
    saveBtn.className = "save-button";
    saveBtn.setAttribute("aria-label", "Save recipe");
    saveBtn.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </svg>
        Save Recipe
    `;
    saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentSelectionData) openModal();
    });
    root.appendChild(saveBtn);
    setSaveButton(saveBtn);

    // Create modal
    const modalEl = document.createElement("div");
    modalEl.className = "modal-overlay";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-modal", "true");
    modalEl.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                </svg>
                <h2>Save Recipe</h2>
            </div>
            <div class="modal-body">
                <div class="selection-preview">
                    <div class="label">Selected Text</div>
                    <p class="preview-text"></p>
                </div>
                <div class="form-group">
                    <label>Title <span class="required">*</span></label>
                    <input type="text" class="title-input" placeholder="Recipe title" maxlength="120" />
                </div>
                <div class="form-group">
                    <label>Tags</label>
                    <input type="text" class="tags-input" placeholder="soup, dinner, quick" />
                    <div class="helper">Comma-separated tags</div>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea class="notes-input" placeholder="Any notes about this recipe..." maxlength="2000"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-cancel" type="button">Cancel</button>
                <button class="btn btn-save" type="button" disabled>Save</button>
            </div>
        </div>
    `;
    modalEl.addEventListener("click", (e) => { if (e.target === modalEl) closeModal(); });
    root.appendChild(modalEl);
    setModal(modalEl);

    // Wire modal events
    const titleInput = modalEl.querySelector(".title-input") as HTMLInputElement;
    const saveBtnModal = modalEl.querySelector(".btn-save") as HTMLButtonElement;
    const cancelBtn = modalEl.querySelector(".btn-cancel") as HTMLButtonElement;

    titleInput?.addEventListener("input", () => { saveBtnModal.disabled = !titleInput.value.trim(); });
    saveBtnModal?.addEventListener("click", handleModalSave);
    cancelBtn?.addEventListener("click", closeModal);

    // Create toast container
    const toastEl = document.createElement("div");
    toastEl.className = "toast-container";
    root.appendChild(toastEl);
    setToastContainer(toastEl);

    console.log("[RecipeVault] Shadow DOM initialized");
}

// ============================================
// Selection Event Handler
// ============================================

function handleSelectionEvent(): void {
    if (isModalOpen) return;

    const data = getSelectionData();
    if (data) {
        showButton(data);
    } else {
        hideButton();
    }
}

// ============================================
// Event Listeners
// ============================================

document.addEventListener("mousemove", (e) => {
    setLastMousePosition({ x: e.clientX, y: e.clientY });
});

document.addEventListener("mouseup", (e) => {
    if (isModalOpen) return;
    if (shadowHost && e.target === shadowHost) return;
    setTimeout(handleSelectionEvent, 10);
});

document.addEventListener("keyup", (e) => {
    if (e.key === "Escape") {
        if (isModalOpen) closeModal();
        else { hideButton(); window.getSelection()?.removeAllRanges(); }
        return;
    }
    if (isModalOpen) return;
    if (e.shiftKey || e.key === "Shift") setTimeout(handleSelectionEvent, 10);
});

let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
window.addEventListener("scroll", () => {
    if (isModalOpen) return;
    hideButton();
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleSelectionEvent, 150);
}, { passive: true });

document.addEventListener("mousedown", (e) => {
    if (isModalOpen) return;
    if (shadowRoot?.contains(e.target as Node)) return;

    const selection = window.getSelection();
    if (selection?.rangeCount && !selection.getRangeAt(0).collapsed) {
        setTimeout(() => { if (!window.getSelection()?.toString().trim()) hideButton(); }, 10);
    }
});

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // Handle page extraction request from popup
    if (message.action === "EXTRACT_PAGE") {
        try {
            const content = extractPageContent();
            sendResponse({
                success: true,
                title: document.title,
                content: content,
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: error instanceof Error ? error.message : "Extraction failed",
            });
        }
        return true;
    }

    // Handle YouTube subtitle extraction
    if (message.action === "EXTRACT_YOUTUBE") {
        if (!isYouTubePage()) {
            sendResponse({ success: false, error: "Not a YouTube video page" });
            return true;
        }
        extractYouTubeSubtitles()
            .then(sendResponse)
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep channel open for async response
    }

    // Handle background sync notifications
    if (message.action === "QUEUE_SYNCED" && message.synced > 0) {
        import("./toast").then(({ showToast }) => {
            showToast(`Synced ${message.synced} recipe${message.synced > 1 ? "s" : ""} ✓`, "success");
        });
    }

    return false;
});

// Extract main content from page (used by popup's one-click save)
function extractPageContent(): string {
    // Try to find recipe-specific content first
    const recipeSelectors = [
        '[itemtype*="Recipe"]',
        '[class*="recipe"]',
        '[id*="recipe"]',
        'article',
        'main',
        '.post-content',
        '.entry-content',
        '.content',
    ];

    for (const selector of recipeSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.trim().length > 100) {
            const text = cleanText(element.textContent);
            if (text.length > 100) {
                console.log(`[RecipeVault] Extracted from: ${selector}`);
                return text.slice(0, 50000); // Max 50k chars
            }
        }
    }

    // Fallback to body content
    const body = document.body.textContent || '';
    return cleanText(body).slice(0, 50000);
}

function cleanText(text: string): string {
    return text
        .replace(/\s+/g, ' ')           // Normalize whitespace
        .replace(/\n{3,}/g, '\n\n')     // Max 2 newlines
        .trim();
}

// ============================================
// SPA Support - Re-inject if removed
// ============================================

function ensureShadowHostExists(): void {
    const existing = document.getElementById("recipevault-shadow-host");
    if (!existing) {
        console.log("[RecipeVault] Shadow host removed, re-initializing...");
        // Reset state
        import("./state").then(({ setShadowHost, setShadowRoot, setSaveButton, setModal, setToastContainer }) => {
            setShadowHost(null as unknown as HTMLElement);
            setShadowRoot(null as unknown as ShadowRoot);
            setSaveButton(null as unknown as HTMLButtonElement);
            setModal(null as unknown as HTMLElement);
            setToastContainer(null as unknown as HTMLElement);
            initShadowDOM();
        });
    }
}

// Watch for DOM changes that might remove our host
const observer = new MutationObserver(() => {
    ensureShadowHostExists();
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: false, // Only watch direct children of <html>
});

// Initialize
initShadowDOM();
console.log("[RecipeVault] Ready (SPA-compatible)");
