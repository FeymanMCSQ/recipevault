import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { ListRecipesResponse } from "@recipevault/shared";
import { RecipeList } from "@/components/RecipeList";

async function getRecipes(): Promise<ListRecipesResponse> {
    const cookieStore = cookies();
    const cookieHeader = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const res = await fetch(`${process.env.BASE_URL}/api/recipes`, {
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
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    const data = await getRecipes();

    return (
        <div className="min-h-screen bg-ivory text-charcoal font-serif selection:bg-wine selection:text-white">
            {/* Header - Minimal & Print-like */}
            <header className="bg-ivory border-b border-parchment py-6 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/logo.svg" alt="RecipeVault Logo" className="w-8 h-8" />
                        <h1 className="text-xl font-bold tracking-wide text-charcoal font-serif uppercase">RecipeVault</h1>
                    </div>
                    <div className="flex items-center gap-6 font-sans text-sm text-charcoal-muted tracking-wide">
                        <span>{user.emailAddresses[0]?.emailAddress}</span>
                        <UserButton afterSignOutUrl="/" />
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
