import { tokenCache } from './cache';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    // 1. Get the session token from cache/Clerk (not directly available here, 
    // but we can use the getToken we defined in the cache utility or pass it from a hook)
    // Actually, in Expo, the best way is to use the useAuth() hook's getToken().
    // This helper will be used inside our components.

    const url = `${BASE_URL}${endpoint}`;

    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
}

export interface RecipeSummary {
    id: string;
    title: string;
    tags: string[];
    sourceUrl: string;
    sourceTitle: string;
    createdAt: string;
}

export interface ListRecipesResponse {
    items: RecipeSummary[];
    nextCursor?: string;
}
