import { NextRequest, NextResponse } from "next/server";
import { createMenuItem } from "@/lib/menu-repository";
import { menuItemCreateSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => null);
  if (rawBody === null) {
    return NextResponse.json({ message: "Payload không hợp lệ" }, { status: 422 });
  }

  const parsed = menuItemCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const item = await createMenuItem(parsed.data);
  return NextResponse.json({ item }, { status: 201 });
}
