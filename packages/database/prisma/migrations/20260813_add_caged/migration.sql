-- AlterTable
ALTER TABLE "Unit" ADD COLUMN "cityName" TEXT;
ALTER TABLE "Unit" ADD COLUMN "state" TEXT;
ALTER TABLE "Unit" ADD COLUMN "ibgeCode" TEXT;

-- CreateTable
CREATE TABLE "CagedStat" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "refMonth" TEXT NOT NULL,
    "saldo" INTEGER,
    "admissoes" INTEGER,
    "desligamentos" INTEGER,
    "estoque" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CagedStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CagedStat_unitId_refMonth_key" ON "CagedStat"("unitId", "refMonth");

-- AddForeignKey
ALTER TABLE "CagedStat" ADD CONSTRAINT "CagedStat_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
