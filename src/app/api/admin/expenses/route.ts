import { NextRequest, NextResponse } from "next/server";
import { createExpense, listExpenses } from "@/lib/expense-repository";
import { createExpenseSchema, expenseRangeQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const parsed = expenseRangeQuerySchema.safeParse({
    from: request.nextUrl.searchParams.get("from") ?? "",
    to: request.nextUrl.searchParams.get("to") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "Khoảng ngày không hợp lệ" }, { status: 422 });
  }

  const expenses = await listExpenses(parsed.data.from, parsed.data.to);
  return NextResponse.json({ expenses });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.json().catch(() => null);
  if (rawBody === null) {
    return NextResponse.json({ message: "Payload không hợp lệ" }, { status: 422 });
  }

  const parsed = createExpenseSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const expense = await createExpense(parsed.data);
  return NextResponse.json({ expense }, { status: 201 });
}
