import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { detroitDayRange, parseDateISO } from "@/lib/tz";
import { requireAgentAuth } from "@/lib/agent/auth";

export async function GET(request: NextRequest) {
  const denied = requireAgentAuth(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);

    const dateParam = searchParams.get("date");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let from: Date;
    let to: Date;

    if (dateParam) {
      if (!parseDateISO(dateParam)) {
        return NextResponse.json(
          { success: false, error: "Invalid date. Use YYYY-MM-DD." },
          { status: 400 }
        );
      }

      const range = detroitDayRange(dateParam);
      from = range.start;
      to = range.end;
    } else {
      from = fromParam ? new Date(fromParam) : new Date();
      to = toParam
        ? new Date(toParam)
        : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      to <= from
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid date range" },
        { status: 400 }
      );
    }

    // Prevent an agent/tool mistake from requesting an enormous dataset.
    const maxRangeMs = 31 * 24 * 60 * 60 * 1000;

    if (to.getTime() - from.getTime() > maxRangeMs) {
      return NextResponse.json(
        { success: false, error: "Date range cannot exceed 31 days" },
        { status: 400 }
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledStart: {
          gte: from,
          lt: to,
        },
        isDemo: false,
      },
      orderBy: {
        scheduledStart: "asc",
      },
      take: 100,
      select: {
        id: true,
        confirmationNumber: true,
        status: true,
        paymentStatus: true,
        clientName: true,
        company: true,
        serviceType: true,
        documentType: true,
        numberOfActs: true,
        totalAmountCents: true,
        amountPaidCents: true,
        scheduledStart: true,
        scheduledEnd: true,
        source: true,
      },
    });

    return NextResponse.json({
      success: true,
      from: from.toISOString(),
      to: to.toISOString(),
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Agent appointments API error:", error instanceof Error ? error.message : error);

    return NextResponse.json(
      { success: false, error: "Unable to retrieve appointments" },
      { status: 500 }
    );
  }
}
