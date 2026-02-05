/**
 * RecipeVault Content Script Types
 */

export interface SelectionData {
    text: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    sourceUrl: string;
    pageTitle: string;
}

export interface CapturePayload {
    title: string;
    tags: string[];
    notes: string;
    capturedText: string;
    sourceUrl: string;
    sourceTitle: string;
}
