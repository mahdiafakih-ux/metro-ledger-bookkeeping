import "./load-env"; // loads .env; refuses non-local DBs unless ALLOW_REMOTE_DB=true
import { PrismaClient } from "@prisma/client";
import { getZonedParts } from "../src/lib/tz";

/**
 * READ-ONLY timezone audit. Makes no writes.
 *
 * Before the America/Detroit fix, bookings built their timestamp with the
 * server's local clock. On Vercel (UTC) a customer who picked "9:00 AM" was
 * stored as 09:00Z — which is 5:00 AM Detroit (EDT) / 4:00 AM (EST).
 *
 * This lists appointments whose Detroit time falls OUTSIDE your availability
 * hours while their UTC wall time falls INSIDE them — the signature of that
 * shift. They are candidates for MANUAL review only; nothing is changed.
 *
 *   ALLOW_REMOTE_DB=true DATABASE_URL="<prod url>" npx tsx prisma/tz-audit.ts
 */
const prisma = new PrismaClient();

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

async function main() {
  const rules = await prisma.availabilityRule.findMany({ where: { isActive: true } });
  const byDay = new Map(rules.map((r) => [r.dayOfWeek, r]));
  const appts = await prisma.appointment.findMany({
    where: { isDemo: false },
    orderBy: { scheduledStart: "asc" },
    select: { id: true, confirmationNumber: true, clientName: true, source: true, status: true, scheduledStart: true, createdAt: true },
  });

  const inHours = (day: number, minutes: number) => {
    const r = byDay.get(day);
    return !!r && minutes >= toMin(r.startTime) && minutes < toMin(r.endTime);
  };

  const suspects = appts.filter((a) => {
    const d = getZonedParts(a.scheduledStart);
    const detroitOk = inHours(d.weekday, d.hour * 60 + d.minute);
    const u = a.scheduledStart;
    const utcOk = inHours(u.getUTCDay(), u.getUTCHours() * 60 + u.getUTCMinutes());
    return !detroitOk && utcOk;
  });

  console.log(`Checked ${appts.length} non-demo appointments. ${suspects.length} look shifted (review manually):\n`);
  for (const a of suspects) {
    const d = getZonedParts(a.scheduledStart);
    const u = a.scheduledStart;
    const pad = (n: number) => String(n).padStart(2, "0");
    console.log(
      `${a.confirmationNumber}  ${a.clientName.padEnd(24)} ${a.status.padEnd(10)} source=${a.source.padEnd(14)}` +
        ` stored-as-Detroit=${d.year}-${pad(d.month)}-${pad(d.day)} ${pad(d.hour)}:${pad(d.minute)}` +
        `  likely-intended=${u.toISOString().slice(0, 10)} ${pad(u.getUTCHours())}:${pad(u.getUTCMinutes())} (Detroit)`
    );
  }
  console.log("\nNo records were modified.");
}

main().finally(() => prisma.$disconnect());
