/**
 * RecipeVault Content Script Styles
 */

export const contentStyles = `
    * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .save-button {
        position: fixed;
        display: none;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        white-space: nowrap;
    }

    .save-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.12);
    }

    .save-button:active { transform: translateY(0); }
    .save-button svg { width: 16px; height: 16px; fill: currentColor; }
    .save-button.visible { display: flex; }

    .modal-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        backdrop-filter: blur(2px);
    }

    .modal-overlay.visible { display: flex; }

    .modal {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        width: 380px;
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        animation: modalSlideIn 0.2s ease;
    }

    @keyframes modalSlideIn {
        from { opacity: 0; transform: translateY(-10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .modal-header {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .modal-header svg { width: 20px; height: 20px; fill: currentColor; }
    .modal-header h2 { margin: 0; font-size: 16px; font-weight: 600; }
    .modal-body { padding: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
    .form-group label .required { color: #ef4444; }

    .form-group input, .form-group textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1.5px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        color: #1f2937;
        transition: border-color 0.15s, box-shadow 0.15s;
    }

    .form-group input:focus, .form-group textarea:focus {
        outline: none;
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }

    .form-group textarea { resize: vertical; min-height: 80px; }
    .form-group .helper { font-size: 12px; color: #6b7280; margin-top: 4px; }

    .selection-preview {
        background: #f3f4f6;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 16px;
        max-height: 80px;
        overflow: hidden;
        position: relative;
    }

    .selection-preview::after {
        content: '';
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 30px;
        background: linear-gradient(transparent, #f3f4f6);
    }

    .selection-preview p { margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5; }
    .selection-preview .label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; margin-bottom: 6px; }

    .modal-footer {
        padding: 16px 20px;
        background: #f9fafb;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }

    .btn { padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .btn-cancel { background: white; border: 1.5px solid #d1d5db; color: #374151; }
    .btn-cancel:hover { background: #f3f4f6; }
    .btn-save { background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; }
    .btn-save:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-save.loading { pointer-events: none; }

    .toast-container {
        position: fixed;
        bottom: 20px; right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: auto;
    }

    .toast {
        padding: 14px 18px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: toastSlideIn 0.25s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 320px;
    }

    @keyframes toastSlideIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
    }

    .toast-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    .toast-warning { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
    .toast svg { width: 18px; height: 18px; fill: currentColor; flex-shrink: 0; }
    .toast a { color: white; text-decoration: underline; font-weight: 600; }
`;
