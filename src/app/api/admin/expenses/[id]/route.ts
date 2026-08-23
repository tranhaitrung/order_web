import { NextResponse } from "next/server";
import { deleteExpense } from "@/lib/expense-repository";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await deleteExpense(id);
  return NextResponse.json({ ok: true });
}
