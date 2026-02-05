/**
 * RecipeVault Background Service Worker
 * Handles API calls to bypass CORS (content scripts inherit page origin)
 */

console.log("[RecipeVault] Background script running");

const API_BASE_URL = "http://localhost:3000"; // TODO: Make configurable for prod

interface SaveRecipeMessage {
    action: "SAVE_RECIPE";
    payload: {
        title: string;
        tags: string[];
        notes: string;
        capturedText: string;
        sourceUrl: string;
        sourceTitle: string;
    };
}

interface SaveRecipeResponse {
    success: boolean;
    error?: string;
    data?: unknown;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener(
    (message: SaveRecipeMessage, _sender, sendResponse: (response: SaveRecipeResponse) => void) => {
        if (message.action === "SAVE_RECIPE") {
            console.log("[RecipeVault Background] Saving recipe:", message.payload);

            // Make API call from background (no CORS issues)
            fetch(`${API_BASE_URL}/api/recipes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(message.payload),
            })
                .then(async (response) => {
                    if (response.ok) {
                        const data = await response.json();
                        console.log("[RecipeVault Background] Recipe saved:", data);
                        sendResponse({ success: true, data });
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData?.error?.message || "Unknown error";

                        if (response.status === 401) {
                            sendResponse({ success: false, error: "AUTH_REQUIRED" });
                        } else if (response.status === 400) {
                            sendResponse({ success: false, error: `Validation: ${errorMessage}` });
                        } else {
                            sendResponse({ success: false, error: errorMessage });
                        }
                    }
                })
                .catch((err) => {
                    console.error("[RecipeVault Background] Network error:", err);
                    sendResponse({ success: false, error: "NETWORK_ERROR" });
                });

            // Return true to indicate we'll send response asynchronously
            return true;
        }
    }
);
