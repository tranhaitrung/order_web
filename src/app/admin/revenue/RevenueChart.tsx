import { formatVnd } from "@/lib/format";
import type { RevenueBucket, RevenuePeriod } from "@/lib/order-repository";
import { periodLabel } from "@/app/admin/revenue/period";

const CHART_HEIGHT = 160;
const BAR_WIDTH = 28;
const BAR_GAP = 10;

export function RevenueChart({ period, buckets }: { period: RevenuePeriod; buckets: RevenueBucket[] }) {
  const maxRevenue = Math.max(1, ...buckets.map((b) => b.totalRevenue));
  const chartWidth = buckets.length * (BAR_WIDTH + BAR_GAP);

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-line bg-surface p-4">
      <svg
        role="img"
        aria-label="Biểu đồ doanh thu theo thời gian"
        width={chartWidth}
        height={CHART_HEIGHT + 28}
        viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT + 28}`}
      >
        {buckets.map((bucket, index) => {
          const barHeight = Math.max(2, (bucket.totalRevenue / maxRevenue) * CHART_HEIGHT);
          const x = index * (BAR_WIDTH + BAR_GAP);
          const y = CHART_HEIGHT - barHeight;

          return (
            <g key={bucket.periodStart}>
              <rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barHeight}
                rx={4}
                fill="var(--color-primary)"
                opacity={bucket.totalRevenue === 0 ? 0.15 : 1}
              >
                <title>
                  {periodLabel(period, bucket.periodStart)}: {formatVnd(bucket.totalRevenue)} ({bucket.orderCount}{" "}
                  đơn)
                </title>
              </rect>
              <text
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT + 16}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-ink-soft)"
              >
                {periodLabel(period, bucket.periodStart, true)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
