import { listMenuData } from "@/lib/menu-repository";
import { MenuAvailabilityList } from "@/app/admin/menu/MenuAvailabilityList";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const { categories, items } = await listMenuData();

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="font-display text-lg font-semibold text-ink">Quản lý món</h2>
      <p className="mt-1 text-sm text-ink-soft">Đánh dấu món hết hàng — khách vẫn thấy món nhưng không đặt được.</p>
      <div className="mt-4">
        <MenuAvailabilityList categories={categories} items={items} />
      </div>
    </div>
  );
}
