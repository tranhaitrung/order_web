import { NextRequest, NextResponse } from "next/server";
import { setMenuItemSoldOut } from "@/lib/menu-repository";
import { menuItemUpdateSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const rawBody = await request.json().catch(() => null);
  if (rawBody === null) {
    return NextResponse.json({ message: "Payload không hợp lệ" }, { status: 422 });
  }

  const parsed = menuItemUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 422 });
  }

  await setMenuItemSoldOut(id, parsed.data.soldOut);
  return NextResponse.json({ ok: true });
}
