/**
 * RecipeVault Content Script - API Functions
 */

import type { CapturePayload } from "./types";

interface ApiResponse {
    success: boolean;
    error?: string;
    queued?: boolean;
    queueLength?: number;
}

function isExtensionValid(): boolean {
    try {
        return !!chrome.runtime?.id;
    } catch {
        return false;
    }
}

export async function saveRecipeToAPI(payload: CapturePayload): Promise<ApiResponse> {
    // Check if extension context is still valid
    if (!isExtensionValid()) {
        return { success: false, error: "CONTEXT_INVALIDATED" };
    }

    return new Promise((resolve) => {
        try {
            chrome.runtime.sendMessage(
                { action: "SAVE_RECIPE", payload },
                (response: ApiResponse) => {
                    if (chrome.runtime.lastError) {
                        console.error("[RecipeVault] Message error:", chrome.runtime.lastError);
                        resolve({ success: false, error: "EXTENSION_ERROR" });
                        return;
                    }
                    console.log("[RecipeVault] Background response:", response);
                    resolve(response);
                }
            );
        } catch {
            resolve({ success: false, error: "CONTEXT_INVALIDATED" });
        }
    });
}
