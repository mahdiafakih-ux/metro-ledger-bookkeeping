import "./load-env"; // must be first: loads .env and blocks non-local DBs
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_PRICING_PLANS } from "../src/lib/pricing-defaults";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
function confNum() {
  return `NE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function main() {
  console.log("Seeding Notar-E Services database...");

  // --- Admin user ---
  const email = process.env.ADMIN_EMAIL || "owner@notareservices.com";
  const password = process.env.ADMIN_PASSWORD || "change-this-password";
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        email,
        name: "Notar-E Owner",
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
    console.log(`Created admin user ${email}`);
  }

  // --- Business settings singleton ---
  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  // --- Availability rules (Mon-Sat, 9am - 7pm; Sunday off) ---
  const existingAvailability = await prisma.availabilityRule.count();
  if (existingAvailability === 0) {
    await prisma.availabilityRule.createMany({
      data: [1, 2, 3, 4, 5, 6].map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "19:00",
        isActive: true,
      })),
    });
  }

  // --- Pricing plans ---
  for (const plan of DEFAULT_PRICING_PLANS) {
    await prisma.pricingPlan.upsert({
      where: { key: plan.key },
      update: {},
      create: { ...plan, features: JSON.stringify(plan.features) },
    });
  }

  // Only seed demo transactional data once
  const demoAlreadySeeded = await prisma.client.count({ where: { isDemo: true } });
  if (demoAlreadySeeded > 0) {
    console.log("Demo data already present — skipping demo seed.");
    await prisma.$disconnect();
    return;
  }

  // --- Demo Clients ---
  const clients = await Promise.all(
    [
      { name: "Sarah Mitchell", company: "", email: "sarah.mitchell@example.com", phone: "(313) 555-0110", clientType: "individual", leadStatus: "active_client", leadSource: "google", totalAppointments: 2, totalRevenueCents: 25000 },
      { name: "David Chen", company: "", email: "dchen@example.com", phone: "(248) 555-0133", clientType: "individual", leadStatus: "active_client", leadSource: "referral", totalAppointments: 1, totalRevenueCents: 12500 },
      { name: "Maria Alvarez", company: "Alvarez Realty Group", email: "maria@alvarezrealty.example", phone: "(586) 555-0177", clientType: "real_estate_agent", leadStatus: "recurring_client", leadSource: "outreach", totalAppointments: 6, totalRevenueCents: 75000 },
      { name: "James Patterson", company: "", email: "jpatterson@example.com", phone: "(734) 555-0199", clientType: "individual", leadStatus: "interested", leadSource: "website", totalAppointments: 0, totalRevenueCents: 0 },
      { name: "Angela Wu", company: "Wu Family Law", email: "awu@wufamilylaw.example", phone: "(313) 555-0142", clientType: "law_firm", leadStatus: "proposal_sent", leadSource: "linkedin", totalAppointments: 0, totalRevenueCents: 0 },
    ].map((c) =>
      prisma.client.create({
        data: {
          ...c,
          isDemo: true,
          firstAppointmentDate: c.totalAppointments > 0 ? daysAgo(60) : null,
          lastAppointmentDate: c.totalAppointments > 0 ? daysAgo(5) : null,
          followUpDate: daysFromNow(3),
        },
      })
    )
  );

  // --- Demo Businesses ---
  const businesses = await Promise.all(
    [
      { companyName: "Metro Title Group", category: "title_company", contactName: "Rebecca Long", email: "rebecca@metrotitlegroup.example", phone: "(313) 555-0200", billingContactName: "Accounts Payable", billingContactEmail: "ap@metrotitlegroup.example", packageKey: "business20", monthlyUsage: 14, monthlyRevenueCents: 250000, expectedMonthlyVolume: 18, status: "active" },
      { companyName: "Great Lakes Mortgage Co.", category: "mortgage_company", contactName: "Tom Ferraro", email: "tferraro@glmortgage.example", phone: "(248) 555-0221", billingContactName: "Tom Ferraro", billingContactEmail: "tferraro@glmortgage.example", packageKey: "unlimited", monthlyUsage: 31, monthlyRevenueCents: 400000, expectedMonthlyVolume: 30, status: "active" },
      { companyName: "Dearborn Family Dentistry", category: "healthcare", contactName: "Dr. Nadia Youssef", email: "office@dearbornfamilydental.example", phone: "(313) 555-0255", billingContactName: "", billingContactEmail: "", packageKey: "", monthlyUsage: 0, monthlyRevenueCents: 0, expectedMonthlyVolume: 5, status: "lead" },
      { companyName: "Prestige Auto Group", category: "dealership", contactName: "Mike Robertson", email: "mrobertson@prestigeauto.example", phone: "(586) 555-0266", billingContactName: "Prestige Accounting", billingContactEmail: "billing@prestigeauto.example", packageKey: "business20", monthlyUsage: 9, monthlyRevenueCents: 250000, expectedMonthlyVolume: 12, status: "active" },
      { companyName: "Somerset Senior Living", category: "senior_living", contactName: "Patricia Nowak", email: "pnowak@somersetsl.example", phone: "(248) 555-0288", billingContactName: "", billingContactEmail: "", packageKey: "", monthlyUsage: 0, monthlyRevenueCents: 0, expectedMonthlyVolume: 8, status: "lead" },
    ].map((b) =>
      prisma.business.create({
        data: {
          ...b,
          isDemo: true,
          contractStart: b.status === "active" ? daysAgo(90) : null,
          contractEndDate: b.status === "active" ? daysFromNow(275) : null,
          renewalDate: b.status === "active" ? daysFromNow(275) : null,
          followUpDate: b.status === "lead" ? daysFromNow(2) : null,
          leadSource: "outreach",
        },
      })
    )
  );

  // --- Demo Appointments (spread across past 60 days + upcoming) ---
  const serviceTypes = ["General Notary", "Real Estate Documents", "Power of Attorney", "Affidavits", "Business Documents"];
  const appointments: { id: string; totalAmountCents: number; scheduledStart: Date; status: string }[] = [];

  for (let i = 0; i < 46; i++) {
    const daysBack = Math.floor(Math.random() * 75);
    const isBusiness = Math.random() < 0.45;
    const client = clients[Math.floor(Math.random() * clients.length)];
    const business = businesses[Math.floor(Math.random() * businesses.length)];
    const acts = 1 + Math.floor(Math.random() * 3);
    const statutory = acts * 1000;
    const serviceFee = isBusiness ? 0 : 11500 + Math.floor(Math.random() * 3) * 500;
    const total = isBusiness ? 0 : statutory + serviceFee; // business appts billed via package
    const start = daysAgo(daysBack);
    start.setHours(9 + Math.floor(Math.random() * 9), [0, 20, 40][Math.floor(Math.random() * 3)], 0, 0);
    const end = new Date(start.getTime() + 20 * 60000);
    const statusRoll = Math.random();
    const status = statusRoll < 0.86 ? "completed" : statusRoll < 0.94 ? "no_show" : "cancelled";

    const appt = await prisma.appointment.create({
      data: {
        confirmationNumber: confNum(),
        type: Math.random() < 0.25 ? "remote" : "in_person",
        status,
        paymentStatus: status === "completed" ? (Math.random() < 0.9 ? "paid" : "unpaid") : "unpaid",
        paymentMethod: isBusiness ? "invoice" : ["card", "cash", "check"][Math.floor(Math.random() * 3)],
        clientId: isBusiness ? null : client.id,
        businessId: isBusiness ? business.id : null,
        clientName: isBusiness ? business.contactName || business.companyName : client.name,
        company: isBusiness ? business.companyName : "",
        email: isBusiness ? business.email : client.email,
        phone: isBusiness ? business.phone : client.phone,
        address: "Metro Detroit, MI",
        serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
        documentType: "Signature documents",
        numberOfActs: acts,
        statutoryFeeCents: statutory,
        travelFeeCents: 0,
        otherFeesCents: isBusiness ? 0 : serviceFee,
        totalAmountCents: total,
        scheduledStart: start,
        scheduledEnd: end,
        isDemo: true,
        source: "admin",
      },
    });
    appointments.push({ id: appt.id, totalAmountCents: total, scheduledStart: start, status });
  }

  // A handful of upcoming appointments
  for (let i = 0; i < 8; i++) {
    const daysOut = 1 + Math.floor(Math.random() * 14);
    const start = daysFromNow(daysOut);
    start.setHours(9 + Math.floor(Math.random() * 9), [0, 20, 40][Math.floor(Math.random() * 3)], 0, 0);
    const end = new Date(start.getTime() + 20 * 60000);
    const client = clients[Math.floor(Math.random() * clients.length)];
    await prisma.appointment.create({
      data: {
        confirmationNumber: confNum(),
        type: Math.random() < 0.3 ? "remote" : "in_person",
        status: "scheduled",
        paymentStatus: "unpaid",
        paymentMethod: "card",
        clientId: client.id,
        clientName: client.name,
        email: client.email,
        phone: client.phone,
        address: "Metro Detroit, MI",
        serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
        documentType: "Signature documents",
        numberOfActs: 1,
        statutoryFeeCents: 1000,
        otherFeesCents: 11500,
        totalAmountCents: 12500,
        scheduledStart: start,
        scheduledEnd: end,
        isDemo: true,
        source: "admin",
      },
    });
  }

  // --- Revenue entries: manual + auto from completed/paid appointments + monthly business subscriptions ---
  const revenueEntries: { date: Date; amountCents: number; source: string; description: string; appointmentId?: string }[] = [];

  for (const a of appointments) {
    if (a.status === "completed" && a.totalAmountCents > 0) {
      revenueEntries.push({
        date: a.scheduledStart,
        amountCents: a.totalAmountCents,
        source: "appointment",
        description: "Completed appointment",
        appointmentId: a.id,
      });
    }
  }
  // Business subscription revenue, last 3 months
  for (const b of businesses.filter((biz) => biz.companyName)) {
    const fullBiz = await prisma.business.findUnique({ where: { id: b.id } });
    if (!fullBiz || fullBiz.monthlyRevenueCents === 0) continue;
    for (let m = 0; m < 3; m++) {
      revenueEntries.push({
        date: daysAgo(30 * m + 5),
        amountCents: fullBiz.monthlyRevenueCents,
        source: "subscription",
        description: `${fullBiz.companyName} — monthly package`,
      });
    }
  }
  // A couple of manual entries
  revenueEntries.push({ date: daysAgo(40), amountCents: 15000, source: "manual", description: "Cash appointment, logged manually" });
  revenueEntries.push({ date: daysAgo(20), amountCents: 22500, source: "manual", description: "Weekend mobile signing, paid via Zelle" });

  await prisma.revenueEntry.createMany({
    data: revenueEntries.map((r) => ({ ...r, isDemo: true })),
  });

  // --- Milestone achievements based on total earned ---
  const totalEarned = revenueEntries.reduce((sum, r) => sum + r.amountCents, 0);
  const milestones = [100000, 500000, 1000000];
  for (const m of milestones) {
    if (totalEarned >= m) {
      await prisma.milestoneAchievement.upsert({
        where: { amountCents: m },
        update: {},
        create: { amountCents: m, seen: true },
      });
    }
  }

  // --- Pipeline opportunities ---
  await prisma.pipelineOpportunity.createMany({
    data: [
      { businessName: "Dearborn Family Dentistry", contactName: "Dr. Nadia Youssef", category: "healthcare", stage: "proposal_sent", potentialMonthlyCents: 250000, dealValueCents: 3000000, probability: 55, nextAction: "Follow up on proposal", nextFollowUpDate: daysFromNow(3), contactAttempts: 3, expectedCloseDate: daysFromNow(10), sortOrder: 1 },
      { businessName: "Somerset Senior Living", contactName: "Patricia Nowak", category: "senior_living", stage: "meeting_scheduled", potentialMonthlyCents: 250000, dealValueCents: 3000000, probability: 40, nextAction: "Prep for on-site meeting", nextFollowUpDate: daysFromNow(2), contactAttempts: 2, expectedCloseDate: daysFromNow(15), sortOrder: 1 },
      { businessName: "Woodward Law Partners", contactName: "Elliot Grant", category: "law_firm", stage: "contacted", potentialMonthlyCents: 400000, dealValueCents: 4800000, probability: 25, nextAction: "Send case studies", nextFollowUpDate: daysFromNow(5), contactAttempts: 1, expectedCloseDate: daysFromNow(25), sortOrder: 1 },
      { businessName: "Riverside Property Management", contactName: "Cheryl Nguyen", category: "property_management", stage: "new_lead", potentialMonthlyCents: 250000, dealValueCents: 3000000, probability: 15, nextAction: "Initial outreach call", nextFollowUpDate: daysFromNow(1), contactAttempts: 0, expectedCloseDate: daysFromNow(40), sortOrder: 1 },
      { businessName: "AutoNation Livonia", contactName: "Brian Kowalski", category: "dealership", stage: "negotiating", potentialMonthlyCents: 400000, dealValueCents: 4800000, probability: 65, nextAction: "Finalize contract terms", nextFollowUpDate: daysFromNow(2), contactAttempts: 5, expectedCloseDate: daysFromNow(7), sortOrder: 1 },
      { businessName: "Community First Credit Union", contactName: "Yasmin Farah", category: "bank_credit_union", stage: "won", potentialMonthlyCents: 250000, dealValueCents: 3000000, probability: 100, contactAttempts: 4, expectedCloseDate: daysAgo(4), sortOrder: 1 },
      { businessName: "Value Rental Cars", contactName: "Pete Simmons", category: "small_business", stage: "lost", potentialMonthlyCents: 25000, dealValueCents: 300000, probability: 0, lostReason: "Went with a competitor offering a lower flat rate", contactAttempts: 3, expectedCloseDate: daysAgo(10), sortOrder: 1 },
      { businessName: "Ford Field Corporate Services", contactName: "Marcus Webb", category: "small_business", stage: "follow_up", potentialMonthlyCents: 250000, dealValueCents: 3000000, probability: 20, nextAction: "Check back after their budget cycle", nextFollowUpDate: daysFromNow(6), contactAttempts: 2, expectedCloseDate: daysFromNow(30), sortOrder: 1 },
      { businessName: "Birmingham Bloomfield Realty", contactName: "Lisa Chen", category: "real_estate_brokerage", stage: "interested", potentialMonthlyCents: 250000, dealValueCents: 3000000, probability: 35, nextAction: "Send Business 20 plan details", nextFollowUpDate: daysFromNow(4), contactAttempts: 2, expectedCloseDate: daysFromNow(20), sortOrder: 1 },
    ].map((p) => ({ ...p, isDemo: true })),
  });

  // --- Outreach log ---
  const methods = ["call", "email", "text", "walk_in", "linkedin", "referral"];
  const responses = ["no_response", "interested", "not_interested", "callback", "voicemail"];
  const companyNames = [
    "Downriver Title Co.", "Oakland County Realty", "Suburban Mortgage Partners", "Henry Ford Health Clinic",
    "Van Dyke Auto Sales", "First Michigan Bank", "Grosse Pointe Law Group", "Macomb Property Managers",
    "Livonia Family Practice", "Trenton Realty Partners",
  ];
  await prisma.outreachLog.createMany({
    data: companyNames.map((name, idx) => ({
      businessName: name,
      contactName: "Contact " + (idx + 1),
      phone: "(313) 555-0" + (300 + idx),
      email: `contact${idx + 1}@example.com`,
      companyType: ["title_company", "real_estate_brokerage", "mortgage_company", "healthcare", "dealership"][idx % 5],
      dateContacted: daysAgo(idx),
      method: methods[idx % methods.length],
      response: responses[idx % responses.length],
      followUpDate: idx % 3 === 0 ? daysFromNow(2) : null,
      status: idx % 4 === 0 ? "follow_up" : "new",
      isDemo: true,
    })),
  });

  // --- Daily scorecard (last 14 days) ---
  for (let i = 0; i < 14; i++) {
    const d = daysAgo(i);
    d.setHours(0, 0, 0, 0);
    await prisma.scorecardEntry.create({
      data: {
        date: d,
        businessesContacted: Math.floor(Math.random() * 22),
        calls: Math.floor(Math.random() * 12),
        emails: Math.floor(Math.random() * 14),
        followUps: Math.floor(Math.random() * 7),
        socialPostDone: Math.random() < 0.7,
        appointmentsCompleted: Math.floor(Math.random() * 4),
        revenueCents: Math.floor(Math.random() * 40000),
        leadsGenerated: Math.floor(Math.random() * 5),
        isDemo: true,
      },
    });
  }

  // --- Expenses ---
  await prisma.expense.createMany({
    data: [
      { date: daysAgo(3), description: "Gas fill-up", category: "gas", vendor: "Speedway", amountCents: 4200 },
      { date: daysAgo(6), description: "Notary stamp renewal", category: "notary_supplies", vendor: "Notary Supply Co.", amountCents: 8500 },
      { date: daysAgo(10), description: "Business card printing", category: "printing", vendor: "VistaPrint", amountCents: 3500 },
      { date: daysAgo(12), description: "E&O insurance premium", category: "insurance", vendor: "State Farm", amountCents: 15000 },
      { date: daysAgo(14), description: "Facebook ad campaign", category: "advertising", vendor: "Meta", amountCents: 12000 },
      { date: daysAgo(18), description: "Website hosting", category: "website", vendor: "Vercel", amountCents: 2000 },
      { date: daysAgo(22), description: "Scheduling software", category: "software", vendor: "Calendly", amountCents: 1200 },
      { date: daysAgo(28), description: "Printer ink", category: "ink", vendor: "Staples", amountCents: 4500 },
      { date: daysAgo(33), description: "Cell phone bill", category: "phone", vendor: "Verizon", amountCents: 8000 },
      { date: daysAgo(40), description: "Legal filing services", category: "professional_services", vendor: "LegalZoom", amountCents: 9900 },
    ].map((e) => ({ ...e, isDemo: true })),
  });

  // --- Mileage ---
  await prisma.mileageLog.createMany({
    data: [
      { date: daysAgo(2), startLocation: "Home Office, Dearborn MI", destination: "Metro Title Group, Southfield MI", purpose: "Business signing", miles: 18.4, clientName: "Metro Title Group" },
      { date: daysAgo(5), startLocation: "Home Office, Dearborn MI", destination: "Client residence, Livonia MI", purpose: "Mobile notarization", miles: 12.1, clientName: "Sarah Mitchell" },
      { date: daysAgo(9), startLocation: "Home Office, Dearborn MI", destination: "Prestige Auto Group, Troy MI", purpose: "Business signing", miles: 24.7, clientName: "Prestige Auto Group" },
      { date: daysAgo(15), startLocation: "Home Office, Dearborn MI", destination: "Client office, Ann Arbor MI", purpose: "Mobile notarization", miles: 32.9, clientName: "James Patterson" },
    ].map((m) => ({ ...m, isDemo: true })),
  });

  // --- Invoices ---
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-00001",
      businessId: businesses[0].id,
      clientName: "Rebecca Long",
      company: "Metro Title Group",
      issueDate: daysAgo(5),
      dueDate: daysFromNow(10),
      status: "sent",
      isDemo: true,
      items: {
        create: [
          { description: "Business Package — 14 appointments this month", type: "other_service", quantity: 1, unitAmountCents: 250000, amountCents: 250000 },
        ],
      },
    },
  });
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-00002",
      clientId: clients[0].id,
      clientName: clients[0].name,
      issueDate: daysAgo(10),
      dueDate: daysAgo(0),
      status: "paid",
      isDemo: true,
      items: {
        create: [
          { description: "Statutory notarial fee (1 act)", type: "statutory_fee", quantity: 1, unitAmountCents: 1000, amountCents: 1000 },
          { description: "Signing agent & service fee", type: "other_service", quantity: 1, unitAmountCents: 11500, amountCents: 11500 },
        ],
      },
    },
  });
  void inv1;
  void inv2;
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-00003",
      businessId: businesses[1].id,
      clientName: "Tom Ferraro",
      company: "Great Lakes Mortgage Co.",
      issueDate: daysAgo(35),
      dueDate: daysAgo(20),
      status: "overdue",
      isDemo: true,
      items: {
        create: [
          { description: "Unlimited Business Plan — monthly", type: "other_service", quantity: 1, unitAmountCents: 400000, amountCents: 400000 },
        ],
      },
    },
  });

  // --- Lead captures ---
  await prisma.leadCapture.createMany({
    data: [
      { name: "Kevin Brooks", company: "", email: "kbrooks@example.com", phone: "(313) 555-0410", serviceNeeded: "Power of Attorney", message: "Need a POA notarized this week.", isBusinessLead: false },
      { name: "Lauren Kim", company: "Kim & Associates Realty", email: "lkim@kimrealty.example", phone: "(248) 555-0455", serviceNeeded: "Recurring business service", message: "Interested in the Business 20 plan for our closings.", estimatedAppointmentsPerMonth: "15-20", isBusinessLead: true },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
