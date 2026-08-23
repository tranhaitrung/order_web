import { getStoreStatus } from "@/lib/store-status-repository";
import { StoreStatusPanel } from "@/app/admin/settings/StoreStatusPanel";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const status = await getStoreStatus();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Nhận đơn hàng</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Tắt buổi này tự động mở lại vào khung giờ giao kế tiếp, tắt hôm nay tự động mở lại vào 0h ngày mai. Tắt
          vĩnh viễn cần bật lại thủ công.
        </p>
      </div>
      <StoreStatusPanel initialStatus={status} />
    </div>
  );
}
