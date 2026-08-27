import { prisma } from "@/lib/db";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OutreachQuickAdd } from "@/components/admin/outreach-quick-add";
import { OutreachTable } from "@/components/admin/outreach-table";
import { Phone, Mail, Building2, Clock, CalendarCheck, Trophy, TrendingUp, Users, Download } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d = new Date()) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function startOfWeek(d = new Date()) { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0, 0, 0, 0); return x; }

export default async function OutreachPage() {
  const now = new Date();
  const [rows, callsToday, emailsToday, contactedThisWeek, followUpsDue, meetingsBooked, clientsWon, total] = await Promise.all([
    prisma.outreachLog.findMany({ orderBy: { dateContacted: "desc" }, take: 200 }),
    prisma.outreachLog.count({ where: { method: "call", dateContacted: { gte: startOfDay(now), lte: endOfDay(now) } } }),
    prisma.outreachLog.count({ where: { method: "email", dateContacted: { gte: startOfDay(now), lte: endOfDay(now) } } }),
    prisma.outreachLog.count({ where: { dateContacted: { gte: startOfWeek(now) } } }),
    prisma.outreachLog.count({ where: { followUpDate: { lte: endOfDay(now) } } }),
    prisma.outreachLog.count({ where: { status: "meeting_booked" } }),
    prisma.outreachLog.count({ where: { status: "won" } }),
    prisma.outreachLog.count(),
  ]);

  const conversionRate = total > 0 ? ((clientsWon / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Outreach Tracker</h1>
          <p className="mt-1 text-sm text-navy-400">Log every call, email, text, and visit as you build the business.</p>
        </div>
        <LinkButton href="/api/export/outreach" variant="outline"><Download className="h-4 w-4" /> Export CSV</LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Calls Today" value={String(callsToday)} icon={Phone} />
        <StatCard label="Emails Today" value={String(emailsToday)} icon={Mail} />
        <StatCard label="Contacted This Week" value={String(contactedThisWeek)} icon={Building2} />
        <StatCard label="Follow-Ups Due" value={String(followUpsDue)} icon={Clock} tone="warning" />
        <StatCard label="Meetings Booked" value={String(meetingsBooked)} icon={CalendarCheck} tone="accent" />
        <StatCard label="Clients Won" value={String(clientsWon)} icon={Trophy} tone="success" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon={TrendingUp} />
        <StatCard label="Total Logged" value={String(total)} icon={Users} />
      </div>

      <OutreachQuickAdd />

      {rows.length === 0 ? (
        <EmptyState title="No outreach logged yet" description="Use the form above to log your first call, email, or visit." />
      ) : (
        <Card className="overflow-hidden">
          <OutreachTable rows={rows} />
        </Card>
      )}
    </div>
  );
}
