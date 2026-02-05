import { PrismaClient } from "@prisma/client";
import "dotenv/config";

console.log("[seed.ts] Starting seed script...");
console.log("[seed.ts] DATABASE_URL exists?", !!process.env.DATABASE_URL);

// Prisma 7 requires accelerateUrl or adapter for "client" engine
const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
    accelerateUrl: process.env.DATABASE_URL,
});

async function main() {
    console.log("[seed.ts] Connecting to database...");
    const recipe = await prisma.recipe.create({
        data: {
            title: "Seed Recipe",
            sourceUrl: "https://example.com/seed",
            capturedText: "Seed content",
            tags: ["seed", "test"],
        },
    });
    console.log("[seed.ts] Created recipe:", recipe);
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log("[seed.ts] Disconnected.");
    })
    .catch(async (e) => {
        console.error("[seed.ts] Error:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
