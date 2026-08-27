"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { requireAdminSession } from "@/lib/auth";

export interface ExpenseInput {
  date: string;
  description: string;
  category: string;
  vendor: string;
  amountDollars: number;
  notes: string;
}

export async function createExpense(input: ExpenseInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  await prisma.expense.create({
    data: {
      date: new Date(input.date),
      description: input.description,
      category: input.category,
      vendor: input.vendor,
      amountCents: dollarsToCents(input.amountDollars),
      notes: input.notes,
    },
  });
  revalidatePath("/admin/expenses");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  await prisma.expense.delete({ where: { id } });
  revalidatePath("/admin/expenses");
  return { success: true };
}
