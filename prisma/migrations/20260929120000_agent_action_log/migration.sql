-- Notar-E: audit log for the private AI operator's write actions.
--
-- SAFE / ADDITIVE ONLY: creates one new table and its indexes. No existing
-- table, column or row is touched, so the currently-deployed code keeps
-- working whether this runs before or after the new code is deployed.

CREATE TABLE IF NOT EXISTS "AgentActionLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT '',
    "targetId" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "success" BOOLEAN NOT NULL,
    "error" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentActionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AgentActionLog_createdAt_idx" ON "AgentActionLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AgentActionLog_targetType_targetId_idx" ON "AgentActionLog"("targetType", "targetId");
