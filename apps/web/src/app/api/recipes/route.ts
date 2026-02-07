import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/db/client";
import { CreateRecipeInputSchema, ListRecipesQuerySchema } from "@recipevault/shared";
import { processRecipeWithAI } from "@/lib/ai";

// Error response helper
function errorResponse(
    code: string,
    message: string,
    status: number,
    details?: unknown
) {
    return NextResponse.json(
        { error: { code, message, details } },
        { status }
    );
}

export async function GET(request: NextRequest) {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return errorResponse("AUTH_REQUIRED", "Authentication required", 401);
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const queryParams = {
        query: searchParams.get("query") ?? undefined,
        tags: searchParams.get("tags") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
        cursor: searchParams.get("cursor") ?? undefined,
    };

    const parseResult = ListRecipesQuerySchema.safeParse(queryParams);
    if (!parseResult.success) {
        return errorResponse(
            "VALIDATION_FAILED",
            "Invalid query parameters",
            400,
            parseResult.error.flatten()
        );
    }

    const { query, tags, limit, cursor } = parseResult.data;

    // 3. Build Prisma where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // Search by title or capturedText
    if (query) {
        where.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { capturedText: { contains: query, mode: "insensitive" } },
        ];
    }

    // Filter by tags (AND semantics: must have ALL tags)
    if (tags) {
        const tagList = tags.split(",").map((t: string) => t.trim().toLowerCase());
        where.tags = { hasEvery: tagList };
    }

    // 4. Query database
    try {
        const recipes = await prisma.recipe.findMany({
            where,
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                tags: true,
                sourceUrl: true,
                sourceTitle: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // 5. Build response
        const items = recipes.map((r) => ({
            id: r.id,
            title: r.title,
            tags: r.tags,
            sourceUrl: r.sourceUrl,
            sourceTitle: r.sourceTitle,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        }));

        const nextCursor = recipes.length === limit ? recipes[recipes.length - 1]?.id : undefined;

        return NextResponse.json({ items, nextCursor });
    } catch (error) {
        console.error("[GET /recipes] Database error:", error);
        return errorResponse("INTERNAL_ERROR", "Failed to fetch recipes", 500);
    }
}

export async function POST(request: NextRequest) {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return errorResponse("AUTH_REQUIRED", "Authentication required", 401);
    }

    // 2. Parse and validate input
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return errorResponse("VALIDATION_FAILED", "Invalid JSON body", 400);
    }

    const parseResult = CreateRecipeInputSchema.safeParse(body);
    if (!parseResult.success) {
        return errorResponse(
            "VALIDATION_FAILED",
            "Input validation failed",
            400,
            parseResult.error.flatten()
        );
    }

    const input = parseResult.data;

    // 3. Process with AI (non-blocking - don't fail if AI fails)
    const aiResult = await processRecipeWithAI(input.capturedText);

    // Merge user tags with AI tags (deduplicated)
    const allTags = aiResult
        ? Array.from(new Set([...input.tags, ...aiResult.tags]))
        : input.tags;

    // 4. Create recipe in database
    try {
        const recipe = await prisma.recipe.create({
            data: {
                title: input.title,
                tags: allTags,
                notes: input.notes,
                sourceUrl: input.sourceUrl,
                sourceTitle: input.sourceTitle,
                capturedText: input.capturedText,
                // AI-processed fields (ingredients is Json type)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ingredients: (aiResult?.ingredients ?? []) as any,
                instructions: aiResult?.instructions ?? [],
                suggestions: aiResult?.suggestions ?? [],
                aiTags: aiResult?.tags ?? [],
            },
        });

        // 5. Return created recipe
        return NextResponse.json(
            {
                id: recipe.id,
                title: recipe.title,
                tags: recipe.tags,
                notes: recipe.notes,
                sourceUrl: recipe.sourceUrl,
                sourceTitle: recipe.sourceTitle,
                capturedText: recipe.capturedText,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                suggestions: recipe.suggestions,
                aiTags: recipe.aiTags,
                createdAt: recipe.createdAt.toISOString(),
                updatedAt: recipe.updatedAt.toISOString(),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[POST /recipes] Database error:", error);
        return errorResponse("INTERNAL_ERROR", "Failed to create recipe", 500);
    }
}
