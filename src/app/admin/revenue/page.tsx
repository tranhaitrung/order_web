import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatVnd } from "@/lib/format";
import { getRevenueStats, type RevenuePeriod } from "@/lib/order-repository";
import { PERIOD_OPTIONS, periodLabel } from "@/app/admin/revenue/period";
import { RevenueChart } from "@/app/admin/revenue/RevenueChart";
import { ManualRevenueManager } from "@/app/admin/revenue/ManualRevenueManager";

function resolvePeriod(raw: string | undefined): RevenuePeriod {
  return PERIOD_OPTIONS.some((option) => option.id === raw) ? (raw as RevenuePeriod) : "day";
}

export default async function AdminRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = resolvePeriod(rawPeriod);

  const buckets = await getRevenueStats(period);
  const totalRevenue = buckets.reduce((sum, b) => sum + b.totalRevenue, 0);
  const totalOrders = buckets.reduce((sum, b) => sum + b.orderCount, 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map((option) => {
          const isActive = option.id === period;
          return (
            <Link
              key={option.id}
              href={`/admin/revenue?period=${option.id}`}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "border border-line bg-surface text-ink-soft hover:border-primary/40",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <p className="text-sm text-ink-soft">
        {buckets.length} {PERIOD_OPTIONS.find((o) => o.id === period)?.label.toLowerCase()} gần nhất ·{" "}
        {totalOrders} đơn · Tổng {formatVnd(totalRevenue)}
      </p>

      {buckets.every((b) => b.totalRevenue === 0) ? (
        <p className="text-sm text-ink-soft">Chưa có dữ liệu doanh thu.</p>
      ) : (
        <RevenueChart period={period} buckets={buckets} />
      )}

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-3 py-2">Kỳ</th>
              <th className="px-3 py-2 text-right">Số đơn</th>
              <th className="px-3 py-2 text-right">Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {[...buckets].reverse().map((bucket) => (
              <tr key={bucket.periodStart} className="border-t border-line">
                <td className="px-3 py-2 font-medium text-ink">{periodLabel(period, bucket.periodStart)}</td>
                <td className="px-3 py-2 text-right text-ink-soft">{bucket.orderCount}</td>
                <td className="px-3 py-2 text-right font-semibold text-primary">
                  {formatVnd(bucket.totalRevenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ManualRevenueManager />
    </div>
  );
}
