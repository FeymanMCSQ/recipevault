import { z } from "zod";

export const TagSchema = z.string().trim().toLowerCase().min(1).max(32);

export const RecipeSchema = z.object({
    id: z.string(),
    title: z.string().trim().min(1).max(120),
    tags: z.array(TagSchema).max(20).default([]),
    notes: z.string().max(2000).optional().default(""),
    sourceUrl: z.string().url(),
    sourceTitle: z.string().max(200).optional().default(""),
    capturedText: z.string().min(1).max(50000),
    // AI-processed fields
    ingredients: z.array(z.string()).default([]),
    instructions: z.array(z.string()).default([]),
    suggestions: z.array(z.string()).default([]),
    aiTags: z.array(TagSchema).default([]),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type Tag = z.infer<typeof TagSchema>;

// Input schemas for API
export const CreateRecipeInputSchema = z.object({
    title: z.string().trim().min(1).max(120),
    tags: z.array(TagSchema).max(20).default([]),
    notes: z.string().max(2000).optional().default(""),
    sourceUrl: z.string().url(),
    sourceTitle: z.string().max(200).optional().default(""),
    capturedText: z.string().min(1).max(50000),
});

export type CreateRecipeInput = z.infer<typeof CreateRecipeInputSchema>;

// Query schema for GET /recipes
export const ListRecipesQuerySchema = z.object({
    query: z.string().max(200).optional(),
    tags: z.string().optional(), // comma-separated, e.g. "soup,spicy"
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    cursor: z.string().optional(),
});

export type ListRecipesQuery = z.infer<typeof ListRecipesQuerySchema>;

// Summary schema for list view (lighter payload)
export const RecipeSummarySchema = RecipeSchema.pick({
    id: true,
    title: true,
    tags: true,
    sourceUrl: true,
    sourceTitle: true,
    createdAt: true,
    updatedAt: true,
});

export type RecipeSummary = z.infer<typeof RecipeSummarySchema>;

// Response schema for GET /recipes
export const ListRecipesResponseSchema = z.object({
    items: z.array(RecipeSummarySchema),
    nextCursor: z.string().optional(),
});

export type ListRecipesResponse = z.infer<typeof ListRecipesResponseSchema>;

// Update schema for PATCH /recipes/:id
export const UpdateRecipeInputSchema = z
    .object({
        title: z.string().trim().min(1).max(120).optional(),
        tags: z.array(TagSchema).max(20).optional(),
        notes: z.string().max(2000).optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, {
        message: "At least one field must be provided",
    });

export type UpdateRecipeInput = z.infer<typeof UpdateRecipeInputSchema>;

// Response schema for DELETE /recipes/:id
export const DeleteRecipeResponseSchema = z.object({
    ok: z.literal(true),
});

export type DeleteRecipeResponse = z.infer<typeof DeleteRecipeResponseSchema>;

// AI processing result schema
export const AIProcessedRecipeSchema = z.object({
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()),
    suggestions: z.array(z.string()),
    tags: z.array(TagSchema),
});

export type AIProcessedRecipe = z.infer<typeof AIProcessedRecipeSchema>;
