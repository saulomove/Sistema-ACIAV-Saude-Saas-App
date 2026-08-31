-- AddColumn: endereço do beneficiário (preenchível por CEP)
ALTER TABLE "User" ADD COLUMN "zipCode" TEXT;
ALTER TABLE "User" ADD COLUMN "address" TEXT;
ALTER TABLE "User" ADD COLUMN "addressNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "neighborhood" TEXT;
ALTER TABLE "User" ADD COLUMN "city" TEXT;
ALTER TABLE "User" ADD COLUMN "state" TEXT;
