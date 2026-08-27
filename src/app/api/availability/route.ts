import { NextRequest, NextResponse } from "next/server";
import { getOpenSlotsForDate } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const slots = await getOpenSlotsForDate(date);
  return NextResponse.json({ slots });
}
