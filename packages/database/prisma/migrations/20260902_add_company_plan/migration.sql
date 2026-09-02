-- AddColumn: plano/tabela de preço da empresa no financeiro + valor por usuário
ALTER TABLE "Company" ADD COLUMN "planName" TEXT;
ALTER TABLE "Company" ADD COLUMN "planValue" DECIMAL(10,2);
