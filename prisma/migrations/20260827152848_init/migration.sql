-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "businessName" TEXT NOT NULL DEFAULT 'Notar-E Services',
    "phone" TEXT NOT NULL DEFAULT '(313) 555-0142',
    "email" TEXT NOT NULL DEFAULT 'hello@notareservices.com',
    "serviceArea" TEXT NOT NULL DEFAULT 'Metro Detroit & Southeast Michigan',
    "addressLine" TEXT NOT NULL DEFAULT 'Serving Wayne, Oakland, Macomb & Washtenaw Counties',
    "logoNotes" TEXT NOT NULL DEFAULT '',
    "facebookUrl" TEXT NOT NULL DEFAULT '',
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "linkedinUrl" TEXT NOT NULL DEFAULT '',
    "googleBusinessUrl" TEXT NOT NULL DEFAULT '',
    "appointmentDurationMinutes" INTEGER NOT NULL DEFAULT 20,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 10,
    "minNoticeHours" INTEGER NOT NULL DEFAULT 4,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 60,
    "vacationMode" BOOLEAN NOT NULL DEFAULT false,
    "vacationMessage" TEXT NOT NULL DEFAULT '',
    "goalAmountCents" INTEGER NOT NULL DEFAULT 5000000,
    "goalDeadline" DATETIME NOT NULL DEFAULT '2027-05-31 00:00:00 +00:00',
    "goalStartDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heroHeadline" TEXT NOT NULL DEFAULT 'Notarization Made Simple.',
    "heroSubheadline" TEXT NOT NULL DEFAULT 'Professional Michigan notary services — when and where you need them.',
    "targetBusinessesContacted" INTEGER NOT NULL DEFAULT 20,
    "targetCalls" INTEGER NOT NULL DEFAULT 10,
    "targetEmails" INTEGER NOT NULL DEFAULT 10,
    "targetFollowUps" INTEGER NOT NULL DEFAULT 5,
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "demoDataSeeded" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "BlackoutDate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "reason" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billingPeriod" TEXT NOT NULL,
    "statutoryFeeCents" INTEGER NOT NULL,
    "actsIncluded" INTEGER NOT NULL DEFAULT 1,
    "serviceFeeCents" INTEGER NOT NULL,
    "serviceFeeLabel" TEXT NOT NULL DEFAULT 'Signing Agent & Service Fee',
    "totalCents" INTEGER NOT NULL,
    "appointmentsIncluded" INTEGER,
    "overageFeeCents" INTEGER,
    "description" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "clientType" TEXT NOT NULL DEFAULT 'individual',
    "firstAppointmentDate" DATETIME,
    "lastAppointmentDate" DATETIME,
    "totalAppointments" INTEGER NOT NULL DEFAULT 0,
    "totalRevenueCents" INTEGER NOT NULL DEFAULT 0,
    "currentPackage" TEXT NOT NULL DEFAULT '',
    "amountOwedCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "followUpDate" DATETIME,
    "leadStatus" TEXT NOT NULL DEFAULT 'new_lead',
    "leadSource" TEXT NOT NULL DEFAULT 'website',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contactName" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "packageKey" TEXT NOT NULL DEFAULT '',
    "monthlyUsage" INTEGER NOT NULL DEFAULT 0,
    "monthlyRevenueCents" INTEGER NOT NULL DEFAULT 0,
    "contractStart" DATETIME,
    "renewalDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'lead',
    "notes" TEXT NOT NULL DEFAULT '',
    "followUpDate" DATETIME,
    "leadSource" TEXT NOT NULL DEFAULT 'outreach',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "confirmationNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'in_person',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paymentMethod" TEXT NOT NULL DEFAULT '',
    "clientId" TEXT,
    "businessId" TEXT,
    "clientName" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "serviceType" TEXT NOT NULL DEFAULT 'General Notary',
    "documentType" TEXT NOT NULL DEFAULT '',
    "numberOfActs" INTEGER NOT NULL DEFAULT 1,
    "statutoryFeeCents" INTEGER NOT NULL DEFAULT 1000,
    "travelFeeCents" INTEGER NOT NULL DEFAULT 0,
    "otherFeesCents" INTEGER NOT NULL DEFAULT 0,
    "totalAmountCents" INTEGER NOT NULL DEFAULT 1000,
    "scheduledStart" DATETIME NOT NULL,
    "scheduledEnd" DATETIME NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "followUpDate" DATETIME,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'admin',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PipelineOpportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'other',
    "stage" TEXT NOT NULL DEFAULT 'lead',
    "potentialMonthlyCents" INTEGER NOT NULL DEFAULT 0,
    "probability" INTEGER NOT NULL DEFAULT 20,
    "expectedCloseDate" DATETIME,
    "notes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OutreachLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "companyType" TEXT NOT NULL DEFAULT 'other',
    "dateContacted" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'call',
    "response" TEXT NOT NULL DEFAULT 'no_response',
    "followUpDate" DATETIME,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'new',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ScorecardEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "businessesContacted" INTEGER NOT NULL DEFAULT 0,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "emails" INTEGER NOT NULL DEFAULT 0,
    "followUps" INTEGER NOT NULL DEFAULT 0,
    "socialPostDone" BOOLEAN NOT NULL DEFAULT false,
    "appointmentsCompleted" INTEGER NOT NULL DEFAULT 0,
    "revenueCents" INTEGER NOT NULL DEFAULT 0,
    "leadsGenerated" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "RevenueEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amountCents" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "description" TEXT NOT NULL DEFAULT '',
    "appointmentId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RevenueEntry_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "vendor" TEXT NOT NULL DEFAULT '',
    "amountCents" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MileageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startLocation" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '',
    "miles" REAL NOT NULL,
    "clientName" TEXT NOT NULL DEFAULT '',
    "appointmentId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MileageLog_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "clientId" TEXT,
    "businessId" TEXT,
    "clientName" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT '',
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT NOT NULL DEFAULT '',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'other_service',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmountCents" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedScenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "inputsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MilestoneAchievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amountCents" INTEGER NOT NULL,
    "achievedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "link" TEXT NOT NULL DEFAULT '',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LeadCapture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "serviceNeeded" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "estimatedAppointmentsPerMonth" TEXT NOT NULL DEFAULT '',
    "isBusinessLead" BOOLEAN NOT NULL DEFAULT false,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PricingPlan_key_key" ON "PricingPlan"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_confirmationNumber_key" ON "Appointment"("confirmationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ScorecardEntry_date_key" ON "ScorecardEntry"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneAchievement_amountCents_key" ON "MilestoneAchievement"("amountCents");
