import { Download, DollarSign, TrendingDown, TrendingUp, Percent } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ExpenseQuickAdd } from "@/components/admin/expense-quick-add";
import { ExpenseTable } from "@/components/admin/expense-table";
import { DonutChart } from "@/components/admin/charts/donut-chart";
import { formatCents } from "@/lib/money";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/constants";
import { getTotalEarnedCents } from "@/lib/queries/dashboard";

export default async function ExpensesPage() {
  const [expenses, totalRevenueCents] = await Promise.all([
    prisma.expense.findMany({ orderBy: { date: "desc" }, take: 200 }),
    getTotalEarnedCents(),
  ]);

  const totalExpensesCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);
  const netProfitCents = totalRevenueCents - totalExpensesCents;
  const profitMargin = totalRevenueCents > 0 ? (netProfitCents / totalRevenueCents) * 100 : 0;

  const byCategory = new Map<string, number>();
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amountCents);
  const chartData = Array.from(byCategory.entries()).map(([category, cents]) => ({ label: EXPENSE_CATEGORY_LABELS[category] ?? category, value: cents / 100 }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Expenses</h1>
          <p className="mt-1 text-sm text-navy-400">Track spending and monitor profitability.</p>
        </div>
        <LinkButton href="/api/export/expenses" variant="outline"><Download className="h-4 w-4" /> Export CSV</LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCents(totalRevenueCents, { showCents: false })} icon={DollarSign} tone="success" />
        <StatCard label="Total Expenses" value={formatCents(totalExpensesCents, { showCents: false })} icon={TrendingDown} tone="danger" />
        <StatCard label="Net Profit" value={formatCents(netProfitCents, { showCents: false })} icon={TrendingUp} tone={netProfitCents >= 0 ? "accent" : "danger"} />
        <StatCard label="Profit Margin" value={`${profitMargin.toFixed(1)}%`} icon={Percent} />
      </div>

      <ExpenseQuickAdd />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          {expenses.length === 0 ? (
            <CardBody><EmptyState title="No expenses logged yet" description="Log your first business expense above." /></CardBody>
          ) : (
            <ExpenseTable rows={expenses} />
          )}
        </Card>
        <Card>
          <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
          <CardBody><DonutChart data={chartData} format="currency" /></CardBody>
        </Card>
      </div>
    </div>
  );
}
