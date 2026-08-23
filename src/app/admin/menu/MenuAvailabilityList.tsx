"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Category, MenuItem } from "@/lib/menu-data";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/cn";

export function MenuAvailabilityList({ categories, items }: { categories: Category[]; items: MenuItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [soldOutById, setSoldOutById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.soldOut])),
  );

  async function toggle(item: MenuItem) {
    const nextSoldOut = !soldOutById[item.id];
    setPendingId(item.id);
    setSoldOutById((current) => ({ ...current, [item.id]: nextSoldOut }));

    try {
      const response = await fetch(`/api/admin/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soldOut: nextSoldOut }),
      });
      if (!response.ok) {
        setSoldOutById((current) => ({ ...current, [item.id]: !nextSoldOut }));
      } else {
        router.refresh();
      }
    } catch {
      setSoldOutById((current) => ({ ...current, [item.id]: !nextSoldOut }));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {categories.map((category) => (
        <section key={category.id}>
          <h2 className="font-display text-lg font-semibold text-ink">{category.label}</h2>
          <div className="mt-3 flex flex-col gap-2">
            {items
              .filter((item) => item.category === category.id)
              .map((item) => {
                const soldOut = soldOutById[item.id];
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-surface px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink">{item.name}</p>
                      <p className="text-xs text-ink-soft">{formatVnd(item.price)}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!soldOut}
                      disabled={pendingId === item.id}
                      onClick={() => toggle(item)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
                        soldOut
                          ? "border-error/30 bg-error-soft text-error"
                          : "border-primary/30 bg-primary-soft text-primary",
                      )}
                    >
                      {soldOut ? "Hết hàng" : "Còn hàng"}
                    </button>
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
