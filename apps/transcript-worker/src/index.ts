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
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

// Path to yt-dlp binary (bundled with this service)
const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';

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
        const cookieSummary = process.env.YOUTUBE_COOKIES
            ? summarizeCookieEnv(process.env.YOUTUBE_COOKIES)
            : null;
        const denoVersion = await getCommandVersion('deno --version');

        res.json({
            installed: true,
            version: stdout.trim(),
            path: YT_DLP_PATH,
            deno: denoVersion,
            cookies: cookieSummary,
        });
    } catch (error) {
        // Fallback to system yt-dlp
        try {
            const { stdout } = await execAsync('yt-dlp --version');
            const cookieSummary = process.env.YOUTUBE_COOKIES
                ? summarizeCookieEnv(process.env.YOUTUBE_COOKIES)
                : null;
            const denoVersion = await getCommandVersion('deno --version');

            res.json({
                installed: true,
                version: stdout.trim(),
                path: 'system',
                deno: denoVersion,
                cookies: cookieSummary,
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
        let cookieSource: 'YOUTUBE_COOKIES' | 'COOKIES_FILE' | 'browser' | 'none' = 'none';
        let cookieDebug: ReturnType<typeof summarizeCookieEnv> | null = null;

        if (process.env.YOUTUBE_COOKIES) {
            cookieFilePath = path.join(tempDir, `${sessionId}_cookies.txt`);
            const normalizedCookieContent = normalizeCookieEnv(process.env.YOUTUBE_COOKIES);
            const summary = summarizeCookieEnv(normalizedCookieContent);
            cookieSource = 'YOUTUBE_COOKIES';
            cookieDebug = summary;

            console.log(`[Transcript] Cookie source: YOUTUBE_COOKIES (${summary.cookieLines} cookie lines, ${summary.invalidLines} invalid lines)`);
            await writeFile(cookieFilePath, normalizedCookieContent, { encoding: 'utf-8', mode: 0o600 });
            cookieArgs = `--cookies "${cookieFilePath}"`;
        } else if (process.env.COOKIES_FILE) {
            console.log('[Transcript] Cookie source: COOKIES_FILE');
            cookieSource = 'COOKIES_FILE';
            cookieArgs = `--cookies "${process.env.COOKIES_FILE}"`;
        } else if (process.env.USE_BROWSER_COOKIES === 'true') {
            console.log('[Transcript] Cookie source: browser');
            cookieSource = 'browser';
            cookieArgs = '--cookies-from-browser chrome';
        } else {
            console.log('[Transcript] Cookie source: none');
        }

        const cmd = [
            YT_DLP_PATH,
            '--impersonate', 'chrome',
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
        const denoBinPath = denoPath.endsWith('/deno') ? path.dirname(denoPath) : denoPath;
        const envPath = `${denoBinPath}:${process.env.PATH}`;

        let execOutput = { stdout: '', stderr: '' };

        try {
            execOutput = await execAsync(cmd, {
                timeout: 90000,
                env: { ...process.env, PATH: envPath },
            });
        } catch (error) {
            const execError = error as any;
            // yt-dlp may exit with code 1 but still produce output (warnings)
            console.log(`[Transcript] yt-dlp exited with warning/error`);
            execOutput = {
                stdout: execError.stdout || '',
                stderr: execError.stderr || execError.message
            };
        }

        // Find the generated subtitle file
        const files = await readdir(tempDir);
        const subtitleFile = files.find(f =>
            f.startsWith(sessionId) && f.endsWith('.vtt')
        );

        if (!subtitleFile) {
            console.log('[Transcript] No subtitle file generated');
            // Log the output for debugging
            console.log('[Transcript] stdout:', execOutput.stdout);
            console.log('[Transcript] stderr:', execOutput.stderr);

            return res.status(404).json({
                error: 'No subtitles available for this video',
                videoId,
                debug: {
                    cookiesLoaded: Boolean(cookieArgs),
                    cookieSource,
                    cookieSummary: cookieDebug,
                    stdout: execOutput.stdout.slice(-1000), // Last 1000 chars
                    stderr: execOutput.stderr.slice(-1000),
                }
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

/**
 * Railway/UIs often flatten tabs/newlines or store escaped \n/\t sequences.
 * Normalize to valid Netscape cookie-file formatting before passing to yt-dlp.
 */
function normalizeCookieEnv(raw: string): string {
    let normalized = raw.trim();

    if (
        (normalized.startsWith('"') && normalized.endsWith('"')) ||
        (normalized.startsWith("'") && normalized.endsWith("'"))
    ) {
        normalized = normalized.slice(1, -1);
    }

    normalized = normalized
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');

    const lines = normalized.split('\n').map(line => {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) {
            return trimmed;
        }

        // Keep already-valid tab-separated cookie lines as-is.
        if (trimmed.includes('\t')) {
            return trimmed;
        }

        const parts = trimmed.split(/\s+/);
        if (parts.length < 7) {
            return trimmed;
        }

        const [domain, includeSubdomains, cookiePath, secure, expires, name, ...valueParts] = parts;
        return [domain, includeSubdomains, cookiePath, secure, expires, name, valueParts.join(' ')].join('\t');
    });

    if (!lines.some(line => line.startsWith('# Netscape HTTP Cookie File'))) {
        lines.unshift('# Netscape HTTP Cookie File');
    }

    return `${lines.join('\n').trim()}\n`;
}

function summarizeCookieEnv(raw: string): {
    present: boolean;
    lines: number;
    cookieLines: number;
    invalidLines: number;
    sha256: string;
} {
    const lines = raw
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n');

    let cookieLines = 0;
    let invalidLines = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        cookieLines += 1;
        const fields = trimmed.includes('\t') ? trimmed.split('\t') : trimmed.split(/\s+/);
        if (fields.length < 7) {
            invalidLines += 1;
        }
    }

    const sha256 = createHash('sha256').update(raw).digest('hex').slice(0, 12);

    return {
        present: true,
        lines: lines.length,
        cookieLines,
        invalidLines,
        sha256,
    };
}

async function getCommandVersion(command: string): Promise<string | null> {
    try {
        const { stdout } = await execAsync(command);
        const firstLine = stdout.split('\n')[0]?.trim();
        return firstLine || null;
    } catch {
        return null;
    }
}

app.listen(PORT, () => {
    console.log(`[Transcript Worker] Running on port ${PORT}`);
    console.log(`[Transcript Worker] yt-dlp path: ${YT_DLP_PATH}`);
    console.log(`[Transcript Worker] Health: http://localhost:${PORT}/health`);
    console.log(`[Transcript Worker] Usage: http://localhost:${PORT}/transcript?v=VIDEO_ID`);
});
