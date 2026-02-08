# Deploying RecipeVault to Vercel

Since this is a monorepo, you need to configure Vercel specifically to target the `apps/web` directory while still allowing it to see the `packages/shared` workspace.

## 1. Import Project
- Go to Vercel Dashboard -> **Add New...** -> **Project**.
- Import your `recipevault` repository.

## 2. Project Configuration (Critical)
Configure these settings **before** clicking Deploy:

| Setting | Value |
| :--- | :--- |
| **Framework Preset** | `Next.js` |
| **Root Directory** | `apps/web` |
| **Build Command** | `cd ../.. && pnpm --filter web build` (or leave default if specific override is not needed, but Vercel usually handles pnpm workspaces well if Root Directory is set. If default fails, use `npx prisma generate && next build`) |
| **Install Command** | `cd ../.. && pnpm install` (Standard for pnpm monorepos) |

**Simpler Vercel Default:**
Often, just setting **Root Directory** to `apps/web` is enough. Vercel detects Next.js and runs the `build` script inside `apps/web/package.json`.
*We updated your package.json to run `prisma generate && next build` automatically.*

## 3. Environment Variables
You must copy these from your local `.env` to Vercel:

```env
# Database
DATABASE_URL="...your_prisma_accelerate_url..."
# Note: Ensure you are using the Transaction Pooling URL if possible, or Session Pooling for Serverless.

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs (For Redirects)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/recipes
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/recipes

# App URL (Use your production Vercel URL once deployed)
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

## 4. Deploy
- Click **Deploy**.
- **Troubleshooting**: If Prisma complains about missing client, ensure `prisma generate` is running (we added it to the `build` script).
