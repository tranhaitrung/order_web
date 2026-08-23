import { pool } from "@/lib/db";

export interface OrderItemTopping {
  id: string;
  name: string;
  price: number;
}

export interface CreateOrderItemInput {
  itemId: string;
  itemName: string;
  quantity: number;
  sugarLevel: string;
  iceLevel: string;
  note?: string;
  toppings: OrderItemTopping[];
  lineTotal: number;
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliverySlot: string;
  total: number;
  items: CreateOrderItemInput[];
}

export interface CreatedOrder {
  id: string;
  createdAt: string;
}

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query<{ id: string; created_at: string }>(
      `INSERT INTO orders (customer_name, customer_phone, delivery_address, delivery_date, delivery_slot, total)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        input.customerName,
        input.customerPhone,
        input.deliveryAddress,
        input.deliveryDate,
        input.deliverySlot,
        input.total,
      ],
    );
    const order = orderResult.rows[0];

    for (const item of input.items) {
      await client.query(
        `INSERT INTO order_items (order_id, item_id, item_name, quantity, sugar_level, ice_level, note, toppings, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          order.id,
          item.itemId,
          item.itemName,
          item.quantity,
          item.sugarLevel,
          item.iceLevel,
          item.note ?? null,
          JSON.stringify(item.toppings),
          item.lineTotal,
        ],
      );
    }

    await client.query("COMMIT");
    return { id: order.id, createdAt: order.created_at };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export interface OrderItemRecord {
  itemName: string;
  quantity: number;
  sugarLevel: string;
  iceLevel: string;
  note: string | null;
  toppings: OrderItemTopping[];
  lineTotal: number;
}

interface OrderItemRow {
  order_id: string;
  item_name: string;
  quantity: number;
  sugar_level: string;
  ice_level: string;
  note: string | null;
  toppings: OrderItemTopping[];
  line_total: number;
}

async function attachItems<T extends { id: string }>(
  orders: T[],
): Promise<(T & { items: OrderItemRecord[] })[]> {
  if (orders.length === 0) return [];

  const orderIds = orders.map((order) => order.id);
  const itemsResult = await pool.query<OrderItemRow>(
    `SELECT order_id, item_name, quantity, sugar_level, ice_level, note, toppings, line_total
     FROM order_items WHERE order_id = ANY($1::uuid[]) ORDER BY id`,
    [orderIds],
  );

  const itemsByOrderId = new Map<string, OrderItemRecord[]>();
  for (const row of itemsResult.rows) {
    const items = itemsByOrderId.get(row.order_id) ?? [];
    items.push({
      itemName: row.item_name,
      quantity: row.quantity,
      sugarLevel: row.sugar_level,
      iceLevel: row.ice_level,
      note: row.note,
      toppings: row.toppings,
      lineTotal: row.line_total,
    });
    itemsByOrderId.set(row.order_id, items);
  }

  return orders.map((order) => ({ ...order, items: itemsByOrderId.get(order.id) ?? [] }));
}

export interface OrderRecord {
  id: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliverySlot: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItemRecord[];
}

export async function findOrdersByPhone(phone: string): Promise<OrderRecord[]> {
  const ordersResult = await pool.query<{
    id: string;
    delivery_address: string;
    delivery_date: string;
    delivery_slot: string;
    total: number;
    status: string;
    created_at: string;
  }>(
    `SELECT id, delivery_address, to_char(delivery_date, 'YYYY-MM-DD') AS delivery_date,
            delivery_slot, total, status, created_at
     FROM orders WHERE customer_phone = $1 ORDER BY created_at DESC`,
    [phone],
  );

  const withItems = await attachItems(ordersResult.rows);

  return withItems.map((row) => ({
    id: row.id,
    deliveryAddress: row.delivery_address,
    deliveryDate: row.delivery_date,
    deliverySlot: row.delivery_slot,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    items: row.items,
  }));
}

export interface AdminOrderRecord extends OrderRecord {
  customerName: string;
  customerPhone: string;
}

export async function findOrdersByDeliveryDate(date: string): Promise<AdminOrderRecord[]> {
  const ordersResult = await pool.query<{
    id: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    delivery_date: string;
    delivery_slot: string;
    total: number;
    status: string;
    created_at: string;
  }>(
    `SELECT id, customer_name, customer_phone, delivery_address,
            to_char(delivery_date, 'YYYY-MM-DD') AS delivery_date,
            delivery_slot, total, status, created_at
     FROM orders WHERE delivery_date = $1 ORDER BY created_at ASC`,
    [date],
  );

  const withItems = await attachItems(ordersResult.rows);

  return withItems.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryAddress: row.delivery_address,
    deliveryDate: row.delivery_date,
    deliverySlot: row.delivery_slot,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    items: row.items,
  }));
}

export interface PrepSummaryLine {
  itemId: string;
  itemName: string;
  toppingNames: string[];
  sugarLevel: string;
  iceLevel: string;
  quantity: number;
}

export async function getPrepSummaryForDate(date: string): Promise<PrepSummaryLine[]> {
  const result = await pool.query<{
    item_id: string;
    item_name: string;
    sugar_level: string;
    ice_level: string;
    toppings: OrderItemTopping[];
    quantity: number;
  }>(
    `SELECT oi.item_id, oi.item_name, oi.sugar_level, oi.ice_level, oi.toppings, oi.quantity
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.delivery_date = $1`,
    [date],
  );

  const groups = new Map<string, PrepSummaryLine>();
  for (const row of result.rows) {
    const toppingIds = row.toppings
      .map((t) => t.id)
      .sort()
      .join(",");
    const key = `${row.item_id}|${row.sugar_level}|${row.ice_level}|${toppingIds}`;

    const existing = groups.get(key);
    if (existing) {
      existing.quantity += row.quantity;
      continue;
    }

    groups.set(key, {
      itemId: row.item_id,
      itemName: row.item_name,
      toppingNames: row.toppings.map((t) => t.name),
      sugarLevel: row.sugar_level,
      iceLevel: row.ice_level,
      quantity: row.quantity,
    });
  }

  return Array.from(groups.values()).sort((a, b) => b.quantity - a.quantity);
}

export type RevenuePeriod = "day" | "week" | "month" | "year";

export interface RevenueBucket {
  periodStart: string;
  orderCount: number;
  totalRevenue: number;
}

const REVENUE_BUCKET_LIMIT: Record<RevenuePeriod, number> = {
  day: 30,
  week: 12,
  month: 12,
  year: 5,
};

/** Buckets on Vietnam local calendar days/weeks/months/years, not UTC. */
export async function getRevenueStats(period: RevenuePeriod): Promise<RevenueBucket[]> {
  const result = await pool.query<{ period_start: string; order_count: string; total_revenue: string }>(
    `SELECT
       to_char(date_trunc($1, created_at AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') AS period_start,
       COUNT(*) AS order_count,
       SUM(total) AS total_revenue
     FROM orders
     GROUP BY period_start
     ORDER BY period_start DESC
     LIMIT $2`,
    [period, REVENUE_BUCKET_LIMIT[period]],
  );

  return result.rows
    .map((row) => ({
      periodStart: row.period_start,
      orderCount: Number(row.order_count),
      totalRevenue: Number(row.total_revenue),
    }))
    .reverse();
}
