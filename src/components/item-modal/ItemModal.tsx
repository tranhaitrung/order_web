"use client";

import { useState } from "react";
import Image from "next/image";
import { DEFAULT_SUGAR_ICE_LEVEL, MenuItem, SUGAR_ICE_LEVELS, SugarIceLevel } from "@/lib/menu-data";
import { useMenuData } from "@/hooks/useMenuData";
import { formatVnd } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const NOTE_MAX_LENGTH = 200;

interface ItemModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (payload: {
    quantity: number;
    sizeId?: string;
    toppingIds: string[];
    sugarLevel: SugarIceLevel;
    iceLevel: SugarIceLevel;
    note?: string;
  }) => void;
}

function SizePicker({
  sizes,
  value,
  onChange,
}: {
  sizes: MenuItem["sizes"];
  value: string;
  onChange: (sizeId: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">Size</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {sizes.map((size) => {
          const isActive = size.id === value;
          return (
            <button
              key={size.id}
              type="button"
              onClick={() => onChange(size.id)}
              className={cn(
                "flex flex-col items-center rounded-[var(--radius-sm)] border px-2 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-ink-soft hover:border-primary/40",
              )}
            >
              <span>{size.label}</span>
              <span className={cn("text-xs", isActive ? "text-white/90" : "text-ink-soft")}>
                {formatVnd(size.price)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LevelPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SugarIceLevel;
  onChange: (level: SugarIceLevel) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {SUGAR_ICE_LEVELS.map((level) => {
          const isActive = level.id === value;
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onChange(level.id)}
              className={cn(
                "rounded-[var(--radius-sm)] border px-2 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-ink-soft hover:border-primary/40",
              )}
            >
              {level.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ItemModal({ item, onClose, onAddToCart }: ItemModalProps) {
  const { toppings } = useMenuData();
  const [quantity, setQuantity] = useState(1);
  const [sizeId, setSizeId] = useState<string>(item.sizes[0]?.id ?? "");
  const [toppingIds, setToppingIds] = useState<string[]>([]);
  const [sugarLevel, setSugarLevel] = useState<SugarIceLevel>(DEFAULT_SUGAR_ICE_LEVEL);
  const [iceLevel, setIceLevel] = useState<SugarIceLevel>(DEFAULT_SUGAR_ICE_LEVEL);
  const [note, setNote] = useState("");

  const basePrice = item.sizes.length > 0 ? (item.sizes.find((s) => s.id === sizeId)?.price ?? item.sizes[0].price) : item.price;
  const toppingsPrice = toppingIds.reduce(
    (sum, id) => sum + (toppings.find((t) => t.id === id)?.price ?? 0),
    0,
  );
  const subtotal = (basePrice + toppingsPrice) * quantity;

  function toggleTopping(id: string) {
    setToppingIds((current) => (current.includes(id) ? current.filter((t) => t !== id) : [...current, id]));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-200"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
        className="relative z-10 flex max-h-[88vh] w-full max-w-md flex-col rounded-t-[var(--radius-lg)] bg-surface shadow-[var(--shadow-float)] animate-[slide-up_var(--duration-normal)_var(--ease-out-expo)] sm:rounded-[var(--radius-lg)]"
      >
        <div className="relative shrink-0">
          <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-t-[var(--radius-lg)] bg-surface-alt">
            <Image
              src={item.imageSrc}
              alt={item.name}
              width={1152}
              height={805}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="absolute right-4 top-4 rounded-full bg-surface/90 p-2 text-ink-soft shadow-sm backdrop-blur-sm transition-colors hover:bg-primary-soft hover:text-primary"
          >
            ✕
          </button>
        </div>

        <div className="flex shrink-0 items-start justify-between gap-4 p-6 pb-4">
          <div>
            <h2 id="item-modal-title" className="font-display text-xl font-semibold text-ink">
              {item.name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-primary">{formatVnd(basePrice)}</p>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6">
          {item.sizes.length > 0 ? <SizePicker sizes={item.sizes} value={sizeId} onChange={setSizeId} /> : null}

          <div>
            <p className="text-sm font-semibold text-ink">Topping</p>
            <div className="mt-2 flex flex-col gap-2">
              {toppings.map((topping) => (
                <label
                  key={topping.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-[var(--radius-sm)] border px-3 py-2.5 transition-colors",
                    toppingIds.includes(topping.id)
                      ? "border-primary bg-primary-soft"
                      : "border-line bg-surface hover:border-primary/40",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={toppingIds.includes(topping.id)}
                      onChange={() => toggleTopping(topping.id)}
                      className="h-4 w-4 accent-[var(--color-primary)]"
                    />
                    {topping.name}
                  </span>
                  <span className="text-sm font-medium text-ink-soft">+{formatVnd(topping.price)}</span>
                </label>
              ))}
            </div>
          </div>

          <LevelPicker label="Lượng đường" value={sugarLevel} onChange={setSugarLevel} />
          <LevelPicker label="Lượng đá" value={iceLevel} onChange={setIceLevel} />

          <label className="block">
            <p className="text-sm font-semibold text-ink">Ghi chú (không bắt buộc)</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
              placeholder="VD: ít ngọt giúp em, không lấy ống hút..."
              rows={2}
              className="mt-2 w-full resize-none rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
            />
            <span className="mt-1 block text-right text-xs text-ink-soft">
              {note.length}/{NOTE_MAX_LENGTH}
            </span>
          </label>

          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-semibold text-ink">Số lượng</p>
            <div className="flex items-center gap-3 rounded-full border border-line px-2 py-1">
              <button
                aria-label="Giảm số lượng"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold text-primary transition-colors hover:bg-primary-soft disabled:opacity-40"
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-semibold text-ink">{quantity}</span>
              <button
                aria-label="Tăng số lượng"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold text-primary transition-colors hover:bg-primary-soft"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 p-6 pt-4">
          <Button
            className="w-full"
            onClick={() => {
              onAddToCart({
                quantity,
                sizeId: item.sizes.length > 0 ? sizeId : undefined,
                toppingIds,
                sugarLevel,
                iceLevel,
                note: note.trim() || undefined,
              });
              onClose();
            }}
          >
            Thêm vào giỏ — {formatVnd(subtotal)}
          </Button>
        </div>
      </div>
    </div>
  );
}
