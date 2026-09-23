// Read-only check: confirms the BusinessSettings "default" row exists.
import "./load-env";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

prisma.businessSettings
  .findUnique({ where: { id: "default" }, select: { id: true, businessName: true } })
  .then(async (row) => {
    const plans = await prisma.pricingPlan.count({ where: { isActive: true } });
    if (row) console.log(`BusinessSettings "default" exists (${row.businessName}); active pricing plans: ${plans}`);
    else {
      console.error('BusinessSettings "default" row is MISSING — run `npm run db:seed`.');
      process.exitCode = 1;
    }
  })
  .finally(() => prisma.$disconnect());
