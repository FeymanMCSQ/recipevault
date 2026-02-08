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
        gap: 8px;
        padding: 10px 16px;
        background: #F9F7F2;
        color: #6C2E2E;
        border: 1px solid #E2DCD2;
        border-radius: 4px;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: all 0.2s ease;
        white-space: nowrap;
        z-index: 2147483647;
    }

    .save-button:hover {
        transform: translateY(-2px);
        border-color: #6C2E2E;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .save-button:active { transform: translateY(0); }
    .save-button svg { width: 16px; height: 16px; fill: currentColor; }
    .save-button.visible { display: flex; }

    .modal-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(42, 42, 42, 0.4);
        display: none;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        backdrop-filter: blur(4px);
        z-index: 2147483647;
    }

    .modal-overlay.visible { display: flex; }

    .modal {
        background: #F9F7F2;
        border: 1px solid #E2DCD2;
        border-radius: 2px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        width: 400px;
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        animation: modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
    }

    @keyframes modalSlideIn {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .modal-header {
        background: #F9F7F2;
        border-bottom: 1px solid #E2DCD2;
        color: #2A2A2A;
        padding: 20px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .modal-header svg { width: 22px; height: 22px; fill: #6C2E2E; }
    .modal-header h2 { 
        margin: 0; 
        font-family: Georgia, 'Times New Roman', serif; 
        font-size: 20px; 
        font-weight: 700; 
        letter-spacing: -0.02em;
        color: #2A2A2A;
    }
    
    .modal-body { padding: 24px; overflow-y: auto; }
    
    .form-group { margin-bottom: 20px; }
    .form-group label { 
        display: block; 
        font-size: 11px; 
        font-weight: 700; 
        text-transform: uppercase; 
        letter-spacing: 0.05em; 
        color: #6C2E2E; 
        margin-bottom: 8px; 
        opacity: 0.8;
    }
    .form-group label .required { color: #6C2E2E; }

    .form-group input, .form-group textarea {
        width: 100%;
        padding: 8px 0;
        background: transparent;
        border: none;
        border-bottom: 2px solid #E2DCD2;
        border-radius: 0;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 16px;
        color: #2A2A2A;
        transition: border-color 0.2s;
    }

    .form-group input::placeholder, .form-group textarea::placeholder {
        color: #9CA3AF;
        font-family: -apple-system, sans-serif;
        font-style: italic;
    }

    .form-group input:focus, .form-group textarea:focus {
        outline: none;
        border-color: #6C2E2E;
    }

    .form-group textarea { resize: vertical; min-height: 80px; line-height: 1.5; }
    .form-group .helper { font-size: 11px; color: #6B7280; margin-top: 6px; font-style: italic; }

    .selection-preview {
        background: #fff;
        border: 1px solid #E2DCD2;
        border-radius: 2px;
        padding: 16px;
        margin-bottom: 24px;
        max-height: 100px;
        overflow: hidden;
        position: relative;
    }

    .selection-preview::after {
        content: '';
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 40px;
        background: linear-gradient(transparent, #fff);
    }

    .selection-preview p { 
        margin: 0; 
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 14px; 
        color: #4B5563; 
        line-height: 1.6; 
        font-style: italic;
    }
    
    .selection-preview .label { 
        font-size: 10px; 
        font-weight: 700; 
        color: #9CA3AF; 
        text-transform: uppercase; 
        letter-spacing: 0.05em; 
        margin-bottom: 8px; 
    }

    .modal-footer {
        padding: 20px 24px;
        background: #F9F7F2;
        border-top: 1px solid #E2DCD2;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    }

    .btn { 
        padding: 10px 20px; 
        border-radius: 2px; 
        font-size: 13px; 
        font-weight: 600; 
        text-transform: uppercase; 
        letter-spacing: 0.05em; 
        cursor: pointer; 
        transition: all 0.2s; 
    }
    
    .btn-cancel { 
        background: transparent; 
        border: 1px solid transparent; 
        color: #6B7280; 
    }
    
    .btn-cancel:hover { 
        color: #2A2A2A; 
        text-decoration: underline; 
    }
    
    .btn-save { 
        background: #6C2E2E; 
        border: 1px solid #6C2E2E; 
        color: #F9F7F2; 
    }
    
    .btn-save:hover:not(:disabled) { 
        background: #5A2525; 
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
    }
    
    .btn-save:disabled { 
        background: #E2DCD2; 
        border-color: #E2DCD2; 
        color: #9CA3AF; 
        cursor: not-allowed; 
    }
    
    .toast-container {
        position: fixed;
        bottom: 24px; right: 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: auto;
        z-index: 2147483647;
    }

    .toast {
        padding: 16px 20px;
        background: #2A2A2A;
        color: #F9F7F2;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid #4B5563;
    }

    @keyframes toastSlideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .toast-success { border-left: 4px solid #10B981; }
    .toast-error { border-left: 4px solid #EF4444; }
    .toast-warning { border-left: 4px solid #F59E0B; }
    
    .toast svg { width: 18px; height: 18px; fill: currentColor; flex-shrink: 0; }
    .toast a { color: #F9F7F2; text-decoration: underline; text-underline-offset: 2px; }
`;
