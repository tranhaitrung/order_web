import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/order-repository";
import { orderStatusUpdateSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const rawBody = await request.json().catch(() => null);
  if (rawBody === null) {
    return NextResponse.json({ message: "Payload không hợp lệ" }, { status: 422 });
  }

  const parsed = orderStatusUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 422 });
  }

  await updateOrderStatus(id, parsed.data.status);
  return NextResponse.json({ ok: true });
}
