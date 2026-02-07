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
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_YOUTUBE' });

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
                    <svg viewBox="0 0 24 24" style={styles.logoIcon}>
                        <path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                    </svg>
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
        width: 320,
        padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    logo: {
        width: 36,
        height: 36,
        background: 'linear-gradient(135deg, #10b981, #059669)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
    },
    logoIcon: {
        width: 20,
        height: 20,
    },
    title: {
        margin: 0,
        fontSize: 20,
        fontWeight: 700,
        color: '#1f2937',
    },
    youtubeIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: '#fee2e2',
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 13,
        fontWeight: 600,
        color: '#dc2626',
    },
    youtubeIcon: {
        fontSize: 16,
    },
    videoTitle: {
        margin: '0 0 12px',
        fontSize: 14,
        fontWeight: 600,
        color: '#374151',
        lineHeight: 1.4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
    },
    description: {
        margin: '0 0 16px',
        fontSize: 14,
        color: '#6b7280',
    },
    button: {
        width: '100%',
        padding: '14px 20px',
        fontSize: 15,
        fontWeight: 600,
        color: 'white',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    },
    youtubeButton: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
    },
    buttonSuccess: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    },
    buttonError: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
    },
    buttonLoading: {
        opacity: 0.7,
        cursor: 'wait',
    },
    message: {
        margin: '12px 0 0',
        fontSize: 13,
        textAlign: 'center' as const,
    },
    footer: {
        marginTop: 20,
        paddingTop: 16,
        borderTop: '1px solid #d1d5db',
    },
    hint: {
        margin: 0,
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center' as const,
    },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
);
