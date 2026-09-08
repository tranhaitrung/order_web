import { NextRequest, NextResponse } from "next/server";
import { updateTopping } from "@/lib/menu-repository";
import { toppingUpdateSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const rawBody = await request.json().catch(() => null);
  if (rawBody === null) {
    return NextResponse.json({ message: "Payload không hợp lệ" }, { status: 422 });
  }

  const parsed = toppingUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 422 });
  }

  const topping = await updateTopping(id, parsed.data);
  if (!topping) {
    return NextResponse.json({ message: "Không tìm thấy topping" }, { status: 404 });
  }

  return NextResponse.json({ topping });
}
