-- Mover discountType e discountValue de Provider para Service
-- Cada serviço passa a ter seu próprio tipo e valor de desconto

ALTER TABLE "Service" ADD COLUMN "discountType" TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE "Service" ADD COLUMN "discountValue" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- Remove os campos de desconto do Provider (agora vivem no Service)
ALTER TABLE "Provider" DROP COLUMN "discountType";
ALTER TABLE "Provider" DROP COLUMN "discountValue";
