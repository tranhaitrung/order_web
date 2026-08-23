import pg from "pg";

const { Client } = pg;

const CATEGORIES = [
  { id: "tra-tra-sua", label: "Trà & Trà Sữa", sortOrder: 0 },
  { id: "cafe", label: "Café", sortOrder: 1 },
];

const TOPPINGS = [
  { id: "nha-dam", name: "Nha đam", price: 5000, sortOrder: 0 },
  { id: "tran-chau-trang", name: "Trân châu trắng", price: 5000, sortOrder: 1 },
  { id: "tran-chau-đen", name: "Trân châu đen", price: 7000, sortOrder: 2 },
];

const MENU_ITEMS = [
  { id: "tra-sua-thai-xanh", name: "Trà sữa Thái xanh", price: 20000, category: "tra-tra-sua", mustTry: true, imageSrc: "/menu/tra-thai-xanh.jpeg", sortOrder: 0 },
  { id: "tra-sua-truyen-thong", name: "Trà sữa truyền thống", price: 25000, category: "tra-tra-sua", mustTry: false, imageSrc: "/menu/tra-sua.jpeg", sortOrder: 1 },
  { id: "tra-tac", name: "Trà tắc", price: 15000, category: "tra-tra-sua", mustTry: false, imageSrc: "/menu/tra-tac.jpeg", sortOrder: 2 },
  { id: "tra-chanh", name: "Trà chanh", price: 15000, category: "tra-tra-sua", mustTry: true, imageSrc: "/menu/tra-chanh.jpeg", sortOrder: 3 },
  { id: "matcha-latte", name: "Matcha Latte", price: 30000, category: "tra-tra-sua", mustTry: false, imageSrc: "/menu/matcha-latte.jpeg", sortOrder: 4 },
  { id: "cold-brew", name: "Cold Brew", price: 30000, category: "cafe", mustTry: false, imageSrc: "/menu/cold-brew.jpeg", sortOrder: 5 },
  { id: "cold-brew-chanh-vang", name: "Cold Brew chanh vàng", price: 35000, category: "cafe", mustTry: true, imageSrc: "/menu/cold-brew-chanh-vang.jpeg", sortOrder: 6 },
  { id: "cafe-muoi", name: "Café muối", price: 30000, category: "cafe", mustTry: true, imageSrc: "/menu/cafe-muoi.jpeg", sortOrder: 7 },
  { id: "cafe-sua", name: "Café sữa", price: 25000, category: "cafe", mustTry: false, imageSrc: "/menu/cafe-sua.jpeg", sortOrder: 8 },
  { id: "bac-xiu", name: "Bạc Xỉu", price: 25000, category: "cafe", mustTry: false, imageSrc: "/menu/bac-xiu.jpeg", sortOrder: 9 },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL chưa được cấu hình");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const category of CATEGORIES) {
      await client.query(
        `INSERT INTO categories (id, label, sort_order) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order`,
        [category.id, category.label, category.sortOrder],
      );
    }

    for (const topping of TOPPINGS) {
      await client.query(
        `INSERT INTO toppings (id, name, price, sort_order) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, sort_order = EXCLUDED.sort_order`,
        [topping.id, topping.name, topping.price, topping.sortOrder],
      );
    }

    for (const item of MENU_ITEMS) {
      await client.query(
        `INSERT INTO menu_items (id, name, price, category_id, must_try, image_src, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           price = EXCLUDED.price,
           category_id = EXCLUDED.category_id,
           must_try = EXCLUDED.must_try,
           image_src = EXCLUDED.image_src,
           sort_order = EXCLUDED.sort_order`,
        [item.id, item.name, item.price, item.category, item.mustTry, item.imageSrc, item.sortOrder],
      );
    }

    console.log(`[seed] Đã nạp ${CATEGORIES.length} danh mục, ${TOPPINGS.length} topping, ${MENU_ITEMS.length} món`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("[seed] Thất bại:", error);
  process.exitCode = 1;
});
