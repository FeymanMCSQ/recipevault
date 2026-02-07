"use client";

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
        <article className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-emerald-200 transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-gray-900 text-lg leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {recipe.title}
                </h3>
            </div>

            {/* Source */}
            <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors mb-3"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="truncate max-w-[200px]">{hostname}</span>
            </a>

            {/* Tags */}
            {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {recipe.tags.slice(0, 4).map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                    {recipe.tags.length > 4 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                            +{recipe.tags.length - 4}
                        </span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <time className="text-xs text-gray-400">{formattedDate}</time>
                <button className="text-sm font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                </button>
            </div>
        </article>
    );
}
