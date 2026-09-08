import { NextRequest, NextResponse } from "next/server";
import { createManualRevenue, listManualRevenue } from "@/lib/manual-revenue-repository";
import { createManualRevenueSchema, manualRevenueRangeQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const parsed = manualRevenueRangeQuerySchema.safeParse({
    from: request.nextUrl.searchParams.get("from") ?? "",
    to: request.nextUrl.searchParams.get("to") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "Khoảng ngày không hợp lệ" }, { status: 422 });
  }

  const entries = await listManualRevenue(parsed.data.from, parsed.data.to);
  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => null);
  if (rawBody === null) {
    return NextResponse.json({ message: "Payload không hợp lệ" }, { status: 422 });
  }

  const parsed = createManualRevenueSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const entry = await createManualRevenue(parsed.data);
  return NextResponse.json({ entry }, { status: 201 });
}
