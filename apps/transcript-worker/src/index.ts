/**
 * Transcript Worker - YouTube Subtitle Extraction Microservice
 * Uses yt-dlp to extract subtitles/auto-captions from YouTube videos
 * 
 * IMPORTANT: Requires latest yt-dlp binary in this directory
 * Download: curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
 * 
 * Endpoints:
 * - GET /health - Health check
 * - GET /transcript?v={videoId} - Get transcript for a video
 */

import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink, readdir, writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

// Path to yt-dlp binary (bundled with this service)
const YT_DLP_PATH = process.env.YT_DLP_PATH || path.join(__dirname, '..', 'yt-dlp');

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'transcript-worker' });
});

// Check if yt-dlp is installed and get version
app.get('/check', async (req, res) => {
    try {
        const { stdout } = await execAsync(`${YT_DLP_PATH} --version`);
        res.json({
            installed: true,
            version: stdout.trim(),
            path: YT_DLP_PATH,
        });
    } catch (error) {
        // Fallback to system yt-dlp
        try {
            const { stdout } = await execAsync('yt-dlp --version');
            res.json({
                installed: true,
                version: stdout.trim(),
                path: 'system',
            });
        } catch {
            res.status(500).json({
                installed: false,
                error: 'yt-dlp not installed',
            });
        }
    }
});

// Extract transcript from YouTube video
app.get('/transcript', async (req, res) => {
    const videoId = req.query.v as string;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing video ID (v parameter)' });
    }

    // Validate video ID format
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return res.status(400).json({ error: 'Invalid video ID format' });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const tempDir = os.tmpdir();
    const sessionId = `transcript_${videoId}_${Date.now()}`;
    const outputPath = path.join(tempDir, sessionId);
    let cookieFilePath: string | null = null;
    let subtitleFilePath: string | null = null;

    console.log(`[Transcript] Extracting subtitles for: ${videoId}`);

    try {
        // Handle cookies: 
        // 1. Env var YOUTUBE_COOKIES (Netscape format content) -> temp file
        // 2. Env var COOKIES_FILE (path to existing file)
        // 3. Browser cookies (local dev only)
        let cookieArgs = '';

        if (process.env.YOUTUBE_COOKIES) {
            cookieFilePath = path.join(tempDir, `${sessionId}_cookies.txt`);
            await writeFile(cookieFilePath, process.env.YOUTUBE_COOKIES, 'utf-8');
            cookieArgs = `--cookies "${cookieFilePath}"`;
        } else if (process.env.COOKIES_FILE) {
            cookieArgs = `--cookies "${process.env.COOKIES_FILE}"`;
        } else if (process.env.USE_BROWSER_COOKIES === 'true') {
            cookieArgs = '--cookies-from-browser chrome';
        }

        const cmd = [
            YT_DLP_PATH,
            '--skip-download',
            '--write-auto-sub',
            '--write-sub',
            '--sub-lang', 'en,en-US,en-GB',
            '--sub-format', 'vtt',
            '-o', `"${outputPath}"`,
            cookieArgs,
            `"${videoUrl}"`,
        ].filter(Boolean).join(' ');

        console.log(`[Transcript] Running: ${YT_DLP_PATH} ...`);

        // Include deno in PATH for yt-dlp JavaScript challenge solving
        const denoPath = process.env.DENO_PATH || `${process.env.HOME}/.deno/bin`;
        const envPath = `${denoPath}:${process.env.PATH}`;

        try {
            await execAsync(cmd, {
                timeout: 90000,
                env: { ...process.env, PATH: envPath },
            });
        } catch (execError) {
            // yt-dlp may exit with code 1 but still produce output (warnings)
            // Check if subtitle file was created anyway
            console.log(`[Transcript] yt-dlp exited with warning, checking for output...`);
        }

        // Find the generated subtitle file
        const files = await readdir(tempDir);
        const subtitleFile = files.find(f =>
            f.startsWith(`transcript_${videoId}`) && f.endsWith('.vtt')
        );

        if (!subtitleFile) {
            console.log('[Transcript] No subtitle file generated');
            return res.status(404).json({
                error: 'No subtitles available for this video',
                videoId,
            });
        }

        const filePath = path.join(tempDir, subtitleFile);
        console.log(`[Transcript] Reading: ${subtitleFile}`);

        const content = await readFile(filePath, 'utf-8');

        // Parse VTT to plain text
        const transcript = parseVTT(content);

        // Cleanup
        try {
            await unlink(filePath); // delete .vtt file
            if (cookieFilePath) {
                await unlink(cookieFilePath).catch(() => { }); // delete temp cookie file
            }
        } catch (e) {
            // Ignore cleanup errors
        }

        console.log(`[Transcript] Success: ${transcript.length} chars`);

        res.json({
            success: true,
            videoId,
            transcript,
            length: transcript.length,
        });

    } catch (error) {
        console.error('[Transcript] Error:', error);

        res.status(500).json({
            error: 'Failed to extract transcript',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * Parse VTT subtitles to plain text
 */
function parseVTT(content: string): string {
    const lines = content.split('\n');
    const textLines: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) continue;

        // Skip VTT header
        if (trimmed === 'WEBVTT' || trimmed.startsWith('Kind:') || trimmed.startsWith('Language:')) continue;

        // Skip timestamp lines
        if (/^\d{2}:\d{2}/.test(trimmed) && trimmed.includes('-->')) continue;

        // Skip position metadata
        if (trimmed.includes('align:') || trimmed.includes('position:')) continue;

        // Clean up VTT tags
        let cleaned = trimmed
            .replace(/<\d{2}:\d{2}[^>]*>/g, '')  // Remove timestamp tags
            .replace(/<\/?c[^>]*>/g, '')          // Remove <c> tags
            .replace(/<\/?[^>]*>/g, '')           // Remove other HTML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();

        // Skip duplicates and empty
        if (cleaned && !textLines.includes(cleaned)) {
            textLines.push(cleaned);
        }
    }

    return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

app.listen(PORT, () => {
    console.log(`[Transcript Worker] Running on port ${PORT}`);
    console.log(`[Transcript Worker] yt-dlp path: ${YT_DLP_PATH}`);
    console.log(`[Transcript Worker] Health: http://localhost:${PORT}/health`);
    console.log(`[Transcript Worker] Usage: http://localhost:${PORT}/transcript?v=VIDEO_ID`);
});
