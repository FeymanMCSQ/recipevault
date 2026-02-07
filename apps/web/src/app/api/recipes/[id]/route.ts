import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/db/client";
import { UpdateRecipeInputSchema } from "@recipevault/shared";

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

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return errorResponse("AUTH_REQUIRED", "Authentication required", 401);
    }

    const { id } = await context.params;

    // 2. Parse and validate input
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return errorResponse("VALIDATION_FAILED", "Invalid JSON body", 400);
    }

    const parseResult = UpdateRecipeInputSchema.safeParse(body);
    if (!parseResult.success) {
        return errorResponse(
            "VALIDATION_FAILED",
            "Input validation failed",
            400,
            parseResult.error.flatten()
        );
    }

    const input = parseResult.data;

    // 3. Check if recipe exists
    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
        return errorResponse("NOT_FOUND", "Recipe not found", 404);
    }

    // 4. Update recipe
    try {
        const recipe = await prisma.recipe.update({
            where: { id },
            data: {
                ...(input.title !== undefined && { title: input.title }),
                ...(input.tags !== undefined && { tags: input.tags }),
                ...(input.notes !== undefined && { notes: input.notes }),
            },
        });

        return NextResponse.json({
            id: recipe.id,
            title: recipe.title,
            tags: recipe.tags,
            notes: recipe.notes,
            sourceUrl: recipe.sourceUrl,
            sourceTitle: recipe.sourceTitle,
            capturedText: recipe.capturedText,
            createdAt: recipe.createdAt.toISOString(),
            updatedAt: recipe.updatedAt.toISOString(),
        });
    } catch (error) {
        console.error("[PATCH /recipes/:id] Database error:", error);
        return errorResponse("INTERNAL_ERROR", "Failed to update recipe", 500);
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return errorResponse("AUTH_REQUIRED", "Authentication required", 401);
    }

    const { id } = await context.params;

    // 2. Check if recipe exists
    const existing = await prisma.recipe.findUnique({ where: { id } });
    if (!existing) {
        return errorResponse("NOT_FOUND", "Recipe not found", 404);
    }

    // 3. Delete recipe
    try {
        await prisma.recipe.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[DELETE /recipes/:id] Database error:", error);
        return errorResponse("INTERNAL_ERROR", "Failed to delete recipe", 500);
    }
}

// Bonus: GET single recipe
export async function GET(request: NextRequest, context: RouteContext) {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return errorResponse("AUTH_REQUIRED", "Authentication required", 401);
    }

    const { id } = await context.params;

    // 2. Fetch recipe
    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) {
        return errorResponse("NOT_FOUND", "Recipe not found", 404);
    }

    return NextResponse.json({
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
    });
}
