-- AddColumn: valor de plano por beneficiário (sobrepõe o da empresa na cobrança; null herda)
ALTER TABLE "User" ADD COLUMN "planValue" DECIMAL(10,2);
