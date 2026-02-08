"use client";

import { useState, useMemo } from "react";
import type { RecipeSummary } from "@recipevault/shared";
import { RecipeCard } from "./RecipeCard";

interface RecipeListProps {
    initialRecipes: RecipeSummary[];
}

export function RecipeList({ initialRecipes }: RecipeListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Extract all unique tags
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        initialRecipes.forEach((recipe) => {
            recipe.tags.forEach((tag) => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
    }, [initialRecipes]);

    // Filter recipes
    const filteredRecipes = useMemo(() => {
        let result = initialRecipes;

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (recipe) =>
                    recipe.title.toLowerCase().includes(query) ||
                    recipe.sourceTitle.toLowerCase().includes(query) ||
                    recipe.tags.some((tag) => tag.includes(query))
            );
        }

        // Filter by selected tag
        if (selectedTag) {
            result = result.filter((recipe) => recipe.tags.includes(selectedTag));
        }

        return result;
    }, [initialRecipes, searchQuery, selectedTag]);

    const hasFilters = searchQuery.trim() || selectedTag;

    return (
        <div>
            {/* Filters Section - Minimal */}
            <div className="mb-12 space-y-6">
                {/* Search Input - Underline style */}
                <div className="relative max-w-xl">
                    <input
                        type="text"
                        placeholder="SEARCH ARCHIVE..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-0 pr-4 py-3 bg-transparent border-b-2 border-parchment text-xl font-serif text-charcoal placeholder-charcoal-muted/50 focus:outline-none focus:border-wine transition-colors"
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-charcoal-muted">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Tag Filters - Minimal text buttons */}
                {allTags.length > 0 && (
                    <div className="flex flex-wrap items-baseline gap-4">
                        <span className="font-sans text-[10px] font-bold tracking-widest text-charcoal-muted uppercase mr-2">
                            FILTER BY:
                        </span>
                        {allTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                className={`text-sm font-sans transition-all ${selectedTag === tag
                                    ? "text-wine font-bold underline underline-offset-4"
                                    : "text-charcoal-muted hover:text-charcoal hover:underline"
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                        {selectedTag && (
                            <button
                                onClick={() => setSelectedTag(null)}
                                className="ml-4 text-[10px] font-bold tracking-widest text-charcoal-muted uppercase hover:text-wine border border-parchment px-2 py-1"
                            >
                                CLEAR
                            </button>
                        )}
                    </div>
                )}

                {/* Active Filter Stats */}
                {hasFilters && (
                    <div className="text-sm font-serif italic text-charcoal-muted">
                        Displaying {filteredRecipes.length} result{filteredRecipes.length !== 1 && 's'}
                    </div>
                )}
            </div>

            {/* Results */}
            {filteredRecipes.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-parchment rounded-sm bg-parchment/10">
                    {hasFilters ? (
                        <>
                            <h3 className="font-serif text-2xl text-charcoal mb-2">No records found</h3>
                            <p className="font-sans text-xs tracking-widest text-charcoal-muted uppercase">Try adjusting your search criteria</p>
                        </>
                    ) : (
                        <>
                            <h3 className="font-serif text-2xl text-charcoal mb-4">The Archive is Empty</h3>
                            <p className="font-serif text-charcoal-muted max-w-sm mx-auto leading-relaxed">
                                Begin your collection by saving recipes from your favorite culinary websites using the browser extension.
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredRecipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                </div>
            )}
        </div>
    );

}
