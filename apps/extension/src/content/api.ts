/**
 * RecipeVault Content Script - API Functions
 */

import type { CapturePayload } from "./types";

export async function saveRecipeToAPI(
    payload: CapturePayload
): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            { action: "SAVE_RECIPE", payload },
            (response: { success: boolean; error?: string }) => {
                if (chrome.runtime.lastError) {
                    console.error("[RecipeVault] Message error:", chrome.runtime.lastError);
                    resolve({ success: false, error: "EXTENSION_ERROR" });
                    return;
                }
                console.log("[RecipeVault] Background response:", response);
                resolve(response);
            }
        );
    });
}
