import Link from "next/link";
import { dateKeyToDate, formatDeliveryDateForMessage, nowInVietnam, toDateKey } from "@/lib/delivery";
import { formatVnd } from "@/lib/format";
import { deliverySlotLabel, DeliverySlotId, sugarIceLabel, SugarIceLevel } from "@/lib/menu-data";
import { findOrdersByDeliveryDate, getPrepSummaryForDate } from "@/lib/order-repository";
import { Button } from "@/components/ui/Button";

function resolveDate(raw: string | undefined): string {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && dateKeyToDate(raw)) return raw;
  return toDateKey(nowInVietnam());
}

function shiftDate(dateKey: string, days: number): string {
  const date = dateKeyToDate(dateKey);
  if (!date) return dateKey;
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: rawDate } = await searchParams;
  const date = resolveDate(rawDate);

  const [orders, summary] = await Promise.all([
    findOrdersByDeliveryDate(date),
    getPrepSummaryForDate(date),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/orders?date=${shiftDate(date, -1)}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft hover:border-primary/40 hover:text-primary"
          aria-label="Ngày trước"
        >
          ←
        </Link>
        <form className="flex flex-1 items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="flex-1 rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
          />
          <Button type="submit" className="px-4 py-2.5 text-sm">
            Xem
          </Button>
        </form>
        <Link
          href={`/admin/orders?date=${shiftDate(date, 1)}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft hover:border-primary/40 hover:text-primary"
          aria-label="Ngày sau"
        >
          →
        </Link>
      </div>

      <p className="text-sm text-ink-soft">
        {formatDeliveryDateForMessage(date)} · {orders.length} đơn · {formatVnd(totalRevenue)}
      </p>

      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Tổng hợp cần làm</h2>
        {summary.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Chưa có đơn nào cho ngày này.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-[var(--radius-md)] border border-line">
            <table className="w-full text-sm">
              <thead className="bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-3 py-2">Món</th>
                  <th className="px-3 py-2">Đường / Đá</th>
                  <th className="px-3 py-2">Topping</th>
                  <th className="px-3 py-2 text-right">Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((line, index) => (
                  <tr key={index} className="border-t border-line">
                    <td className="px-3 py-2 font-medium text-ink">{line.itemName}</td>
                    <td className="px-3 py-2 text-ink-soft">
                      {sugarIceLabel(line.sugarLevel as SugarIceLevel)} /{" "}
                      {sugarIceLabel(line.iceLevel as SugarIceLevel)}
                    </td>
                    <td className="px-3 py-2 text-ink-soft">{line.toppingNames.join(", ") || "—"}</td>
                    <td className="px-3 py-2 text-right font-display text-base font-bold text-primary">
                      {line.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Danh sách đơn hàng</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Chưa có đơn nào cho ngày này.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-[var(--radius-md)] border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">
                      {order.customerName} · {order.customerPhone}
                    </p>
                    <p className="text-xs text-ink-soft">
                      Đặt lúc {formatCreatedAt(order.createdAt)} · Giao{" "}
                      {deliverySlotLabel(order.deliverySlot as DeliverySlotId)}
                    </p>
                  </div>
                  <span className="font-display text-base font-bold text-primary">{formatVnd(order.total)}</span>
                </div>

                <div className="mt-2 flex flex-col gap-1">
                  {order.items.map((item, index) => (
                    <p key={index} className="text-sm text-ink-soft">
                      {item.itemName} x{item.quantity}
                      {item.toppings.length ? ` (+${item.toppings.map((t) => t.name).join(", ")})` : ""} —{" "}
                      {sugarIceLabel(item.sugarLevel as SugarIceLevel)} /{" "}
                      {sugarIceLabel(item.iceLevel as SugarIceLevel)}
                      {item.note ? ` · 📝 ${item.note}` : ""}
                    </p>
                  ))}
                </div>

                <p className="mt-2 text-xs text-ink-soft">📍 {order.deliveryAddress}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
