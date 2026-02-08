# Transcript Worker + yt-dlp Deep Dive (Replication Guide)

## 1) Purpose

This document explains exactly how the transcript worker extracts YouTube subtitles in production, why it is more resilient to blocking/throttling than a naive setup, and how another AI agent can replicate the same approach in another repository or deployment target.

This is an engineering reliability guide, not a bypass guarantee. YouTube anti-abuse behavior changes over time, and no setup can guarantee zero bot checks.

---

## 2) Current Implementation Scope

Code locations:

- Worker service: `apps/transcript-worker/src/index.ts`
- Runtime image: `apps/transcript-worker/Dockerfile`

Primary endpoint behavior:

- `GET /health`: basic liveness
- `GET /check`: shows yt-dlp + deno runtime info and cookie summary
- `GET /transcript?v=<11-char-video-id>`: attempts subtitle extraction and returns plain text transcript

---

## 3) End-to-End Flow

1. Request hits `GET /transcript?v=VIDEO_ID`.
2. Worker validates `VIDEO_ID` using regex `^[a-zA-Z0-9_-]{11}$`.
3. Worker builds a temp output prefix in `/tmp`:
   - `sessionId = transcript_<videoId>_<timestamp>`
   - output template is `/tmp/<sessionId>`
4. Worker prepares cookie source in this priority order:
   1. `YOUTUBE_COOKIES` env var content
   2. `COOKIES_FILE` path
   3. `USE_BROWSER_COOKIES=true` -> `--cookies-from-browser chrome` (local/dev only)
5. If `YOUTUBE_COOKIES` is set, worker:
   - normalizes line endings, escaped `\n`/`\t`, quoting artifacts, whitespace formatting
   - writes a temporary cookie file with mode `0600`
6. Worker executes yt-dlp with subtitle-focused flags:
   - impersonation enabled
   - both manual and auto subtitles enabled
   - English language preference list
   - VTT format output
   - no media download
7. Worker scans `/tmp` for generated `.vtt` for this session.
8. If subtitle file exists:
   - parse VTT -> plain text
   - remove metadata/timestamps/tags
   - deduplicate repeated lines
   - return transcript JSON
9. If no subtitle file exists:
   - return `404` with debug payload (stderr/stdout tail + cookie diagnostics)

---

## 4) Exact yt-dlp Command Shape

The worker builds this logical command:

```bash
yt-dlp \
  --impersonate chrome \
  --skip-download \
  --write-auto-sub \
  --write-sub \
  --sub-lang en,en-US,en-GB \
  --sub-format vtt \
  -o "/tmp/transcript_<videoId>_<timestamp>" \
  [--cookies "<temp-cookie-file>" OR --cookies "<COOKIES_FILE>" OR --cookies-from-browser chrome] \
  "https://www.youtube.com/watch?v=<videoId>"
```

Notes:

- `--skip-download` avoids downloading video media, reducing failure surface.
- `--write-sub` + `--write-auto-sub` allows either human captions or auto captions.
- VTT is chosen because it is easy to parse and stable for text extraction.

---

## 5) Why This Setup Is More Resilient

The worker does not "disable throttling." It combines multiple legitimacy signals and compatibility features so requests look closer to a real browser session:

1. Browser impersonation (`--impersonate chrome`)
   - yt-dlp with `curl-cffi` can emulate modern TLS/client behavior more closely than plain HTTP stacks.

2. Authenticated session cookies (`--cookies ...`)
   - Gives YouTube account context when anonymous requests are challenged with "Sign in to confirm you're not a bot."

3. JavaScript challenge solver runtime (Deno)
   - Recent yt-dlp YouTube flows rely on EJS challenge solving; missing/outdated runtime leads to challenge failures.
   - Dockerfile pins Deno `>=2.0.0` (`2.5.2` in this repo).

4. Subtitle-only extraction
   - Skips media format selection path where blocked sessions often fail early with "requested format not available."

5. Cookie normalization before usage
   - Railway/env UIs can flatten tabs/newlines or escape characters; normalization reduces silent cookie parse failures.

---

## 6) Runtime Requirements (Must-Haves)

Container baseline in `apps/transcript-worker/Dockerfile`:

- `node:22-slim`
- `python3`, `pip`, build tools
- `ffmpeg`
- `yt-dlp[default,curl-cffi]`
- Deno `>=2.0.0`

Important environment variables:

- `YT_DLP_PATH` (default `yt-dlp`)
- `DENO_PATH` (set to directory on PATH, currently `/usr/local/bin`)
- `YOUTUBE_COOKIES` (Netscape cookie file content, multiline)
- optional: `COOKIES_FILE`
- optional: `USE_BROWSER_COOKIES=true` (dev only)
- optional: `ALLOWED_ORIGINS` for CORS

---

## 7) Cookie Handling Details

Functionality in `normalizeCookieEnv` and `summarizeCookieEnv`:

- trims outer quotes if env value is wrapped in `'...'` or `"..."`.
- converts CRLF/CR to LF.
- converts escaped `\\n` -> newline and `\\t` -> tab.
- if a cookie line is whitespace-separated, reconstructs tab-separated Netscape row.
- ensures header includes `# Netscape HTTP Cookie File`.
- appends trailing newline for file consistency.

Diagnostics intentionally avoid leaking cookie values:

- line counts
- cookie row count
- invalid row count
- short SHA-256 fingerprint of raw cookie blob (`first 12 hex chars`)

---

## 8) Diagnostics and Observability

### `/check`

Use to validate runtime before transcript tests:

```bash
curl -s "https://<worker-domain>/check"
```

Expected key fields:

- `installed: true`
- `version: "<yt-dlp-version>"`
- `deno: "<deno-version-line>"` or `null`
- `cookies: { lines, cookieLines, invalidLines, sha256 }` if `YOUTUBE_COOKIES` is set

### `/transcript`

```bash
curl -s "https://<worker-domain>/transcript?v=<VIDEO_ID>"
```

On failure, inspect:

- `debug.cookiesLoaded`
- `debug.cookieSource`
- `debug.cookieSummary.invalidLines`
- `debug.stderr`

Interpretation:

- `cookiesLoaded=false`: env not available to process.
- `invalidLines>0`: cookie formatting problem.
- valid cookies + bot-check still present: likely IP reputation / account challenge state.

---

## 9) Failure Modes and Fast Triage

1. Error: "Sign in to confirm you're not a bot"
   - check `/check` -> cookie summary exists, invalid lines = 0
   - rotate/export fresh cookies from actively used account session
   - verify deployment region/IP reputation constraints

2. Error includes challenge/EJS warnings
   - check `/check.deno` is non-null and version `>=2.0.0`
   - confirm Deno binary directory is included in `PATH` for child process

3. "Requested format is not available" while subtitle extraction
   - usually side effect of blocked/challenged extraction path
   - verify cookies + challenge runtime first

4. No `.vtt` generated with little stderr context
   - confirm video actually has captions (manual or auto)
   - test with known-caption video

---

## 10) Security Notes

- Treat `YOUTUBE_COOKIES` as credential material.
- Never log cookie values.
- If cookies are exposed in chat, terminal, logs, or screenshots: rotate/revoke immediately.
- temp cookie files are written with permission `0600` and deleted after request.

---

## 11) Replication Checklist for Another AI Agent

Use this exact checklist in a fresh project:

1. Create a Node service exposing `/health`, `/check`, `/transcript`.
2. Implement video ID validation for 11-char YouTube IDs.
3. Add yt-dlp execution via child process with:
   - `--impersonate chrome`
   - `--skip-download`
   - `--write-auto-sub --write-sub`
   - `--sub-lang en,en-US,en-GB`
   - `--sub-format vtt`
4. Implement cookie source priority:
   - `YOUTUBE_COOKIES` -> temp file
   - `COOKIES_FILE`
   - `USE_BROWSER_COOKIES=true`
5. Add cookie normalization for escaped newlines/tabs and whitespace-separated rows.
6. Build Docker image with:
   - yt-dlp + curl-cffi
   - Deno `>=2.0.0`
   - ffmpeg
7. Ensure Deno directory is on PATH for yt-dlp child process.
8. Parse VTT to plain text (strip headers, timestamps, tags, metadata, duplicate lines).
9. Return debug payload on no-subtitle failure (without secret leakage).
10. Add `/check` output for yt-dlp version, Deno version, cookie summary.
11. Deploy and run verification sequence:
    - `/health`
    - `/check`
    - `/transcript` with known-caption video
12. If bot-check persists with valid cookies/runtime:
    - treat as infrastructure/IP/account state issue, not just code defect.

---

## 12) Minimal Acceptance Criteria

A replicated service is considered equivalent when all are true:

1. `/check` reports yt-dlp installed and Deno available.
2. `/check` reports cookie summary with `invalidLines=0` when cookies are set.
3. `/transcript` returns transcript for at least one known-caption YouTube video.
4. Failure responses include actionable debug info without exposing secrets.
5. Service behavior is deterministic across redeploys with same env and image.
