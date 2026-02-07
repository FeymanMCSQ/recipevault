/**
 * RecipeVault Background Service Worker
 * Handles API calls to bypass CORS and offline retry queue
 */

console.log("[RecipeVault] Background script running");

const API_BASE_URL = "http://localhost:3000";
const RETRY_INTERVAL_MS = 30000; // 30 seconds
const MAX_RETRIES = 5;

interface RecipePayload {
    title: string;
    tags: string[];
    notes: string;
    capturedText: string;
    sourceUrl: string;
    sourceTitle: string;
}

interface QueuedRecipe {
    id: string;
    payload: RecipePayload;
    retryCount: number;
    createdAt: number;
}

interface SaveRecipeMessage {
    action: "SAVE_RECIPE" | "RETRY_QUEUE" | "GET_QUEUE_STATUS";
    payload?: RecipePayload;
}

interface SaveRecipeResponse {
    success: boolean;
    error?: string;
    data?: unknown;
    queued?: boolean;
    queueLength?: number;
}

// ============================================
// Queue Management
// ============================================

async function getQueue(): Promise<QueuedRecipe[]> {
    const result = await chrome.storage.local.get("recipeQueue");
    return result.recipeQueue || [];
}

async function saveQueue(queue: QueuedRecipe[]): Promise<void> {
    await chrome.storage.local.set({ recipeQueue: queue });
}

async function addToQueue(payload: RecipePayload): Promise<string> {
    const queue = await getQueue();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    queue.push({
        id,
        payload,
        retryCount: 0,
        createdAt: Date.now(),
    });
    await saveQueue(queue);
    console.log(`[RecipeVault] Added to queue: ${id}, queue size: ${queue.length}`);
    return id;
}

async function removeFromQueue(id: string): Promise<void> {
    const queue = await getQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await saveQueue(filtered);
    console.log(`[RecipeVault] Removed from queue: ${id}`);
}

// ============================================
// API Call with Retry
// ============================================

async function saveRecipe(payload: RecipePayload): Promise<SaveRecipeResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/recipes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, data };
        }

        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || "Unknown error";

        if (response.status === 401) {
            return { success: false, error: "AUTH_REQUIRED" };
        } else if (response.status === 400) {
            return { success: false, error: `Validation: ${errorMessage}` };
        }
        return { success: false, error: errorMessage };
    } catch (err) {
        console.error("[RecipeVault] Network error:", err);
        return { success: false, error: "NETWORK_ERROR" };
    }
}

// ============================================
// Retry Queue Processing
// ============================================

async function processQueue(): Promise<{ synced: number; failed: number }> {
    const queue = await getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    console.log(`[RecipeVault] Processing queue: ${queue.length} items`);

    let synced = 0;
    let failed = 0;

    for (const item of queue) {
        const result = await saveRecipe(item.payload);

        if (result.success) {
            await removeFromQueue(item.id);
            synced++;
            console.log(`[RecipeVault] Queue item synced: ${item.id}`);
        } else if (result.error === "NETWORK_ERROR") {
            // Keep in queue for later retry
            console.log(`[RecipeVault] Queue item still offline: ${item.id}`);
        } else if (result.error === "AUTH_REQUIRED") {
            // Auth issue - keep in queue
            console.log(`[RecipeVault] Queue item needs auth: ${item.id}`);
        } else {
            // Permanent failure (validation error etc.)
            item.retryCount++;
            if (item.retryCount >= MAX_RETRIES) {
                await removeFromQueue(item.id);
                failed++;
                console.log(`[RecipeVault] Queue item failed permanently: ${item.id}`);
            }
        }
    }

    return { synced, failed };
}

// ============================================
// Message Handler
// ============================================

chrome.runtime.onMessage.addListener(
    (message: SaveRecipeMessage, _sender, sendResponse: (response: SaveRecipeResponse) => void) => {
        if (message.action === "SAVE_RECIPE" && message.payload) {
            console.log("[RecipeVault] Saving recipe:", message.payload);

            saveRecipe(message.payload).then(async (result) => {
                if (result.success) {
                    sendResponse(result);
                } else if (result.error === "NETWORK_ERROR") {
                    // Queue for later
                    await addToQueue(message.payload!);
                    const queue = await getQueue();
                    sendResponse({
                        success: false,
                        error: "QUEUED_OFFLINE",
                        queued: true,
                        queueLength: queue.length,
                    });
                } else {
                    sendResponse(result);
                }
            });

            return true; // Async response
        }

        if (message.action === "RETRY_QUEUE") {
            processQueue().then((result) => {
                sendResponse({ success: true, data: result });
            });
            return true;
        }

        if (message.action === "GET_QUEUE_STATUS") {
            getQueue().then((queue) => {
                sendResponse({ success: true, queueLength: queue.length });
            });
            return true;
        }
    }
);

// ============================================
// Periodic Retry (Alarm)
// ============================================

chrome.alarms.create("retryQueue", { periodInMinutes: 0.5 }); // Every 30 seconds

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "retryQueue") {
        const queue = await getQueue();
        if (queue.length > 0) {
            console.log("[RecipeVault] Alarm triggered, processing queue...");
            const result = await processQueue();
            if (result.synced > 0) {
                // Notify content scripts about synced items
                chrome.tabs.query({}, (tabs) => {
                    for (const tab of tabs) {
                        if (tab.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                action: "QUEUE_SYNCED",
                                synced: result.synced,
                            }).catch(() => { }); // Ignore errors for inactive tabs
                        }
                    }
                });
            }
        }
    }
});
