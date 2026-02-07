/**
 * YouTube Transcript Service
 * Direct approach to extract captions from YouTube videos
 */

export interface TranscriptSegment {
    text: string;
    offset: number;
    duration: number;
}

export interface TranscriptResult {
    success: boolean;
    videoId?: string;
    transcript?: string;
    segments?: TranscriptSegment[];
    language?: string;
    error?: string;
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * Fetch transcript using YouTube's innertube API directly
 */
export async function getYoutubeTranscript(urlOrId: string): Promise<TranscriptResult> {
    const videoId = extractVideoId(urlOrId);

    if (!videoId) {
        return { success: false, error: 'Invalid YouTube URL or video ID' };
    }

    console.log(`[Transcript] Fetching transcript for video: ${videoId}`);

    try {
        // Step 1: Get the video page to find caption tracks
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(watchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });

        if (!response.ok) {
            return { success: false, videoId, error: `Failed to fetch video page: ${response.status}` };
        }

        const html = await response.text();

        // Step 2: Extract caption track URL from the page
        // Look for "captionTracks" in the ytInitialPlayerResponse
        const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);

        if (!captionMatch) {
            console.log('[Transcript] No captionTracks found in page');
            return { success: false, videoId, error: 'No captions available for this video' };
        }

        let captionTracks;
        try {
            captionTracks = JSON.parse(captionMatch[1]);
        } catch (e) {
            console.log('[Transcript] Failed to parse captionTracks JSON');
            return { success: false, videoId, error: 'Failed to parse caption data' };
        }

        if (!captionTracks || captionTracks.length === 0) {
            return { success: false, videoId, error: 'No caption tracks found' };
        }

        console.log(`[Transcript] Found ${captionTracks.length} caption tracks`);

        // Step 3: Find English or first available track
        const englishTrack = captionTracks.find((t: { languageCode: string }) =>
            t.languageCode === 'en' || t.languageCode?.startsWith('en')
        ) || captionTracks[0];

        const captionUrl = englishTrack.baseUrl;
        if (!captionUrl) {
            return { success: false, videoId, error: 'No caption URL found' };
        }

        console.log(`[Transcript] Fetching captions from: ${captionUrl.slice(0, 100)}...`);

        // Step 4: Fetch the actual captions (in XML format)
        const captionResponse = await fetch(captionUrl);
        if (!captionResponse.ok) {
            return { success: false, videoId, error: `Failed to fetch captions: ${captionResponse.status}` };
        }

        const captionXml = await captionResponse.text();

        // Step 5: Parse the XML to extract text
        const segments: TranscriptSegment[] = [];
        const regex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
        let match;

        while ((match = regex.exec(captionXml)) !== null) {
            const start = parseFloat(match[1]) * 1000;
            const dur = parseFloat(match[2]) * 1000;
            const text = decodeHtmlEntities(match[3]);

            if (text.trim()) {
                segments.push({ text: text.trim(), offset: start, duration: dur });
            }
        }

        if (segments.length === 0) {
            return { success: false, videoId, error: 'Failed to parse captions' };
        }

        const fullTranscript = segments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim();

        console.log(`[Transcript] ✅ Success: ${segments.length} segments, ${fullTranscript.length} chars`);

        return {
            success: true,
            videoId,
            language: englishTrack.languageCode || 'unknown',
            transcript: fullTranscript,
            segments,
        };

    } catch (error) {
        console.error('[Transcript] Error:', error);
        return {
            success: false,
            videoId,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/\\n/g, ' ');
}
