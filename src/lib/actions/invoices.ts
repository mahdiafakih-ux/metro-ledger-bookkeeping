"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { generateInvoiceNumber } from "@/lib/utils";

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
  issueDate: string;
  dueDate: string;
  status: string;
  notes: string;
  items: InvoiceItemInput[];
}

async function nextInvoiceNumber() {
  const count = await prisma.invoice.count();
  return generateInvoiceNumber(count + 1);
}

export async function createInvoice(input: InvoiceInput) {
  const invoiceNumber = await nextInvoiceNumber();
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      clientId: input.clientId || null,
      businessId: input.businessId || null,
      clientName: input.clientName,
      company: input.company,
      issueDate: new Date(input.issueDate),
      dueDate: new Date(input.dueDate),
      status: input.status,
      notes: input.notes,
      items: {
        create: input.items.map((item) => ({
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
  await prisma.invoice.update({ where: { id }, data: { status } });
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${id}`);
  return { success: true };
}

export async function deleteInvoice(id: string) {
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/admin/invoices");
  return { success: true };
}
