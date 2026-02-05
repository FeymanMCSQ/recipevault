import { defineConfig } from "@prisma/config";
import "dotenv/config";

const dbUrl = process.env.DATABASE_URL;
console.log("[prisma.config.ts] Loaded.");
console.log("[prisma.config.ts] DATABASE_URL exists?", !!dbUrl);
if (dbUrl) {
    console.log("[prisma.config.ts] DATABASE_URL length:", dbUrl.length);
    console.log("[prisma.config.ts] DATABASE_URL starts with:", dbUrl.substring(0, 10) + "...");
} else {
    console.error("[prisma.config.ts] DATABASE_URL is MISSING!");
}

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url: dbUrl as string,
    },
});
