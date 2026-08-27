import Link from "next/link";
import { Search, User, Building2, ClipboardList, FileText, Target } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!query) {
    return (
      <EmptyState
        icon={Search}
        title="Search Notar-E"
        description="Search across clients, businesses, appointments, invoices, and leads."
      />
    );
  }

  const [clients, businesses, appointments, invoices, leads] = await Promise.all([
    prisma.client.findMany({
      where: { OR: [{ name: { contains: query } }, { email: { contains: query } }, { company: { contains: query } }] },
      take: 8,
    }),
    prisma.business.findMany({
      where: { OR: [{ companyName: { contains: query } }, { contactName: { contains: query } }, { email: { contains: query } }] },
      take: 8,
    }),
    prisma.appointment.findMany({
      where: { OR: [{ clientName: { contains: query } }, { confirmationNumber: { contains: query } }, { company: { contains: query } }] },
      take: 8,
      orderBy: { scheduledStart: "desc" },
    }),
    prisma.invoice.findMany({
      where: { OR: [{ invoiceNumber: { contains: query } }, { clientName: { contains: query } }, { company: { contains: query } }] },
      take: 8,
    }),
    prisma.leadCapture.findMany({
      where: { OR: [{ name: { contains: query } }, { email: { contains: query } }, { company: { contains: query } }] },
      take: 8,
    }),
  ]);

  const totalResults = clients.length + businesses.length + appointments.length + invoices.length + leads.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Search results for &ldquo;{query}&rdquo;</h1>
        <p className="mt-1 text-sm text-navy-400">{totalResults} result{totalResults === 1 ? "" : "s"} found</p>
      </div>

      {totalResults === 0 && <EmptyState icon={Search} title="No results found" description="Try a different name, email, or confirmation number." />}

      {clients.length > 0 && (
        <ResultSection title="Clients" icon={User}>
          {clients.map((c) => (
            <ResultRow key={c.id} href={`/admin/clients/${c.id}`} title={c.name} sub={c.company || c.email} />
          ))}
        </ResultSection>
      )}

      {businesses.length > 0 && (
        <ResultSection title="Businesses" icon={Building2}>
          {businesses.map((b) => (
            <ResultRow key={b.id} href={`/admin/businesses/${b.id}`} title={b.companyName} sub={b.contactName} />
          ))}
        </ResultSection>
      )}

      {appointments.length > 0 && (
        <ResultSection title="Appointments" icon={ClipboardList}>
          {appointments.map((a) => (
            <ResultRow key={a.id} href={`/admin/appointments/${a.id}`} title={`${a.clientName} — ${a.serviceType}`} sub={`${formatDate(a.scheduledStart)} · ${a.confirmationNumber}`} />
          ))}
        </ResultSection>
      )}

      {invoices.length > 0 && (
        <ResultSection title="Invoices" icon={FileText}>
          {invoices.map((i) => (
            <ResultRow key={i.id} href={`/admin/invoices/${i.id}`} title={i.invoiceNumber} sub={i.clientName} />
          ))}
        </ResultSection>
      )}

      {leads.length > 0 && (
        <ResultSection title="Leads" icon={Target}>
          {leads.map((l) => (
            <ResultRow key={l.id} href="/admin/outreach" title={l.name} sub={l.company || l.email} />
          ))}
        </ResultSection>
      )}
    </div>
  );
}

function ResultSection({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-500">
        <Icon className="h-4 w-4" /> {title}
      </div>
      <Card><CardBody className="divide-y divide-navy-100 p-0">{children}</CardBody></Card>
    </div>
  );
}

function ResultRow({ href, title, sub }: { href: string; title: string; sub?: string }) {
  return (
    <Link href={href} className="flex items-center justify-between px-5 py-3.5 hover:bg-navy-50">
      <span className="font-medium text-navy-900">{title}</span>
      {sub && <span className="text-sm text-navy-400">{sub}</span>}
    </Link>
  );
}
