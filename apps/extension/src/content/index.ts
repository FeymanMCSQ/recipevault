/**
 * RecipeVault Content Script
 * Quest 3.1: Selection Detector
 * Quest 3.2: Hover Save Button
 * Quest 3.3: Capture Modal
 */

// Immediate log to confirm script is running
console.log("%c[RecipeVault] Content script LOADED", "color: green; font-weight: bold; font-size: 14px");

const MAX_CAPTURE_CHARS = 50000;
const BUTTON_OFFSET = 8;

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

interface CapturePayload {
    title: string;
    tags: string[];
    notes: string;
    capturedText: string;
    sourceUrl: string;
    sourceTitle: string;
}

// ============================================
// Shadow DOM UI Container
// ============================================

let shadowHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let saveButton: HTMLButtonElement | null = null;
let modal: HTMLElement | null = null;
let currentSelectionData: SelectionData | null = null;
let isModalOpen = false;

function initShadowDOM(): void {
    if (shadowHost) return;

    shadowHost = document.createElement("div");
    shadowHost.id = "recipevault-shadow-host";
    shadowHost.style.cssText = "all: initial; position: fixed; z-index: 2147483647; pointer-events: none;";
    document.documentElement.appendChild(shadowHost);

    shadowRoot = shadowHost.attachShadow({ mode: "open" });

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

        /* Modal Overlay */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            backdrop-filter: blur(2px);
        }

        .modal-overlay.visible {
            display: flex;
        }

        /* Modal Container */
        .modal {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            width: 380px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            animation: modalSlideIn 0.2s ease;
        }

        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-10px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .modal-header {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .modal-header svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
        }

        .modal-header h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        .modal-body {
            padding: 20px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
        }

        .form-group label .required {
            color: #ef4444;
        }

        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1.5px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            color: #1f2937;
            transition: border-color 0.15s, box-shadow 0.15s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .form-group textarea {
            resize: vertical;
            min-height: 80px;
        }

        .form-group .helper {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
        }

        .selection-preview {
            background: #f3f4f6;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            max-height: 80px;
            overflow: hidden;
            position: relative;
        }

        .selection-preview::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            background: linear-gradient(transparent, #f3f4f6);
        }

        .selection-preview p {
            margin: 0;
            font-size: 13px;
            color: #4b5563;
            line-height: 1.5;
        }

        .selection-preview .label {
            font-size: 11px;
            font-weight: 600;
            color: #9ca3af;
            text-transform: uppercase;
            margin-bottom: 6px;
        }

        .modal-footer {
            padding: 16px 20px;
            background: #f9fafb;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        .btn {
            padding: 10px 18px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
        }

        .btn-cancel {
            background: white;
            border: 1.5px solid #d1d5db;
            color: #374151;
        }

        .btn-cancel:hover {
            background: #f3f4f6;
        }

        .btn-save {
            background: linear-gradient(135deg, #10b981, #059669);
            border: none;
            color: white;
        }

        .btn-save:hover:not(:disabled) {
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-save:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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

    // Create modal
    modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
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
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });
    shadowRoot.appendChild(modal);

    // Wire up modal events
    const titleInput = modal.querySelector(".title-input") as HTMLInputElement;
    const saveBtn = modal.querySelector(".btn-save") as HTMLButtonElement;
    const cancelBtn = modal.querySelector(".btn-cancel") as HTMLButtonElement;

    titleInput?.addEventListener("input", () => {
        if (saveBtn) {
            saveBtn.disabled = !titleInput.value.trim();
        }
    });

    saveBtn?.addEventListener("click", handleModalSave);
    cancelBtn?.addEventListener("click", closeModal);

    console.log("[RecipeVault] Shadow DOM + Modal initialized");
}

// ============================================
// Modal Functions
// ============================================

function openModal(): void {
    if (!modal || !currentSelectionData) return;

    isModalOpen = true;

    // Prefill title with page title
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

    // Focus title input
    setTimeout(() => titleInput?.focus(), 50);

    console.log("[RecipeVault] Modal opened");
}

function closeModal(): void {
    if (!modal) return;

    isModalOpen = false;
    modal.classList.remove("visible");
    currentSelectionData = null;

    console.log("[RecipeVault] Modal closed");
}

function handleModalSave(): void {
    if (!modal || !currentSelectionData) return;

    const titleInput = modal.querySelector(".title-input") as HTMLInputElement;
    const tagsInput = modal.querySelector(".tags-input") as HTMLInputElement;
    const notesInput = modal.querySelector(".notes-input") as HTMLTextAreaElement;

    const title = titleInput?.value.trim() || "";
    if (!title) return;

    const tagsRaw = tagsInput?.value || "";
    const tags = tagsRaw
        .split(",")
        .map((t: string) => t.trim().toLowerCase())
        .filter((t: string) => t.length > 0);

    const notes = notesInput?.value.trim() || "";

    const payload: CapturePayload = {
        title,
        tags,
        notes,
        capturedText: currentSelectionData.text,
        sourceUrl: currentSelectionData.sourceUrl,
        sourceTitle: currentSelectionData.pageTitle,
    };

    console.log("%c[RecipeVault] Capture payload ready:", "color: blue; font-weight: bold", payload);

    // TODO: Quest 3.4 - Send payload to background worker / API
    closeModal();
}

// ============================================
// Button Positioning
// ============================================

function positionButton(boundingBox: SelectionData["boundingBox"]): void {
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

function showButton(data: SelectionData): void {
    if (isModalOpen) return; // Don't show button if modal is open

    if (!saveButton) {
        initShadowDOM();
    }

    currentSelectionData = data;
    positionButton(data.boundingBox);
    saveButton?.classList.add("visible");
}

function hideButton(): void {
    if (saveButton) {
        saveButton.classList.remove("visible");
    }
}

// ============================================
// Event Handlers
// ============================================

function handleSaveClick(e: Event): void {
    e.preventDefault();
    e.stopPropagation();

    if (currentSelectionData) {
        openModal();
    }
}

let lastMousePosition = { x: 0, y: 0 };

document.addEventListener("mousemove", (e) => {
    lastMousePosition = { x: e.clientX, y: e.clientY };
});

function getSelectionData(): SelectionData | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return null;
    }

    const text = selection.toString().trim();

    if (text.length === 0) {
        return null;
    }

    if (text.length > MAX_CAPTURE_CHARS) {
        console.warn(`[RecipeVault] Selection too large: ${text.length} chars (max: ${MAX_CAPTURE_CHARS})`);
        return null;
    }

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

function handleSelectionEvent(): void {
    if (isModalOpen) return; // Don't update while modal is open

    const data = getSelectionData();

    if (data) {
        showButton(data);
    } else {
        hideButton();
    }
}

// Listen for mouseup
document.addEventListener("mouseup", (e) => {
    if (isModalOpen) return;
    if (shadowHost && e.target === shadowHost) return;

    setTimeout(handleSelectionEvent, 10);
});

// Listen for keyup
document.addEventListener("keyup", (e) => {
    if (e.key === "Escape") {
        if (isModalOpen) {
            closeModal();
        } else {
            hideButton();
            window.getSelection()?.removeAllRanges();
        }
        return;
    }

    if (isModalOpen) return;

    if (e.shiftKey || e.key === "Shift") {
        setTimeout(handleSelectionEvent, 10);
    }
});

// Hide button on scroll
let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
window.addEventListener("scroll", () => {
    if (isModalOpen) return;

    hideButton();

    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        handleSelectionEvent();
    }, 150);
}, { passive: true });

// Hide on click elsewhere
document.addEventListener("mousedown", (e) => {
    if (isModalOpen) return;
    if (saveButton && shadowRoot?.contains(e.target as Node)) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
            setTimeout(() => {
                if (!window.getSelection()?.toString().trim()) {
                    hideButton();
                }
            }, 10);
        }
    }
});

// Initialize
initShadowDOM();

console.log("[RecipeVault] Selection detector + Save button + Modal active");
