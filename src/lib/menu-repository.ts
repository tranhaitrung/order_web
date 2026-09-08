import { pool } from "@/lib/db";
import type { Category, MenuItem, MenuItemSize, Topping } from "@/lib/menu-data";
import { slugify } from "@/lib/slug";

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
  sizes: MenuItemSize[] | null;
}

// Correlated subquery aggregating each item's optional sizes as JSON. Queries using this must
// alias the menu_items table as `mi` so `mi.id` here unambiguously means the outer item's id
// (unqualified `id` risked resolving to menu_item_sizes.id — a UUID — causing a text = uuid error).
const MENU_ITEM_SIZES_JSON = `COALESCE((
  SELECT json_agg(json_build_object('id', s.id, 'label', s.label, 'price', s.price) ORDER BY s.sort_order)
  FROM menu_item_sizes s
  WHERE s.menu_item_id = mi.id
), '[]'::json)`;

const MENU_ITEM_COLUMNS = `mi.id, mi.name, mi.price, mi.category_id AS category, mi.must_try, mi.image_src, mi.is_sold_out, ${MENU_ITEM_SIZES_JSON} AS sizes`;

function mapMenuItemRow(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    category: row.category,
    mustTry: row.must_try,
    imageSrc: row.image_src,
    soldOut: row.is_sold_out,
    sizes: row.sizes ?? [],
  };
}

export async function listMenuData(): Promise<MenuData> {
  const [categoriesResult, toppingsResult, itemsResult] = await Promise.all([
    pool.query<Category>("SELECT id, label FROM categories ORDER BY sort_order"),
    pool.query<Topping>(
      "SELECT id, name, price FROM toppings WHERE is_active ORDER BY sort_order",
    ),
    pool.query<MenuItemRow>(
      `SELECT ${MENU_ITEM_COLUMNS} FROM menu_items mi WHERE mi.is_active ORDER BY mi.sort_order`,
    ),
  ]);

  return {
    categories: categoriesResult.rows,
    toppings: toppingsResult.rows,
    items: itemsResult.rows.map(mapMenuItemRow),
  };
}

export async function getMenuItemById(id: string): Promise<MenuItem | null> {
  const result = await pool.query<MenuItemRow>(
    `SELECT ${MENU_ITEM_COLUMNS} FROM menu_items mi WHERE mi.id = $1`,
    [id],
  );
  return result.rows[0] ? mapMenuItemRow(result.rows[0]) : null;
}

/** Excludes sold-out items — used to validate cart contents before an order is accepted. */
export async function findMenuItemsByIds(ids: string[]): Promise<Map<string, MenuItem>> {
  if (ids.length === 0) return new Map();

  const result = await pool.query<MenuItemRow>(
    `SELECT ${MENU_ITEM_COLUMNS} FROM menu_items mi WHERE mi.id = ANY($1) AND mi.is_active AND NOT mi.is_sold_out`,
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

export interface MenuItemSizeInput {
  label: string;
  price: number;
}

/** Deletes and re-inserts all sizes for a menu item, in the given order. */
async function replaceMenuItemSizes(menuItemId: string, sizes: MenuItemSizeInput[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM menu_item_sizes WHERE menu_item_id = $1", [menuItemId]);

    for (let i = 0; i < sizes.length; i += 1) {
      await client.query(
        `INSERT INTO menu_item_sizes (menu_item_id, label, price, sort_order) VALUES ($1, $2, $3, $4)`,
        [menuItemId, sizes[i].label.trim(), sizes[i].price, i],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export interface UpdateMenuItemInput {
  name?: string;
  price?: number;
  category?: string;
  imageSrc?: string;
  mustTry?: boolean;
  soldOut?: boolean;
  /** When provided (including an empty array), fully replaces the item's sizes. */
  sizes?: MenuItemSizeInput[];
}

export async function updateMenuItem(id: string, input: UpdateMenuItemInput): Promise<MenuItem | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(input.name.trim());
  }
  if (input.price !== undefined) {
    fields.push(`price = $${index++}`);
    values.push(input.price);
  }
  if (input.category !== undefined) {
    fields.push(`category_id = $${index++}`);
    values.push(input.category);
  }
  if (input.imageSrc !== undefined) {
    fields.push(`image_src = $${index++}`);
    values.push(input.imageSrc.trim());
  }
  if (input.mustTry !== undefined) {
    fields.push(`must_try = $${index++}`);
    values.push(input.mustTry);
  }
  if (input.soldOut !== undefined) {
    fields.push(`is_sold_out = $${index++}`);
    values.push(input.soldOut);
  }

  if (fields.length > 0) {
    values.push(id);
    const result = await pool.query(`UPDATE menu_items SET ${fields.join(", ")} WHERE id = $${index}`, values);
    if (result.rowCount === 0) return null;
  } else {
    const exists = await pool.query("SELECT 1 FROM menu_items WHERE id = $1", [id]);
    if (exists.rowCount === 0) return null;
  }

  if (input.sizes !== undefined) {
    await replaceMenuItemSizes(id, input.sizes);
  }

  return getMenuItemById(id);
}

/** Slugifies `name` and appends `-2`, `-3`, … until the id is free in `table`. */
async function generateUniqueId(table: "menu_items" | "toppings", name: string): Promise<string> {
  const base = slugify(name) || "item";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const result = await pool.query(`SELECT 1 FROM ${table} WHERE id = $1`, [candidate]);
    if (result.rowCount === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export interface CreateMenuItemInput {
  name: string;
  price: number;
  category: string;
  imageSrc: string;
  mustTry?: boolean;
  sizes?: MenuItemSizeInput[];
}

export async function createMenuItem(input: CreateMenuItemInput): Promise<MenuItem> {
  const id = await generateUniqueId("menu_items", input.name);

  const sortOrderResult = await pool.query<{ next: number }>(
    "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM menu_items",
  );
  const sortOrder = sortOrderResult.rows[0].next;

  await pool.query(
    `INSERT INTO menu_items (id, name, price, category_id, must_try, image_src, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, input.name.trim(), input.price, input.category, input.mustTry ?? false, input.imageSrc.trim(), sortOrder],
  );

  if (input.sizes && input.sizes.length > 0) {
    await replaceMenuItemSizes(id, input.sizes);
  }

  const item = await getMenuItemById(id);
  if (!item) throw new Error("Không tạo được món");
  return item;
}

export interface CreateToppingInput {
  name: string;
  price: number;
}

export async function createTopping(input: CreateToppingInput): Promise<Topping> {
  const id = await generateUniqueId("toppings", input.name);

  const sortOrderResult = await pool.query<{ next: number }>(
    "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM toppings",
  );
  const sortOrder = sortOrderResult.rows[0].next;

  const result = await pool.query<Topping>(
    `INSERT INTO toppings (id, name, price, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, price`,
    [id, input.name.trim(), input.price, sortOrder],
  );

  return result.rows[0];
}

export interface UpdateToppingInput {
  name?: string;
  price?: number;
}

export async function updateTopping(id: string, input: UpdateToppingInput): Promise<Topping | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(input.name.trim());
  }
  if (input.price !== undefined) {
    fields.push(`price = $${index++}`);
    values.push(input.price);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await pool.query<Topping>(
    `UPDATE toppings SET ${fields.join(", ")} WHERE id = $${index} RETURNING id, name, price`,
    values,
  );

  return result.rows[0] ?? null;
}
