-- Create BusinessClient relationship table for explicit authorization
CREATE TABLE "BusinessClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessClient_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE,
    CONSTRAINT "BusinessClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE
);

-- Unique constraint: one relationship per business-client pair
CREATE UNIQUE INDEX "BusinessClient_businessId_clientId_key" ON "BusinessClient"("businessId", "clientId");

-- Indexes for efficient querying
CREATE INDEX "BusinessClient_clientId_idx" ON "BusinessClient"("clientId");
CREATE INDEX "BusinessClient_businessId_idx" ON "BusinessClient"("businessId");
