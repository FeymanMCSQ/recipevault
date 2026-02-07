"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Recipe } from "@recipevault/shared";

interface RecipeDetailProps {
    recipe: Recipe;
}

export function RecipeDetail({ recipe: initialRecipe }: RecipeDetailProps) {
    const router = useRouter();
    const [recipe, setRecipe] = useState(initialRecipe);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Edit form state
    const [editTitle, setEditTitle] = useState(recipe.title);
    const [editTags, setEditTags] = useState(recipe.tags.join(", "));
    const [editNotes, setEditNotes] = useState(recipe.notes);

    const formattedDate = new Date(recipe.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const hostname = new URL(recipe.sourceUrl).hostname.replace("www.", "");

    async function handleSave() {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/recipes/${recipe.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle.trim(),
                    tags: editTags.split(",").map(t => t.trim().toLowerCase()).filter(t => t),
                    notes: editNotes.trim(),
                }),
            });

            if (res.ok) {
                const updated = await res.json();
                setRecipe(updated);
                setIsEditing(false);
            }
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
        if (res.ok) {
            router.push("/recipes");
        }
    }

    const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
    const hasInstructions = recipe.instructions && recipe.instructions.length > 0;
    const hasSuggestions = recipe.suggestions && recipe.suggestions.length > 0;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => router.push("/recipes")}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to recipes
            </button>

            {/* Main Card */}
            <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setEditTitle(recipe.title);
                                    setEditTags(recipe.tags.join(", "));
                                    setEditNotes(recipe.notes);
                                    setIsEditing(true);
                                }}
                                className="px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => setIsDeleting(true)}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                        <a
                            href={recipe.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {hostname}
                        </a>
                        <span>•</span>
                        <time>{formattedDate}</time>
                    </div>

                    {/* Tags */}
                    {recipe.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {recipe.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notes */}
                {recipe.notes && (
                    <div className="p-6 border-b border-gray-100 bg-amber-50/50">
                        <h2 className="text-sm font-semibold text-amber-800 mb-2">📝 Notes</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{recipe.notes}</p>
                    </div>
                )}

                {/* Ingredients Section */}
                {hasIngredients && (
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-xl">🥗</span> Ingredients
                        </h2>
                        <div className="space-y-6">
                            {(recipe.ingredients as { component: string; items: string[] }[]).map((group, groupIdx) => (
                                <div key={groupIdx}>
                                    {recipe.ingredients.length > 1 && (
                                        <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-3">
                                            {group.component}
                                        </h3>
                                    )}
                                    <ul className="space-y-2">
                                        {group.items.map((ingredient: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                                                <span className="text-gray-700">{ingredient}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions Section */}
                {hasInstructions && (
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="text-xl">👨‍🍳</span> Instructions
                        </h2>
                        <ol className="space-y-4">
                            {recipe.instructions.map((step, idx) => (
                                <li key={idx} className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm">
                                        {idx + 1}
                                    </span>
                                    <p className="text-gray-700 pt-1">{step}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* Suggestions Section */}
                {hasSuggestions && (
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-purple-50 to-indigo-50">
                        <h2 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                            <span className="text-xl">✨</span> AI Suggestions
                        </h2>
                        <ul className="space-y-3">
                            {recipe.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                                    <span className="text-purple-500">💡</span>
                                    <span className="text-gray-700">{suggestion}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Original Captured Text (collapsible fallback) */}
                <details className="p-6 group">
                    <summary className="text-sm font-semibold text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Original Captured Text
                    </summary>
                    <div className="mt-4 prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                        {recipe.capturedText}
                    </div>
                </details>
            </article>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Recipe</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                                <input
                                    type="text"
                                    value={editTags}
                                    onChange={e => setEditTags(e.target.value)}
                                    placeholder="soup, dinner, easy"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !editTitle.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {isDeleting && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Recipe?</h2>
                        <p className="text-gray-600 mb-6">This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDeleting(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
