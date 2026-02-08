"use client";

import Link from "next/link";
import type { RecipeSummary } from "@recipevault/shared";

interface RecipeCardProps {
    recipe: RecipeSummary;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
    const formattedDate = new Date(recipe.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const hostname = new URL(recipe.sourceUrl).hostname.replace("www.", "");

    return (
        <Link href={`/recipes/${recipe.id}`} className="block h-full">
            <article className="group relative bg-ivory h-full border border-parchment p-6 hover:shadow-card-hover hover:border-wine transition-all duration-300 cursor-pointer flex flex-col justify-between">
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 bg-[#fffdf5] opacity-50 pointer-events-none mix-blend-multiply"></div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-sans text-[10px] tracking-widest text-charcoal-muted uppercase opacity-70">
                                NO. {recipe.id.slice(0, 4)}
                            </span>
                            <time className="font-sans text-[10px] tracking-widest text-charcoal-muted uppercase opacity-70">
                                {formattedDate}
                            </time>
                        </div>
                        <h3 className="font-serif font-bold text-xl text-charcoal leading-tight group-hover:text-wine transition-colors line-clamp-2">
                            {recipe.title}
                        </h3>
                    </div>

                    {/* Source */}
                    <div className="mb-6 font-sans text-xs text-charcoal-muted flex items-center gap-1">
                        <span className="opacity-50">FROM:</span>
                        <span className="font-bold border-b border-transparent group-hover:border-wine transition-colors">
                            {hostname.toUpperCase()}
                        </span>
                    </div>

                    {/* Tags - Minimal text list */}
                    {recipe.tags.length > 0 && (
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs font-sans text-charcoal-muted opacity-80">
                            {recipe.tags.slice(0, 3).map((tag, i) => (
                                <span key={tag}>
                                    {tag}
                                    {i < Math.min(recipe.tags.length, 3) - 1 && <span className="ml-2 opacity-30">·</span>}
                                </span>
                            ))}
                            {recipe.tags.length > 3 && (
                                <span className="opacity-50 italic">+{recipe.tags.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer / Hover Action */}
                <div className="relative z-10 pt-4 mt-4 border-t border-parchment/50 flex justify-end">
                    <span className="font-serif italic text-sm text-wine opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        View Record →
                    </span>
                </div>
            </article>
        </Link>
    );
}
