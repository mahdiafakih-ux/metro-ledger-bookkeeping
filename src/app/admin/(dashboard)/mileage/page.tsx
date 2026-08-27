import { Download, Car, Route } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MileageQuickAdd } from "@/components/admin/mileage-quick-add";
import { MileageTable } from "@/components/admin/mileage-table";

const IRS_RATE_PER_MILE = 0.67;

export default async function MileagePage() {
  const rows = await prisma.mileageLog.findMany({ orderBy: { date: "desc" }, take: 200 });
  const totalMiles = rows.reduce((sum, r) => sum + r.miles, 0);
  const estimatedDeduction = totalMiles * IRS_RATE_PER_MILE;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Mileage Tracker</h1>
          <p className="mt-1 text-sm text-navy-400">Log business trips for mobile notarizations.</p>
        </div>
        <LinkButton href="/api/export/mileage" variant="outline"><Download className="h-4 w-4" /> Export CSV</LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Trips" value={String(rows.length)} icon={Route} />
        <StatCard label="Total Miles" value={totalMiles.toFixed(1)} icon={Car} />
        <StatCard label="Est. Tax Deduction" value={`$${estimatedDeduction.toFixed(2)}`} icon={Car} tone="accent" />
      </div>
      <p className="text-xs text-navy-400">
        Estimated using a ${IRS_RATE_PER_MILE.toFixed(2)}/mile placeholder rate — confirm the current standard mileage rate with your accountant before filing.
      </p>

      <MileageQuickAdd />

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <CardBody><EmptyState title="No trips logged yet" description="Log your first business trip above." /></CardBody>
        ) : (
          <MileageTable rows={rows} />
        )}
      </Card>
    </div>
  );
}
