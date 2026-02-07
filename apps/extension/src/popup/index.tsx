import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

type Status = 'idle' | 'extracting' | 'saving' | 'success' | 'error';

function Popup() {
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState('');

    async function handleSavePage() {
        setStatus('extracting');
        setMessage('Extracting page content...');

        try {
            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id || !tab.url) {
                throw new Error('No active tab');
            }

            // Skip chrome:// and extension pages
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot extract from this page');
            }

            // Ask content script to extract page content
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PAGE' });

            if (!response?.success) {
                throw new Error(response?.error || 'Extraction failed');
            }

            setStatus('saving');
            setMessage('Saving recipe...');

            // Send to background for API submission
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

            <p style={styles.description}>
                Save any recipe from this page with one click
            </p>

            <button
                onClick={handleSavePage}
                disabled={status === 'extracting' || status === 'saving'}
                style={{
                    ...styles.button,
                    ...(status === 'success' ? styles.buttonSuccess : {}),
                    ...(status === 'error' ? styles.buttonError : {}),
                    ...((status === 'extracting' || status === 'saving') ? styles.buttonLoading : {}),
                }}
            >
                {status === 'idle' && '🍳 Save This Recipe'}
                {status === 'extracting' && '⏳ Extracting...'}
                {status === 'saving' && '⏳ Saving...'}
                {status === 'success' && '✓ Saved!'}
                {status === 'error' && '✗ Try Again'}
            </button>

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
        width: 300,
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
    buttonSuccess: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
    },
    buttonError: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
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
