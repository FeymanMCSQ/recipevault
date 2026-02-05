import { describe, it, expect } from "vitest";
import { CreateRecipeInputSchema, RecipeSchema } from "../src/schemas/recipe";

describe("RecipeSchema", () => {
    it("validates a correct recipe input", () => {
        const validInput = {
            title: "Delicious Soup",
            tags: ["soup", "dinner"],
            notes: "Add more salt",
            sourceUrl: "https://example.com/recipe",
            sourceTitle: "Example Recipe",
            capturedText: "Ingredients: ...",
        };
        const result = CreateRecipeInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it("normalizes tags (lowercase)", () => {
        const input = {
            title: "Title",
            tags: ["Soup", "  Dinner  "],
            sourceUrl: "https://example.com",
            capturedText: "content",
        };
        const result = CreateRecipeInputSchema.parse(input);
        expect(result.tags).toEqual(["soup", "dinner"]);
    });

    it("rejects empty title", () => {
        const input = {
            title: "",
            sourceUrl: "https://example.com",
            capturedText: "content",
        };
        const result = CreateRecipeInputSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it("rejects invalid URL", () => {
        const input = {
            title: "Title",
            sourceUrl: "not-a-url",
            capturedText: "content",
        };
        const result = CreateRecipeInputSchema.safeParse(input);
        expect(result.success).toBe(false);
    });

    it("rejects too long captured text", () => {
        const input = {
            title: "Title",
            sourceUrl: "https://example.com",
            capturedText: "a".repeat(50001),
        };
        const result = CreateRecipeInputSchema.safeParse(input);
        expect(result.success).toBe(false);
    });
});
