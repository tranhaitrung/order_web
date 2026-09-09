import { pool } from "@/lib/db";

export interface CustomerRecord {
  name: string;
  address: string;
}

/** Called after every successful order — keeps the customer's latest name/address up to date. */
export async function upsertCustomer(phone: string, name: string, address: string): Promise<void> {
  await pool.query(
    `INSERT INTO customers (phone, name, address, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (phone) DO UPDATE SET name = excluded.name, address = excluded.address, updated_at = now()`,
    [phone, name, address],
  );
}

export async function findCustomerByPhone(phone: string): Promise<CustomerRecord | null> {
  const result = await pool.query<CustomerRecord>("SELECT name, address FROM customers WHERE phone = $1", [phone]);
  return result.rows[0] ?? null;
}
