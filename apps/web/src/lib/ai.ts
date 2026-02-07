/**
 * AI Service - OpenRouter Integration
 * Processes recipe text and extracts structured data
 */

import { AIProcessedRecipeSchema, type AIProcessedRecipe } from "@recipevault/shared";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are a recipe formatting assistant. Given raw recipe text, extract and format:

1. **ingredients**: Array of component groups. Each group has:
   - "component": Name of the component (e.g., "Main", "Sauce", "Dressing", "Marinade")
   - "items": Array of ingredient strings for that component
   If there are no clear components, use "Main" as the default component name.
   
2. **instructions**: Array of step-by-step instruction strings

3. **suggestions**: 2-3 creative suggestions to elevate the recipe (flavor enhancements, variations, pro tips)

4. **tags**: 3-5 relevant tags for categorization (e.g., "quick", "vegetarian", "italian", "comfort-food")

Return ONLY valid JSON in this exact format:
{
  "ingredients": [
    { "component": "Main", "items": ["2 lbs ground beef", "1/2 onion, grated"] },
    { "component": "Tahini Sauce", "items": ["1/2 cup tahini", "1 lemon, juiced"] }
  ],
  "instructions": ["Step 1...", "Step 2..."],
  "suggestions": ["Try adding...", "For extra flavor..."],
  "tags": ["tag1", "tag2", "tag3"]
}

If the text doesn't contain a clear recipe, do your best to extract relevant information. Always return valid JSON.`;

export async function processRecipeWithAI(capturedText: string): Promise<AIProcessedRecipe | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.warn("[AI] OPENROUTER_API_KEY not set, skipping AI processing");
        return null;
    }

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                "X-Title": "RecipeVault",
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-001",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `Please process this recipe text:\n\n${capturedText}` },
                ],
                temperature: 0.3,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[AI] OpenRouter API error:", response.status, error);
            return null;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error("[AI] No content in response");
            return null;
        }

        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const parsed = JSON.parse(jsonStr.trim());
        const validated = AIProcessedRecipeSchema.parse(parsed);

        console.log("[AI] Successfully processed recipe:", {
            ingredientGroups: validated.ingredients.length,
            instructions: validated.instructions.length,
            suggestions: validated.suggestions.length,
            tags: validated.tags.length,
        });

        return validated;
    } catch (error) {
        console.error("[AI] Processing error:", error);
        return null;
    }
}
