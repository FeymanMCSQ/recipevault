import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

type Status = 'idle' | 'extracting' | 'saving' | 'success' | 'error';
type PageType = 'loading' | 'youtube' | 'regular' | 'unsupported';

function Popup() {
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState('');
    const [pageType, setPageType] = useState<PageType>('loading');
    const [videoTitle, setVideoTitle] = useState('');

    useEffect(() => {
        detectPageType();
    }, []);

    async function detectPageType() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.url) {
                setPageType('unsupported');
                return;
            }

            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                setPageType('unsupported');
                return;
            }

            if (tab.url.includes('youtube.com/watch')) {
                setPageType('youtube');
                // Try to get video title
                const title = tab.title?.replace(' - YouTube', '').trim() || '';
                setVideoTitle(title);
            } else {
                setPageType('regular');
            }
        } catch {
            setPageType('unsupported');
        }
    }

    async function handleSaveYouTube() {
        setStatus('extracting');
        setMessage('Extracting subtitles...');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id || !tab.url) throw new Error('No active tab');

            // Ask content script to extract YouTube subtitles
            let response;
            try {
                response = await chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_YOUTUBE' });
            } catch (error: unknown) {
                const err = error as Error;
                if (err.message && err.message.includes('Receiving end does not exist')) {
                    throw new Error('Please refresh this YouTube page and try again');
                }
                throw error;
            }

            if (!response?.success) {
                throw new Error(response?.error || 'Failed to extract subtitles');
            }

            setStatus('saving');
            setMessage('Processing with AI...');

            // Send to background for API submission
            const saveResponse = await chrome.runtime.sendMessage({
                action: 'SAVE_RECIPE',
                payload: {
                    title: response.title || 'YouTube Recipe',
                    tags: ['youtube', 'video-recipe'],
                    notes: `Extracted from YouTube video: ${tab.url}`,
                    capturedText: `[YouTube Video Transcript]\n\n${response.transcript}`,
                    sourceUrl: tab.url,
                    sourceTitle: response.title || tab.title || '',
                },
            });

            if (saveResponse?.success) {
                setStatus('success');
                setMessage('Recipe saved! ✓');
            } else if (saveResponse?.queued) {
                setStatus('success');
                setMessage('Saved offline • Will sync later');
            } else {
                throw new Error(saveResponse?.error || 'Save failed');
            }
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Something went wrong');
        }
    }

    async function handleSavePage() {
        setStatus('extracting');
        setMessage('Extracting page content...');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id || !tab.url) throw new Error('No active tab');

            const response = await chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PAGE' });

            if (!response?.success) {
                throw new Error(response?.error || 'Extraction failed');
            }

            setStatus('saving');
            setMessage('Saving recipe...');

            const saveResponse = await chrome.runtime.sendMessage({
                action: 'SAVE_RECIPE',
                payload: {
                    title: response.title || 'Untitled Recipe',
                    tags: [],
                    notes: '',
                    capturedText: response.content,
                    sourceUrl: tab.url,
                    sourceTitle: response.title || tab.title || '',
                },
            });

            if (saveResponse?.success) {
                setStatus('success');
                setMessage('Recipe saved! ✓');
            } else if (saveResponse?.queued) {
                setStatus('success');
                setMessage('Saved offline • Will sync later');
            } else {
                throw new Error(saveResponse?.error || 'Save failed');
            }
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Something went wrong');
        }
    }

    const isLoading = status === 'extracting' || status === 'saving';

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.logo}>
                    <img src="/logo.svg" style={styles.logoIcon} alt="RecipeVault" />
                </div>
                <h1 style={styles.title}>RecipeVault</h1>
            </div>

            {pageType === 'loading' && (
                <p style={styles.description}>Loading...</p>
            )}

            {pageType === 'unsupported' && (
                <p style={styles.description}>
                    This page is not supported. Navigate to a recipe website or YouTube video.
                </p>
            )}

            {pageType === 'youtube' && (
                <>
                    <div style={styles.youtubeIndicator}>
                        <span style={styles.youtubeIcon}>▶</span>
                        <span>YouTube Video Detected</span>
                    </div>
                    {videoTitle && (
                        <p style={styles.videoTitle}>{videoTitle}</p>
                    )}
                    <p style={styles.description}>
                        Extract recipe from video subtitles
                    </p>
                    <button
                        onClick={handleSaveYouTube}
                        disabled={isLoading}
                        style={{
                            ...styles.button,
                            ...styles.youtubeButton,
                            ...(status === 'success' ? styles.buttonSuccess : {}),
                            ...(status === 'error' ? styles.buttonError : {}),
                            ...(isLoading ? styles.buttonLoading : {}),
                        }}
                    >
                        {status === 'idle' && '🎬 Save Video Recipe'}
                        {status === 'extracting' && '⏳ Extracting...'}
                        {status === 'saving' && '🤖 AI Processing...'}
                        {status === 'success' && '✓ Saved!'}
                        {status === 'error' && '✗ Try Again'}
                    </button>
                </>
            )}

            {pageType === 'regular' && (
                <>
                    <p style={styles.description}>
                        Save any recipe from this page with one click
                    </p>
                    <button
                        onClick={handleSavePage}
                        disabled={isLoading}
                        style={{
                            ...styles.button,
                            ...(status === 'success' ? styles.buttonSuccess : {}),
                            ...(status === 'error' ? styles.buttonError : {}),
                            ...(isLoading ? styles.buttonLoading : {}),
                        }}
                    >
                        {status === 'idle' && '🍳 Save This Recipe'}
                        {status === 'extracting' && '⏳ Extracting...'}
                        {status === 'saving' && '⏳ Saving...'}
                        {status === 'success' && '✓ Saved!'}
                        {status === 'error' && '✗ Try Again'}
                    </button>
                </>
            )}

            {message && status !== 'idle' && (
                <p style={{
                    ...styles.message,
                    color: status === 'error' ? '#ef4444' : status === 'success' ? '#10b981' : '#6b7280',
                }}>
                    {message}
                </p>
            )}

            <div style={styles.footer}>
                <p style={styles.hint}>
                    💡 Tip: You can also select text and click the floating button
                </p>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        width: 340,
        padding: 24,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#F9F7F2',
        border: '1px solid #E2DCD2', // Visual border for popup context
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid #E2DCD2',
    },
    logo: {
        width: 32,
        height: 32,
        background: '#6C2E2E',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F9F7F2',
    },
    logoIcon: {
        width: 18,
        height: 18,
    },
    title: {
        margin: 0,
        fontSize: 20,
        fontWeight: 700,
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#2A2A2A',
        letterSpacing: '-0.02em',
    },
    youtubeIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: '#6C2E2E',
        borderRadius: 2,
        marginBottom: 16,
        fontSize: 12,
        fontWeight: 600,
        color: '#F9F7F2',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    youtubeIcon: {
        fontSize: 12,
    },
    videoTitle: {
        margin: '0 0 16px',
        fontSize: 16,
        fontWeight: 700,
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#2A2A2A',
        lineHeight: 1.4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
    },
    description: {
        margin: '0 0 20px',
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 1.5,
        fontStyle: 'italic',
        fontFamily: 'Georgia, serif',
    },
    button: {
        width: '100%',
        padding: '12px 20px',
        fontSize: 13,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#F9F7F2',
        background: '#6C2E2E',
        border: 'none',
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    youtubeButton: {
        background: '#6C2E2E',
    },
    buttonSuccess: {
        background: '#105940', // Deep green for success to match aesthetic
        boxShadow: 'none',
    },
    buttonError: {
        background: '#9A3A3A',
        boxShadow: 'none',
    },
    buttonLoading: {
        opacity: 0.8,
        cursor: 'wait',
        background: '#5A2525',
    },
    message: {
        margin: '16px 0 0',
        fontSize: 13,
        textAlign: 'center' as const,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
    },
    footer: {
        marginTop: 24,
        paddingTop: 16,
        borderTop: '1px solid #E2DCD2',
    },
    hint: {
        margin: 0,
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'center' as const,
        fontStyle: 'italic',
    },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
);
