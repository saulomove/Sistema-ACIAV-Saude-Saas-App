-- AlterTable: Company inactivation fields
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "inactivatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "inactivationReason" TEXT;

-- AlterTable: User photo/settings
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "settings" TEXT;

-- CreateTable: Category
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Category_unitId_order_idx" ON "Category"("unitId", "order");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Category_unitId_slug_key" ON "Category"("unitId", "slug");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Category_unitId_fkey'
    ) THEN
        ALTER TABLE "Category" ADD CONSTRAINT "Category_unitId_fkey"
            FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
