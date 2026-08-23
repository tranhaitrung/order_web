import { pool } from "@/lib/db";
import type { Category, MenuItem, Topping } from "@/lib/menu-data";

export interface MenuData {
  categories: Category[];
  toppings: Topping[];
  items: MenuItem[];
}

interface MenuItemRow {
  id: string;
  name: string;
  price: number;
  category: string;
  must_try: boolean;
  image_src: string;
  is_sold_out: boolean;
}

const MENU_ITEM_COLUMNS = "id, name, price, category_id AS category, must_try, image_src, is_sold_out";

function mapMenuItemRow(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    category: row.category,
    mustTry: row.must_try,
    imageSrc: row.image_src,
    soldOut: row.is_sold_out,
  };
}

export async function listMenuData(): Promise<MenuData> {
  const [categoriesResult, toppingsResult, itemsResult] = await Promise.all([
    pool.query<Category>("SELECT id, label FROM categories ORDER BY sort_order"),
    pool.query<Topping>(
      "SELECT id, name, price FROM toppings WHERE is_active ORDER BY sort_order",
    ),
    pool.query<MenuItemRow>(
      `SELECT ${MENU_ITEM_COLUMNS} FROM menu_items WHERE is_active ORDER BY sort_order`,
    ),
  ]);

  return {
    categories: categoriesResult.rows,
    toppings: toppingsResult.rows,
    items: itemsResult.rows.map(mapMenuItemRow),
  };
}

/** Excludes sold-out items — used to validate cart contents before an order is accepted. */
export async function findMenuItemsByIds(ids: string[]): Promise<Map<string, MenuItem>> {
  if (ids.length === 0) return new Map();

  const result = await pool.query<MenuItemRow>(
    `SELECT ${MENU_ITEM_COLUMNS} FROM menu_items WHERE id = ANY($1) AND is_active AND NOT is_sold_out`,
    [ids],
  );

  return new Map(result.rows.map((row) => [row.id, mapMenuItemRow(row)]));
}

export async function findToppingsByIds(ids: string[]): Promise<Map<string, Topping>> {
  if (ids.length === 0) return new Map();

  const result = await pool.query<Topping>(
    "SELECT id, name, price FROM toppings WHERE id = ANY($1) AND is_active",
    [ids],
  );

  return new Map(result.rows.map((row) => [row.id, row]));
}

export async function setMenuItemSoldOut(id: string, soldOut: boolean): Promise<void> {
  await pool.query("UPDATE menu_items SET is_sold_out = $1 WHERE id = $2", [soldOut, id]);
}
