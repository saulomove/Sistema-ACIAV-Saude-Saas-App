-- AlterTable: Provider.businessHours (horário de atendimento editável pelo próprio credenciado)
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "businessHours" TEXT;
