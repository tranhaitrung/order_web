import { listMenuData } from "@/lib/menu-repository";
import { MenuAvailabilityList } from "@/app/admin/menu/MenuAvailabilityList";
import { CreateMenuItemForm } from "@/app/admin/menu/CreateMenuItemForm";
import { ToppingsManager } from "@/app/admin/menu/ToppingsManager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const { categories, items, toppings } = await listMenuData();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Quản lý món</h2>
        <p className="mt-1 text-sm text-ink-soft">Đánh dấu món hết hàng — khách vẫn thấy món nhưng không đặt được.</p>
        <div className="mt-4">
          <MenuAvailabilityList categories={categories} items={items} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Thêm món mới</h2>
        <p className="mt-1 text-sm text-ink-soft">Dán link ảnh món (URL) — ảnh sẽ hiển thị trực tiếp cho khách.</p>
        <CreateMenuItemForm categories={categories} />
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Topping</h2>
        <p className="mt-1 text-sm text-ink-soft">Danh sách topping hiện có và tạo topping mới.</p>
        <ToppingsManager toppings={toppings} />
      </section>
    </div>
  );
}
