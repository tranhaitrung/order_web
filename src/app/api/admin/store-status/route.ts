import { NextRequest, NextResponse } from "next/server";
import { computeClosedUntil, parseVnDateTimeLocal } from "@/lib/delivery";
import { getStoreStatus, setStoreClosed, setStoreOpen } from "@/lib/store-status-repository";
import { storeStatusUpdateSchema } from "@/lib/validation";

export async function GET() {
  const status = await getStoreStatus();
  return NextResponse.json({ status });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => null);
  if (rawBody === null) {
    return NextResponse.json({ message: "Payload không hợp lệ" }, { status: 422 });
  }

  const parsed = storeStatusUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 422 });
  }

  const { data } = parsed;

  if (data.action === "open") {
    await setStoreOpen();
  } else if (!data.scope) {
    return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 422 });
  } else if (data.scope === "range") {
    const from = data.from ? parseVnDateTimeLocal(data.from) : null;
    const to = data.to ? parseVnDateTimeLocal(data.to) : null;
    if (!from || !to || to <= from) {
      return NextResponse.json({ message: "Khoảng thời gian không hợp lệ" }, { status: 422 });
    }
    await setStoreClosed("range", from, to, data.note ?? null);
  } else {
    const closedUntil = computeClosedUntil(data.scope);
    await setStoreClosed(data.scope, null, closedUntil, data.note ?? null);
  }

  const status = await getStoreStatus();
  return NextResponse.json({ status });
}
