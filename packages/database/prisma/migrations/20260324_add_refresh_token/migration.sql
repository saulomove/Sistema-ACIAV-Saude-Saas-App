ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "refreshToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Session_refreshToken_key" ON "Session"("refreshToken");
