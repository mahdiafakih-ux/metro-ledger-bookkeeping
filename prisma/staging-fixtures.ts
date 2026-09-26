import "./load-env"; // must be first: loads .env and blocks remote DBs unless ALLOW_REMOTE_DB=true
import { dbTarget } from "./load-env";
import type { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/db";
import { syncBusinessUsage } from "../src/lib/usage";
import { detroitDateTimeToUtc, addDaysISO, detroitTodayISO } from "../src/lib/tz";

/**
 * STAGING-ONLY portal test data (Business30, legacy Business Unlimited,
 * pay-as-you-go, a view-only member, 3 notaries, appointments, invoices).
 *
 * Safety guards — the script refuses to run unless ALL are true:
 *   1. STAGING_CONFIRM_HOST exactly equals the database host being written to
 *   2. FIXTURE_EMAIL is set (logins become plus-aliases of it, e.g. you+dana@…)
 *   3. The database contains NO real clients (any non-demo client outside this
 *      script's own fixture emails aborts the run) — so it cannot run against
 *      production.
 *
 *   ALLOW_REMOTE_DB=true STAGING_CONFIRM_HOST=<staging host> \
 *   FIXTURE_EMAIL=you@gmail.com DATABASE_URL="<staging url>" \
 *   npm run db:staging-fixtures
 */

const fixtureEmail = process.env.FIXTURE_EMAIL ?? "";
function E(tag: string) {
  const [local, domain] = fixtureEmail.split("@");
  return `${local}+notare-${tag}@${domain}`.toLowerCase();
}

async function guard() {
  if (process.env.STAGING_CONFIRM_HOST !== dbTarget.host) {
    console.error(`Refusing: set STAGING_CONFIRM_HOST=${dbTarget.host} to confirm this is the STAGING database.`);
    process.exit(1);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fixtureEmail)) {
    console.error("Refusing: set FIXTURE_EMAIL to an inbox you control (login codes are sent to plus-aliases of it).");
    process.exit(1);
  }
  const fixtureEmails = ["dana", "viewer", "marcus", "priya", "lakeshore-billing", "greatlakes-ops"].map(E);
  const real = await prisma.client.count({ where: { isDemo: false, email: { notIn: fixtureEmails } } });
  if (real > 0) {
    console.error(`Refusing: this database has ${real} real (non-demo) client(s). It looks like production.`);
    process.exit(1);
  }
}

async function main() {
  await guard();
const T = detroitTodayISO();
const at = (dayOffset: number, hhmm: string) => detroitDateTimeToUtc(addDaysISO(T, dayOffset), hhmm)!;
let seq = 1000;
const conf = () => `NE-STG${(seq++).toString(36).toUpperCase()}`;

  // Remove only rows previously created by THIS script (fixture emails / names).
  const fixtureEmails = ["dana", "viewer", "marcus", "priya", "lakeshore-billing", "greatlakes-ops"].map(E);
  await prisma.businessUsage.deleteMany({ where: { business: { email: { in: fixtureEmails } } } });
  await prisma.preferredNotary.deleteMany({ where: { OR: [{ business: { email: { in: fixtureEmails } } }, { client: { email: { in: fixtureEmails } } }] } });
  await prisma.payment.deleteMany({ where: { OR: [{ invoice: { email: { in: fixtureEmails } } }, { appointment: { email: { in: fixtureEmails } } }] } });
  await prisma.invoice.deleteMany({ where: { email: { in: fixtureEmails } } });
  await prisma.appointment.deleteMany({ where: { email: { in: fixtureEmails } } });
  await prisma.businessClient.deleteMany({ where: { client: { email: { in: fixtureEmails } } } });
  await prisma.client.deleteMany({ where: { email: { in: fixtureEmails } } });
  await prisma.business.deleteMany({ where: { email: { in: fixtureEmails } } });
  await prisma.notary.deleteMany({ where: { fullName: { endsWith: "(staging fixture)" } } });

  const [sarah, john, mahdi] = await Promise.all([
    prisma.notary.create({ data: { displayName: "Sarah M.", fullName: "Sarah Mitchell (staging fixture)" } }),
    prisma.notary.create({ data: { displayName: "John D.", fullName: "John Dawson (staging fixture)" } }),
    prisma.notary.create({ data: { displayName: "Mahdi F.", fullName: "Mahdi Fakih (staging fixture)" } }),
  ]);

  const periodStart = at(-14, "00:00"), periodEnd = at(16, "00:00");
  const lakeshore = await prisma.business.create({
    data: {
      companyName: "Lakeshore Title Co.", category: "title_company", email: E("lakeshore-billing"), contactName: "Dana Whitfield",
      currentPlanKey: "business30", subscriptionStatus: "active", stripeSubscriptionId: "sub_staging_fixture_b30",
      currentPeriodStart: periodStart, currentPeriodEnd: periodEnd, nextBillingDate: periodEnd, status: "active",
    },
  });
  const dana = await prisma.client.create({ data: { name: "Dana Whitfield", email: E("dana"), phone: "(313) 555-0101", company: "Lakeshore Title Co.", clientType: "title" } });
  const viewer = await prisma.client.create({ data: { name: "Victor Viewer", email: E("viewer"), company: "Lakeshore Title Co." } });
  await prisma.businessClient.createMany({ data: [
    { businessId: lakeshore.id, clientId: dana.id, role: "owner" },
    { businessId: lakeshore.id, clientId: viewer.id, role: "viewer" },
  ] });

  const base = (o: Record<string, unknown>): Prisma.AppointmentUncheckedCreateInput => ({
    confirmationNumber: conf(), clientName: "Dana Whitfield", email: E("dana"), company: "Lakeshore Title Co.",
    clientId: dana.id, businessId: lakeshore.id, type: "in_person", address: "400 Renaissance Center, Detroit, MI",
    statutoryFeeCents: 0, otherFeesCents: 0, totalAmountCents: 0, paymentMethod: "invoice", ...o,
  }) as Prisma.AppointmentUncheckedCreateInput;
  const svc = ["Real Estate Documents", "Acknowledgments", "Affidavits", "Power of Attorney"];
  // 18 completed this period (varied notaries), 1 completed last period
  for (let i = 0; i < 18; i++) {
    const s = at(-13 + Math.floor(i * 0.7), ["09:00", "10:30", "13:00", "15:30"][i % 4]);
    await prisma.appointment.create({ data: base({
      serviceType: svc[i % 4], documentType: "Closing package", scheduledStart: s, scheduledEnd: new Date(s.getTime() + 20 * 60000),
      status: "completed", completedAt: new Date(s.getTime() + 25 * 60000), assignedNotaryId: i % 3 === 0 ? john.id : sarah.id,
    }) });
  }
  const old = at(-20, "11:00");
  await prisma.appointment.create({ data: base({ serviceType: "Affidavits", scheduledStart: old, scheduledEnd: new Date(old.getTime() + 1200000), status: "completed", assignedNotaryId: sarah.id }) });
  // upcoming
  const u1 = at(1, "10:00"), u2 = at(3, "14:30"), u3 = at(6, "09:30");
  await prisma.appointment.create({ data: base({ serviceType: "Real Estate Documents", documentType: "Seller closing package", scheduledStart: u1, scheduledEnd: new Date(u1.getTime() + 1200000), status: "scheduled", assignedNotaryId: sarah.id, notaryPreference: "preferred", preferredNotaryId: sarah.id }) });
  await prisma.appointment.create({ data: base({ serviceType: "Acknowledgments", scheduledStart: u2, scheduledEnd: new Date(u2.getTime() + 1200000), status: "scheduled", type: "remote", address: "" }) });
  await prisma.appointment.create({ data: base({ serviceType: "Power of Attorney", scheduledStart: u3, scheduledEnd: new Date(u3.getTime() + 1200000), status: "scheduled", notaryPreference: "first_available" }) });
  const c1 = at(-2, "16:00");
  await prisma.appointment.create({ data: base({ serviceType: "Affidavits", scheduledStart: c1, scheduledEnd: new Date(c1.getTime() + 1200000), status: "cancelled" }) });

  await prisma.preferredNotary.create({ data: { businessId: lakeshore.id, notaryId: sarah.id, isPrimary: true } });

  // invoices
  const inv = async (n: string, o: Record<string, unknown>, amount: number) => prisma.invoice.create({ data: {
    invoiceNumber: n, businessId: lakeshore.id, clientName: "Lakeshore Title Co.", company: "Lakeshore Title Co.", email: E("lakeshore-billing"),
    issueDate: new Date(`${addDaysISO(T, -40)}T00:00:00Z`), dueDate: new Date(`${addDaysISO(T, -25)}T00:00:00Z`), status: "sent", ...o,
    items: { create: [
      { description: "Business 30 — monthly plan", type: "other_service", quantity: 1, unitAmountCents: amount, amountCents: amount },
    ] },
  } });
  const paid = await inv("INV-STG1041", { status: "paid", amountPaidCents: 300000 }, 300000);
  await prisma.payment.create({ data: { invoiceId: paid.id, amountCents: 300000, method: "stripe", status: "succeeded", paidAt: at(-30, "12:05") } });
  await inv("INV-STG1042", { issueDate: new Date(`${addDaysISO(T, -3)}T00:00:00Z`), dueDate: new Date(`${addDaysISO(T, 12)}T00:00:00Z`) }, 300000);
  await inv("INV-STG1039", { issueDate: new Date(`${addDaysISO(T, -45)}T00:00:00Z`), dueDate: new Date(`${addDaysISO(T, -15)}T00:00:00Z`) }, 4000);
  await inv("INV-STG1043", { status: "draft" }, 99900); // must NOT appear in portal

  // Pay-as-you-go individual
  const marcus = await prisma.client.create({ data: { name: "Marcus Reed", email: E("marcus"), phone: "(248) 555-0144" } });
  const m1 = at(-6, "11:00");
  const ma = await prisma.appointment.create({ data: {
    confirmationNumber: conf(), clientId: marcus.id, clientName: "Marcus Reed", email: E("marcus"), type: "in_person", address: "22 Oak St, Royal Oak, MI",
    serviceType: "Power of Attorney", documentType: "Durable POA", numberOfActs: 2, statutoryFeeCents: 2000, otherFeesCents: 11500, totalAmountCents: 13500,
    amountPaidCents: 13500, paymentStatus: "paid", paymentMethod: "card", scheduledStart: m1, scheduledEnd: new Date(m1.getTime() + 1200000),
    status: "completed", completedAt: new Date(m1.getTime() + 1500000), assignedNotaryId: mahdi.id,
  } });
  await prisma.payment.create({ data: { appointmentId: ma.id, amountCents: 13500, method: "stripe", status: "succeeded", paidAt: new Date(m1.getTime() - 86400000) } });

  // Unlimited business
  const gl = await prisma.business.create({ data: {
    companyName: "Great Lakes Mortgage", category: "mortgage_company", email: E("greatlakes-ops"),
    currentPlanKey: "unlimited", subscriptionStatus: "active", stripeSubscriptionId: "sub_staging_fixture_unl",
    currentPeriodStart: periodStart, currentPeriodEnd: periodEnd, nextBillingDate: periodEnd, status: "active",
  } });
  const priya = await prisma.client.create({ data: { name: "Priya Shah", email: E("priya"), company: "Great Lakes Mortgage" } });
  await prisma.businessClient.create({ data: { businessId: gl.id, clientId: priya.id, role: "owner" } });
  for (let i = 0; i < 7; i++) {
    const s = at(-10 + i, "10:00");
    await prisma.appointment.create({ data: { confirmationNumber: conf(), clientId: priya.id, businessId: gl.id, clientName: "Priya Shah", email: E("priya"),
      serviceType: "Financial Documents", scheduledStart: s, scheduledEnd: new Date(s.getTime() + 1200000), status: "completed", completedAt: new Date(s.getTime() + 1500000),
      statutoryFeeCents: 0, otherFeesCents: 0, totalAmountCents: 0, assignedNotaryId: john.id } });
  }

  await syncBusinessUsage(lakeshore.id);
  await syncBusinessUsage(gl.id);
  const usage = await prisma.businessUsage.findMany({ where: { businessId: lakeshore.id } });
  const b = await prisma.business.findUnique({ where: { id: lakeshore.id } });
  console.log(`Lakeshore usage rows=${usage.length} overage=${usage.filter((u) => u.isOverage).length} monthlyUsageCount=${b?.monthlyUsageCount}`);
  console.log("\nPortal test logins (sign in at /portal/login; the code is emailed):");
  console.log(`  Business 30 owner   ${E("dana")}`);
  console.log(`  Business 30 viewer  ${E("viewer")}   (view-only: cannot request)`);
  console.log(`  Business Unlimited  ${E("priya")}`);
  console.log(`  Pay-as-you-go       ${E("marcus")}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
