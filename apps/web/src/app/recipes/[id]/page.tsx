import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Recipe } from "@recipevault/shared";
import { RecipeDetail } from "@/components/RecipeDetail";

async function getRecipe(id: string): Promise<Recipe | null> {
    const cookieStore = cookies();
    const cookieHeader = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/recipes/${id}`,
        {
            cache: "no-store",
            headers: { Cookie: cookieHeader },
        }
    );

    if (!res.ok) return null;
    return res.json();
}

export default async function RecipeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const { id } = await params;
    const recipe = await getRecipe(id);

    if (!recipe) notFound();

    return (
        <div className="min-h-screen bg-ivory text-charcoal font-serif selection:bg-wine selection:text-white">
            {/* Header - Minimal & Print-like */}
            <header className="bg-ivory border-b border-parchment py-6">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
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
            <main className="max-w-4xl mx-auto px-6 py-12">
                <RecipeDetail recipe={recipe} />
            </main>
        </div>
    );
}
