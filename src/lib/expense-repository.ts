import { pool } from "@/lib/db";

export interface CreateExpenseInput {
  itemName: string;
  amount: number;
  note?: string;
  purchasedAt: string;
}

export interface ExpenseRecord {
  id: string;
  itemName: string;
  amount: number;
  note: string | null;
  purchasedAt: string;
  createdAt: string;
}

interface ExpenseRow {
  id: string;
  item_name: string;
  amount: number;
  note: string | null;
  purchased_at: string;
  created_at: string;
}

function mapRow(row: ExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    itemName: row.item_name,
    amount: row.amount,
    note: row.note,
    purchasedAt: row.purchased_at,
    createdAt: row.created_at,
  };
}

export async function createExpense(input: CreateExpenseInput): Promise<ExpenseRecord> {
  const result = await pool.query<ExpenseRow>(
    `INSERT INTO expenses (item_name, amount, note, purchased_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, item_name, amount, note, to_char(purchased_at, 'YYYY-MM-DD') AS purchased_at, created_at`,
    [input.itemName, input.amount, input.note ?? null, input.purchasedAt],
  );
  return mapRow(result.rows[0]);
}

export async function listExpenses(from: string, to: string): Promise<ExpenseRecord[]> {
  const result = await pool.query<ExpenseRow>(
    `SELECT id, item_name, amount, note, to_char(purchased_at, 'YYYY-MM-DD') AS purchased_at, created_at
     FROM expenses
     WHERE purchased_at BETWEEN $1 AND $2
     ORDER BY purchased_at DESC, created_at DESC`,
    [from, to],
  );
  return result.rows.map(mapRow);
}

export async function deleteExpense(id: string): Promise<void> {
  await pool.query("DELETE FROM expenses WHERE id = $1", [id]);
}
