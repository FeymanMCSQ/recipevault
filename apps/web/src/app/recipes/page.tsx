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
        <div className="min-h-screen bg-ivory text-charcoal font-serif selection:bg-wine selection:text-white">
            {/* Header - Minimal & Print-like */}
            <header className="bg-ivory border-b border-parchment py-6 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-wine text-ivory flex items-center justify-center font-serif font-bold text-lg rounded-sm">
                            V
                        </div>
                        <h1 className="text-xl font-bold tracking-wide text-charcoal font-serif uppercase">RecipeVault</h1>
                    </div>
                    <div className="flex items-center gap-6 font-sans text-sm text-charcoal-muted tracking-wide">
                        <span>{session?.user?.email}</span>
                        <a href="/api/auth/signout" className="hover:text-wine transition-colors underline decoration-transparent hover:decoration-wine underline-offset-4">
                            Sign out
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-baseline justify-between mb-12 border-b border-parchment pb-4">
                    <h2 className="text-4xl font-serif font-bold text-charcoal">
                        Archive Index
                    </h2>
                    {data.items.length > 0 && (
                        <span className="font-sans text-xs tracking-widest text-charcoal-muted uppercase">
                            {data.items.length} RECORDS FOUND
                        </span>
                    )}
                </div>

                <RecipeList initialRecipes={data.items} />
            </main>
        </div>
    );
}
