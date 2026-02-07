/**
 * YouTube Subtitle Extractor - Microservice Client
 * Calls the transcript-worker microservice to extract subtitles
 */

export interface YouTubeSubtitleResult {
    success: boolean;
    videoId?: string;
    title?: string;
    transcript?: string;
    error?: string;
}

// Transcript worker URL - configured via extension storage or defaults
const TRANSCRIPT_WORKER_URL = 'https://transcript-worker.up.railway.app';

/**
 * Check if current page is a YouTube video page
 */
export function isYouTubePage(): boolean {
    return window.location.hostname.includes('youtube.com') &&
        window.location.pathname === '/watch';
}

/**
 * Extract video ID from current YouTube page
 */
export function getVideoId(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('v');
}

/**
 * Get video title from page
 */
export function getVideoTitle(): string {
    const selectors = [
        'h1.ytd-video-primary-info-renderer',
        'h1.ytd-watch-metadata yt-formatted-string',
        '#title h1 yt-formatted-string',
        '#title h1',
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        const title = element?.textContent?.trim();
        if (title) return title;
    }

    return document.title.replace(' - YouTube', '').trim();
}

/**
 * Get transcript worker URL from storage or use default
 */
async function getWorkerUrl(): Promise<string> {
    try {
        const result = await chrome.storage.sync.get('transcriptWorkerUrl');
        return result.transcriptWorkerUrl || TRANSCRIPT_WORKER_URL;
    } catch {
        return TRANSCRIPT_WORKER_URL;
    }
}

/**
 * Extract subtitles via transcript worker microservice
 */
export async function extractYouTubeSubtitles(): Promise<YouTubeSubtitleResult> {
    const videoId = getVideoId();

    if (!videoId) {
        return { success: false, error: 'Not on a YouTube video page' };
    }

    const title = getVideoTitle();
    console.log(`[RecipeVault] 🎬 Extracting subtitles for: ${title} (${videoId})`);

    try {
        const workerUrl = await getWorkerUrl();
        console.log(`[RecipeVault] Using worker: ${workerUrl}`);

        const response = await fetch(`${workerUrl}/transcript?v=${videoId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.log('[RecipeVault] Worker error:', error);
            return {
                success: false,
                videoId,
                title,
                error: error.error || `HTTP ${response.status}`,
            };
        }

        const data = await response.json();
        console.log(`[RecipeVault] ✅ Got ${data.length} chars from worker`);

        return {
            success: true,
            videoId,
            title,
            transcript: data.transcript,
        };

    } catch (error) {
        console.error('[RecipeVault] Worker request failed:', error);
        return {
            success: false,
            videoId,
            title,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}
