"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { generateInvoiceNumber } from "@/lib/utils";
import { requireAdminSession } from "@/lib/auth";

export interface InvoiceItemInput {
  description: string;
  type: string;
  quantity: number;
  unitAmountDollars: number;
}

export interface InvoiceInput {
  clientId?: string;
  businessId?: string;
  clientName: string;
  company: string;
  email: string;
  issueDate: string;
  dueDate: string;
  status: string;
  taxDollars: number;
  notes: string;
  items: InvoiceItemInput[];
}

async function nextInvoiceNumber() {
  const count = await prisma.invoice.count();
  return generateInvoiceNumber(count + 1);
}

export async function createInvoice(input: InvoiceInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const invoiceNumber = await nextInvoiceNumber();
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      clientId: input.clientId || null,
      businessId: input.businessId || null,
      clientName: input.clientName,
      company: input.company,
      email: input.email,
      issueDate: new Date(input.issueDate),
      dueDate: new Date(input.dueDate),
      status: input.status,
      taxCents: dollarsToCents(input.taxDollars || 0),
      notes: input.notes,
      items: {
        create: input.items.map((item: any) => ({
          description: item.description,
          type: item.type,
          quantity: item.quantity,
          unitAmountCents: dollarsToCents(item.unitAmountDollars),
          amountCents: Math.round(item.quantity * dollarsToCents(item.unitAmountDollars)),
        })),
      },
    },
  });
  revalidatePath("/admin/invoices");
  return { success: true, id: invoice.id };
}

export async function updateInvoiceStatus(id: string, status: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const before = await prisma.invoice.findUnique({ where: { id } });
  await prisma.invoice.update({ where: { id }, data: { status } });

  if (before && status === "sent" && before.status === "draft" && before.email) {
    await sendInvoiceEmailAction(id);
  }

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${id}`);
  return { success: true };
}

export async function sendInvoiceEmailAction(id: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
  if (!invoice) return { success: false, error: "Invoice not found" };
  if (!invoice.email) return { success: false, error: "This invoice has no email address on file" };

  const total = invoice.items.reduce((sum: number, i: any) => sum + i.amountCents, 0) + invoice.taxCents;
  const { sendInvoiceEmail } = await import("@/lib/email");
  const result = await sendInvoiceEmail({
    to: invoice.email,
    name: invoice.clientName,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    totalCents: total,
    dueDate: invoice.dueDate,
  });
  return result.skipped ? { success: true } : result;
}

export async function deleteInvoice(id: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/admin/invoices");
  return { success: true };
}
