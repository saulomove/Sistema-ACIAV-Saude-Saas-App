-- AlterTable: Add new fields to Provider
ALTER TABLE "Provider" ADD COLUMN "professionalName" TEXT;
ALTER TABLE "Provider" ADD COLUMN "clinicName" TEXT;
ALTER TABLE "Provider" ADD COLUMN "registration" TEXT;
ALTER TABLE "Provider" ADD COLUMN "cpfCnpj" TEXT;
ALTER TABLE "Provider" ADD COLUMN "specialty" TEXT;
ALTER TABLE "Provider" ADD COLUMN "phone" TEXT;
ALTER TABLE "Provider" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "Provider" ADD COLUMN "email" TEXT;
ALTER TABLE "Provider" ADD COLUMN "discountType" TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE "Provider" ADD COLUMN "discountValue" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "Provider" ADD COLUMN "photoUrl" TEXT;

-- AlterTable: Add insurancePrice to Service
ALTER TABLE "Service" ADD COLUMN "insurancePrice" DECIMAL(65,30) NOT NULL DEFAULT 0;
