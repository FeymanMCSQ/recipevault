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
            {/* Back Navigation */}
            <button
                onClick={() => router.push("/recipes")}
                className="group flex items-center gap-2 text-charcoal-muted hover:text-charcoal mb-8 font-sans text-sm tracking-wide transition-colors"
            >
                <span className="text-lg transition-transform group-hover:-translate-x-1">←</span>
                BACK TO INDEX
            </button>

            {/* Main Card - Paper aesthetic */}
            <article className="bg-ivory relative pt-8 pb-16 px-12 shadow-card transition-shadow hover:shadow-card-hover border-t-4 border-wine">
                {/* Paper texture overlay (optional, simulating with opacity) */}
                <div className="absolute inset-0 bg-[#fffdf5] opacity-50 pointer-events-none mix-blend-multiply"></div>

                <div className="relative z-10">
                    {/* Header Section */}
                    <div className="text-center mb-10">
                        <div className="mb-6 flex justify-center gap-4 font-sans text-xs tracking-widest text-charcoal-muted uppercase">
                            <span className="flex items-center gap-1">
                                <span>FROM THE KITCHEN OF</span>
                                <a
                                    href={recipe.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold border-b border-charcoal-muted hover:text-wine hover:border-wine transition-colors"
                                >
                                    {hostname.toUpperCase()}
                                </a>
                            </span>
                            <span>—</span>
                            <time>{formattedDate.toLocaleUpperCase()}</time>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal mb-6 leading-tight">
                            {recipe.title}
                        </h1>

                        <div className="w-16 h-px bg-wine mx-auto mb-6 opacity-30"></div>

                        {/* Tags */}
                        {recipe.tags.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-sm font-sans text-charcoal-muted">
                                {recipe.tags.map((tag, i) => (
                                    <span key={tag}>
                                        {tag.toLowerCase()}
                                        {i < recipe.tags.length - 1 && <span className="mx-1.5 opacity-40">·</span>}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions (Edit/Delete) - Minimal */}
                    <div className="absolute top-0 right-0 p-4 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="flex gap-2 font-sans text-xs">
                            <button
                                onClick={() => {
                                    setEditTitle(recipe.title);
                                    setEditTags(recipe.tags.join(", "));
                                    setEditNotes(recipe.notes);
                                    setIsEditing(true);
                                }}
                                className="px-2 py-1 hover:text-wine underline underline-offset-2"
                            >
                                EDIT
                            </button>
                            <button
                                onClick={() => setIsDeleting(true)}
                                className="px-2 py-1 hover:text-red-700 underline underline-offset-2"
                            >
                                DELETE
                            </button>
                        </div>
                    </div>

                    {/* Grid Layout for Content */}
                    <div className="grid md:grid-cols-[1fr,60px,1.5fr] gap-8 mt-12">

                        {/* Left Column: Ingredients */}
                        <div className="md:col-span-1">
                            {hasIngredients && (
                                <div>
                                    <h2 className="font-sans text-xs font-bold tracking-widest text-charcoal uppercase mb-6 border-b border-parchment pb-2">
                                        Ingredients
                                    </h2>
                                    <div className="space-y-6">
                                        {(recipe.ingredients as { component: string; items: string[] }[]).map((group, groupIdx) => (
                                            <div key={groupIdx}>
                                                {recipe.ingredients.length > 1 && (
                                                    <h3 className="font-serif italic text-charcoal-muted mb-2 text-lg">
                                                        {group.component}
                                                    </h3>
                                                )}
                                                <ul className="space-y-3 font-serif text-charcoal leading-relaxed">
                                                    {group.items.map((ingredient: string, idx: number) => (
                                                        <li key={idx} className="flex items-baseline gap-2 group">
                                                            <span className="w-1 h-1 rounded-full bg-parchment border border-charcoal-muted mt-2.5 flex-shrink-0 group-hover:bg-wine group-hover:border-wine transition-colors"></span>
                                                            <span>{ingredient}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes in left column if space permits, or separate */}
                            {recipe.notes && (
                                <div className="mt-12 bg-parchment/30 p-6 italic font-serif text-charcoal-muted text-sm leading-relaxed border-l-2 border-parchment">
                                    <h3 className="font-sans text-xs font-bold uppercase not-italic mb-2 opacity-70">Cook's Notes</h3>
                                    <p className="whitespace-pre-wrap">{recipe.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Divider Line */}
                        <div className="hidden md:flex justify-center">
                            <div className="w-px h-full bg-parchment"></div>
                        </div>

                        {/* Right Column: Instructions */}
                        <div className="md:col-span-1">
                            {hasInstructions && (
                                <div>
                                    <h2 className="font-sans text-xs font-bold tracking-widest text-charcoal uppercase mb-6 border-b border-parchment pb-2">
                                        Preparation
                                    </h2>
                                    <ol className="space-y-8">
                                        {recipe.instructions.map((step, idx) => (
                                            <li key={idx} className="relative pl-8">
                                                <span className="absolute left-0 top-0 font-sans text-xs font-bold text-wine opacity-60">
                                                    {String(idx + 1).padStart(2, '0')}
                                                </span>
                                                <p className="font-serif text-charcoal text-lg leading-relaxed">
                                                    {step}
                                                </p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}

                            {/* AI Suggestions (as subtle footnotes) */}
                            {hasSuggestions && (
                                <div className="mt-16 pt-8 border-t border-dotted border-charcoal-muted/30">
                                    <h3 className="font-serif italic text-wine mb-4 text-center">Variations & Ideas</h3>
                                    <ul className="space-y-2 text-sm font-serif text-charcoal-muted text-center leading-relaxed max-w-sm mx-auto">
                                        {recipe.suggestions.map((suggestion, idx) => (
                                            <li key={idx}>“{suggestion}”</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer / Copyright fake */}
                <div className="mt-16 pt-8 border-t border-parchment flex justify-between items-center text-[10px] font-sans tracking-widest text-charcoal-muted opacity-50 uppercase">
                    <span>RecipeVault Archive</span>
                    <span>No. {recipe.id.slice(0, 8)}</span>
                </div>
            </article>

            {/* Original Text Toggle */}
            <div className="mt-8 text-center">
                <details className="inline-block text-left group">
                    <summary className="font-sans text-xs tracking-widest text-charcoal-muted hover:text-wine cursor-pointer uppercase select-none list-none">
                        View Source Text <span className="ml-1 opacity-50 group-open:rotate-180 transition-transform inline-block">↓</span>
                    </summary>
                    <div className="mt-4 p-6 bg-white border border-parchment font-mono text-xs text-charcoal-muted whitespace-pre-wrap max-w-2xl mx-auto shadow-inner text-left">
                        {recipe.capturedText}
                    </div>
                </details>
            </div>

            {/* Edit Modal - Styling Updates */}
            {isEditing && (
                <div className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="bg-ivory w-full max-w-lg shadow-2xl border border-parchment">
                        <div className="p-6 border-b border-parchment bg-white/50">
                            <h2 className="font-serif text-xl text-charcoal">Edit Record</h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block font-sans text-xs font-bold tracking-widest text-charcoal-muted mb-2 uppercase">Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    className="w-full bg-transparent border-b border-charcoal-muted focus:border-wine px-0 py-2 font-serif text-lg focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block font-sans text-xs font-bold tracking-widest text-charcoal-muted mb-2 uppercase">Tags</label>
                                <input
                                    type="text"
                                    value={editTags}
                                    onChange={e => setEditTags(e.target.value)}
                                    className="w-full bg-transparent border-b border-charcoal-muted focus:border-wine px-0 py-2 font-sans focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block font-sans text-xs font-bold tracking-widest text-charcoal-muted mb-2 uppercase">Notes</label>
                                <textarea
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    rows={4}
                                    className="w-full bg-parchment/30 border border-transparent focus:border-parchment p-3 font-serif focus:outline-none resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-white/50 border-t border-parchment flex justify-end gap-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 font-sans text-xs font-bold tracking-widest text-charcoal-muted hover:text-charcoal uppercase"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !editTitle.trim()}
                                className="px-6 py-2 bg-charcoal text-ivory font-sans text-xs font-bold tracking-widest uppercase hover:bg-wine transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleting && (
                <div className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="bg-ivory w-full max-w-sm shadow-2xl border border-parchment p-8 text-center">
                        <h2 className="font-serif text-xl text-wine mb-4">Confirm Deletion</h2>
                        <p className="font-serif text-charcoal-muted mb-8">
                            Are you sure you want to remove "<span className="italic">{recipe.title}</span>" from the archive? This cannot be undone.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setIsDeleting(false)}
                                className="px-4 py-2 font-sans text-xs font-bold tracking-widest text-charcoal-muted hover:text-charcoal uppercase border border-parchment"
                            >
                                Keep
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-wine text-ivory font-sans text-xs font-bold tracking-widest uppercase hover:bg-red-800 transition-colors"
                            >
                                Delete Forever
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
