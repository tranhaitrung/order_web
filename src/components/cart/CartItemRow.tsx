"use client";

import { CartLine, lineTotal, lineUnitPrice } from "@/hooks/useCartStore";
import { useMenuData } from "@/hooks/useMenuData";
import { sugarIceLabel } from "@/lib/menu-data";
import { formatVnd } from "@/lib/format";

interface CartItemRowProps {
  line: CartLine;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemRow({ line, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { itemsById, toppingsById } = useMenuData();
  const item = itemsById.get(line.itemId);
  if (!item) return null;

  const toppingNames = line.toppingIds
    .map((id) => toppingsById.get(id)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="font-display text-base font-semibold text-ink">{item.name}</p>
        {toppingNames.length > 0 ? (
          <p className="mt-0.5 text-xs text-ink-soft">+ {toppingNames.join(", ")}</p>
        ) : null}
        <p className="mt-0.5 text-xs text-ink-soft">
          Đường: {sugarIceLabel(line.sugarLevel)} · Đá: {sugarIceLabel(line.iceLevel)}
        </p>
        {line.note ? <p className="mt-0.5 text-xs italic text-ink-soft">📝 {line.note}</p> : null}
        <p className="mt-1 text-xs text-ink-soft">
          {formatVnd(lineUnitPrice(line, itemsById, toppingsById))} / phần
        </p>
        <button
          onClick={() => onRemove(line.id)}
          className="mt-2 text-xs font-semibold text-error underline-offset-2 hover:underline"
        >
          Xoá
        </button>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-2 rounded-full border border-line px-1.5 py-1">
          <button
            aria-label="Giảm số lượng"
            onClick={() => onUpdateQuantity(line.id, line.quantity - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-base font-semibold text-primary hover:bg-primary-soft"
          >
            −
          </button>
          <span className="w-5 text-center text-sm font-semibold text-ink">{line.quantity}</span>
          <button
            aria-label="Tăng số lượng"
            onClick={() => onUpdateQuantity(line.id, Math.min(20, line.quantity + 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-base font-semibold text-primary hover:bg-primary-soft"
          >
            +
          </button>
        </div>
        <p className="text-sm font-bold text-ink">{formatVnd(lineTotal(line, itemsById, toppingsById))}</p>
      </div>
    </div>
  );
}
