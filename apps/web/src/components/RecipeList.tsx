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
            {/* Filters Section */}
            <div className="mb-6 space-y-4">
                {/* Search Input */}
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search recipes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Tag Filters */}
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {allTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedTag === tag
                                        ? "bg-emerald-500 text-white shadow-md"
                                        : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                {/* Active Filter + Clear */}
                {hasFilters && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">
                            Showing {filteredRecipes.length} of {initialRecipes.length} recipes
                        </span>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedTag(null);
                            }}
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Results */}
            {filteredRecipes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    {hasFilters ? (
                        <>
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters.</p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No recipes yet</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Use the RecipeVault browser extension to save recipes from any website.
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                </div>
            )}
        </div>
    );
}
