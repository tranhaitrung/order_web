import { NextRequest, NextResponse } from "next/server";
import { createTopping } from "@/lib/menu-repository";
import { toppingCreateSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => null);
  if (rawBody === null) {
    return NextResponse.json({ message: "Payload không hợp lệ" }, { status: 422 });
  }

  const parsed = toppingCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const topping = await createTopping(parsed.data);
  return NextResponse.json({ topping }, { status: 201 });
}
