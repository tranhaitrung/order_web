import Link from "next/link";
import { dateKeyToDate, formatDeliveryDateForMessage, nowInVietnam, toDateKey } from "@/lib/delivery";
import { formatVnd } from "@/lib/format";
import { sugarIceLabel, SugarIceLevel } from "@/lib/menu-data";
import { findOrdersByDeliveryDate, getPrepSummaryForDate } from "@/lib/order-repository";
import { Button } from "@/components/ui/Button";
import { OrderCard } from "@/app/admin/orders/OrderCard";

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

  const billableOrders = orders.filter((order) => order.status !== "cancelled");
  const totalRevenue = billableOrders.reduce((sum, order) => sum + order.total, 0);
  const cancelledCount = orders.length - billableOrders.length;

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
        {cancelledCount > 0 ? ` (đã trừ ${cancelledCount} đơn huỷ)` : ""}
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
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Đường / Đá</th>
                  <th className="px-3 py-2">Topping</th>
                  <th className="px-3 py-2 text-right">Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((line, index) => (
                  <tr key={index} className="border-t border-line">
                    <td className="px-3 py-2 font-medium text-ink">{line.itemName}</td>
                    <td className="px-3 py-2 text-ink-soft">{line.sizeLabel || "—"}</td>
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
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
