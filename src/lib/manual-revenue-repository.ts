import { pool } from "@/lib/db";

export interface CreateManualRevenueInput {
  amount: number;
  note?: string;
  entryDate: string;
}

export interface ManualRevenueRecord {
  id: string;
  amount: number;
  note: string | null;
  entryDate: string;
  createdAt: string;
}

interface ManualRevenueRow {
  id: string;
  amount: number;
  note: string | null;
  entry_date: string;
  created_at: string;
}

function mapRow(row: ManualRevenueRow): ManualRevenueRecord {
  return {
    id: row.id,
    amount: row.amount,
    note: row.note,
    entryDate: row.entry_date,
    createdAt: row.created_at,
  };
}

export async function createManualRevenue(input: CreateManualRevenueInput): Promise<ManualRevenueRecord> {
  const result = await pool.query<ManualRevenueRow>(
    `INSERT INTO manual_revenue_entries (amount, note, entry_date)
     VALUES ($1, $2, $3)
     RETURNING id, amount, note, to_char(entry_date, 'YYYY-MM-DD') AS entry_date, created_at`,
    [input.amount, input.note ?? null, input.entryDate],
  );
  return mapRow(result.rows[0]);
}

export async function listManualRevenue(from: string, to: string): Promise<ManualRevenueRecord[]> {
  const result = await pool.query<ManualRevenueRow>(
    `SELECT id, amount, note, to_char(entry_date, 'YYYY-MM-DD') AS entry_date, created_at
     FROM manual_revenue_entries
     WHERE entry_date BETWEEN $1 AND $2
     ORDER BY entry_date DESC, created_at DESC`,
    [from, to],
  );
  return result.rows.map(mapRow);
}

export async function deleteManualRevenue(id: string): Promise<void> {
  await pool.query("DELETE FROM manual_revenue_entries WHERE id = $1", [id]);
}
