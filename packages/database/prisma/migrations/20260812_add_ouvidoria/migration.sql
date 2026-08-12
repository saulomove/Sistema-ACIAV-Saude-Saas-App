-- CreateTable
CREATE TABLE "OuvidoriaMensagem" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "userId" TEXT,
    "authUserId" TEXT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "categoria" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OuvidoriaMensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OuvidoriaMensagem_unitId_status_createdAt_idx" ON "OuvidoriaMensagem"("unitId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "OuvidoriaMensagem_userId_idx" ON "OuvidoriaMensagem"("userId");

-- AddForeignKey
ALTER TABLE "OuvidoriaMensagem" ADD CONSTRAINT "OuvidoriaMensagem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
