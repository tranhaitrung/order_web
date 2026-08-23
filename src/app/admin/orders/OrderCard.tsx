"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatVnd } from "@/lib/format";
import { deliverySlotLabel, DeliverySlotId, sugarIceLabel, SugarIceLevel } from "@/lib/menu-data";
import type { AdminOrderRecord, OrderStatus } from "@/lib/order-repository";
import { cn } from "@/lib/cn";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Chờ xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "border-ink-soft/30 bg-surface-alt text-ink-soft",
  completed: "border-primary/30 bg-primary-soft text-primary",
  cancelled: "border-error/30 bg-error-soft text-error",
};

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function OrderCard({ order }: { order: AdminOrderRecord }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [pending, setPending] = useState(false);

  async function changeStatus(next: OrderStatus) {
    if (next === status || pending) return;
    setPending(true);
    const previous = status;
    setStatus(next);

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        setStatus(previous);
      } else {
        router.refresh();
      }
    } catch {
      setStatus(previous);
    } finally {
      setPending(false);
    }
  }

  const isCancelled = status === "cancelled";

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-line bg-surface p-4",
        isCancelled && "opacity-60",
      )}
    >
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
        <span
          className={cn(
            "font-display text-base font-bold",
            isCancelled ? "text-ink-soft line-through" : "text-primary",
          )}
        >
          {formatVnd(order.total)}
        </span>
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

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((option) => (
          <button
            key={option}
            type="button"
            disabled={pending}
            onClick={() => changeStatus(option)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
              status === option
                ? STATUS_STYLE[option]
                : "border-line bg-surface text-ink-soft hover:border-primary/40",
            )}
          >
            {STATUS_LABEL[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
