import { prisma } from "@/lib/db";
import { BusinessForm } from "@/components/admin/business-form";

export default async function NewBusinessPage() {
  const plans = await prisma.pricingPlan.findMany({ where: { billingPeriod: "monthly", isActive: true }, orderBy: { sortOrder: "asc" }, select: { key: true, name: true } });
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">New Business</h1>
        <p className="mt-1 text-sm text-navy-400">Add an organization to your business CRM.</p>
      </div>
      <div className="rounded-2xl border border-navy-100 bg-white p-6 sm:p-8">
        <BusinessForm pricingPlans={plans} />
      </div>
    </div>
  );
}
