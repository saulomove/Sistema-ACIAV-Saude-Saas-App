-- CreateTable: histórico de exportações (ex.: financeiro/cobrança)
CREATE TABLE "ExportLog" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorName" TEXT,
    "actorRole" TEXT,
    "filters" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "excludedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExportLog_unitId_createdAt_idx" ON "ExportLog"("unitId", "createdAt");

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: de-para cidade -> código do sistema financeiro (por unidade)
CREATE TABLE "CityCode" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CityCode_unitId_cityName_key" ON "CityCode"("unitId", "cityName");

-- CreateIndex
CREATE INDEX "CityCode_unitId_idx" ON "CityCode"("unitId");

-- AddForeignKey
ALTER TABLE "CityCode" ADD CONSTRAINT "CityCode_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
