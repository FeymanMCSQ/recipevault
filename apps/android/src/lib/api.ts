import { tokenCache } from './cache';

export const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export async function fetchWithAuth(
    endpoint: string,
    token: string | null,
    options: RequestInit = {}
) {
    const url = `${BASE_URL}${endpoint}`;

    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
}

export interface RecipeIngredientGroup {
    component: string;
    items: string[];
}

export interface Recipe {
    id: string;
    title: string;
    tags: string[];
    notes?: string;
    sourceUrl: string;
    sourceTitle?: string;
    ingredients: RecipeIngredientGroup[];
    instructions: string[];
    createdAt: string;
    updatedAt: string;
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
export interface CreateRecipeInput {
    title: string;
    sourceUrl: string;
    capturedText: string;
    tags?: string[];
    notes?: string;
    sourceTitle?: string;
    transcript?: string;
}

export async function createRecipe(token: string | null, input: CreateRecipeInput) {
    return fetchWithAuth('/api/recipes', token, {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function getRecipe(token: string | null, id: string) {
    return fetchWithAuth(`/api/recipes/${id}`, token);
}
