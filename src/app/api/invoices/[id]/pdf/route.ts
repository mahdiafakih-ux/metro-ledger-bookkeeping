import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getBusinessSettings } from "@/lib/settings";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-pdf";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({ where: { id }, include: { items: true } }),
    getBusinessSettings(),
  ]);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const buffer = await renderToBuffer(
    InvoicePdfDocument({
      invoice,
      business: { businessName: settings.businessName, email: settings.email, phone: settings.phone },
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
