ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_cpf_key";
CREATE UNIQUE INDEX IF NOT EXISTS "User_cpf_unitId_key" ON "User"("cpf", "unitId");
