import { NextResponse } from "next/server";
import { deleteManualRevenue } from "@/lib/manual-revenue-repository";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await deleteManualRevenue(id);
  return NextResponse.json({ ok: true });
}
