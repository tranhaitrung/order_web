import { pool } from "@/lib/db";
import type { ClosedScope } from "@/lib/delivery";

export interface StoreStatus {
  isClosed: boolean;
  closedScope: ClosedScope | null;
  closedFrom: string | null;
  closedUntil: string | null;
  closedNote: string | null;
  updatedAt: string;
}

interface StoreStatusRow {
  is_closed: boolean;
  closed_scope: ClosedScope | null;
  closed_from: string | null;
  closed_until: string | null;
  closed_note: string | null;
  updated_at: string;
}

function mapRow(row: StoreStatusRow): StoreStatus {
  return {
    isClosed: row.is_closed,
    closedScope: row.closed_scope,
    closedFrom: row.closed_from,
    closedUntil: row.closed_until,
    closedNote: row.closed_note,
    updatedAt: row.updated_at,
  };
}

export async function getStoreStatus(): Promise<StoreStatus> {
  const result = await pool.query<StoreStatusRow>(
    "SELECT is_closed, closed_scope, closed_from, closed_until, closed_note, updated_at FROM store_status WHERE id = 1",
  );
  return mapRow(
    result.rows[0] ?? {
      is_closed: false,
      closed_scope: null,
      closed_from: null,
      closed_until: null,
      closed_note: null,
      updated_at: new Date().toISOString(),
    },
  );
}

export async function setStoreOpen(): Promise<void> {
  await pool.query(
    `UPDATE store_status
     SET is_closed = FALSE, closed_scope = NULL, closed_from = NULL, closed_until = NULL, closed_note = NULL,
         updated_at = now()
     WHERE id = 1`,
  );
}

export async function setStoreClosed(
  scope: ClosedScope,
  closedFrom: Date | null,
  closedUntil: Date | null,
  note: string | null,
): Promise<void> {
  await pool.query(
    `UPDATE store_status
     SET is_closed = TRUE, closed_scope = $1, closed_from = $2, closed_until = $3, closed_note = $4,
         updated_at = now()
     WHERE id = 1`,
    [scope, closedFrom, closedUntil, note],
  );
}

/**
 * True if new orders should currently be rejected.
 * A future closed_from means the closure is scheduled but not active yet.
 * A past closed_until means it has auto-lifted.
 */
export function isEffectivelyClosed(status: StoreStatus, now: Date = new Date()): boolean {
  if (!status.isClosed) return false;
  if (status.closedFrom && now < new Date(status.closedFrom)) return false;
  if (status.closedScope === "permanent") return true;
  if (!status.closedUntil) return true;
  return now < new Date(status.closedUntil);
}
