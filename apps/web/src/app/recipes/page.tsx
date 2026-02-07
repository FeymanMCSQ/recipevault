import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import type { ListRecipesResponse } from "@recipevault/shared";
import { RecipeList } from "@/components/RecipeList";

async function getRecipes(): Promise<ListRecipesResponse> {
    const cookieStore = cookies();
    const cookieHeader = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/recipes`, {
        cache: "no-store",
        headers: {
            Cookie: cookieHeader,
        },
    });

    if (!res.ok) {
        return { items: [] };
    }

    return res.json();
}

export default async function RecipesPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/api/auth/signin");
    }

    const data = await getRecipes();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">RecipeVault</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{session.user?.email}</span>
                        <a
                            href="/api/auth/signout"
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Sign out
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        My Recipes
                        {data.items.length > 0 && (
                            <span className="ml-2 text-base font-normal text-gray-500">
                                ({data.items.length})
                            </span>
                        )}
                    </h2>
                </div>

                <RecipeList initialRecipes={data.items} />
            </main>
        </div>
    );
}
