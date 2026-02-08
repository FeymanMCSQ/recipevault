-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "aiTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ingredients" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "instructions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "suggestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "userId" TEXT NOT NULL DEFAULT 'legacy_user';

-- CreateIndex
CREATE INDEX "recipes_userId_idx" ON "recipes"("userId");
