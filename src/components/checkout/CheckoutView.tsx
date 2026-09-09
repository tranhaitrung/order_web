"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { CartLine, cartTotal, lineTotal } from "@/hooks/useCartStore";
import { useMenuData } from "@/hooks/useMenuData";
import {
  buildDeliveryDateOptions,
  firstAvailableSlotForDate,
  isDeliverySlotAvailable,
  pickDefaultDelivery,
} from "@/lib/delivery";
import { DELIVERY_SLOTS, DeliverySlotId, sugarIceLabel } from "@/lib/menu-data";
import { formatVnd } from "@/lib/format";
import { loadLastCustomer } from "@/lib/customer-storage";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const PHONE_PATTERN = /^0[35789][0-9]{8}$/;

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliverySlot: DeliverySlotId;
}

interface CheckoutViewProps {
  lines: CartLine[];
  onBack: () => void;
  onSubmit: (payload: CheckoutPayload) => Promise<void>;
  submitting: boolean;
}

export function CheckoutView({ lines, onBack, onSubmit, submitting }: CheckoutViewProps) {
  const { itemsById, toppingsById } = useMenuData();
  // Lazy-initialized from the last successful order on this device/browser — a convenience, not an account system.
  const [name, setName] = useState(() => loadLastCustomer()?.customerName ?? "");
  const [phone, setPhone] = useState(() => loadLastCustomer()?.customerPhone ?? "");
  const [address, setAddress] = useState(() => loadLastCustomer()?.deliveryAddress ?? "");
  const [delivery, setDelivery] = useState(() => pickDefaultDelivery());
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "found" | "not-found">("idle");
  const total = cartTotal(lines, itemsById, toppingsById);

  const dateOptions = useMemo(() => buildDeliveryDateOptions(), []);

  async function handlePhoneBlur() {
    const trimmed = phone.trim();
    if (!PHONE_PATTERN.test(trimmed)) return;

    setLookupStatus("loading");
    try {
      const response = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        setLookupStatus("idle");
        return;
      }
      const body = (await response.json()) as { customer: { name: string; address: string } | null };
      if (body.customer) {
        setName(body.customer.name);
        setAddress(body.customer.address);
        setLookupStatus("found");
      } else {
        setLookupStatus("not-found");
      }
    } catch {
      setLookupStatus("idle");
    }
  }

  function selectDate(dateKey: string) {
    const nextSlot = isDeliverySlotAvailable(dateKey, delivery.slot)
      ? delivery.slot
      : firstAvailableSlotForDate(dateKey);
    setDelivery({ dateKey, slot: nextSlot ?? delivery.slot });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: { name?: string; phone?: string; address?: string } = {};
    if (name.trim().length === 0) nextErrors.name = "Vui lòng nhập tên";
    if (!PHONE_PATTERN.test(phone.trim())) nextErrors.phone = "Số điện thoại không hợp lệ";
    if (address.trim().length === 0) nextErrors.address = "Vui lòng nhập địa chỉ giao hàng";
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    void onSubmit({
      customerName: name.trim(),
      customerPhone: phone.trim(),
      deliveryAddress: address.trim(),
      deliveryDate: delivery.dateKey,
      deliverySlot: delivery.slot,
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8 pt-6">
      <div className="mb-4 flex justify-center">
        <Image src="/logo.png" alt="IT HOUSE" width={612} height={408} priority className="h-10 w-auto" />
      </div>

      <button
        onClick={onBack}
        className="mb-4 flex w-fit items-center gap-1 text-sm font-semibold text-ink-soft hover:text-primary"
      >
        ← Quay lại giỏ hàng
      </button>

      <h1 className="font-display text-2xl font-semibold text-ink">Xác nhận đơn hàng</h1>

      <div className="mt-4 rounded-[var(--radius-md)] border border-line bg-surface p-4">
        {lines.map((line) => {
          const item = itemsById.get(line.itemId);
          if (!item) return null;
          const sizeLabel = item.sizes.find((size) => size.id === line.sizeId)?.label;
          const toppingNames = line.toppingIds
            .map((id) => toppingsById.get(id)?.name)
            .filter((n): n is string => Boolean(n));
          return (
            <div key={line.id} className="py-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">
                  {item.name}
                  {sizeLabel ? ` (${sizeLabel})` : ""} x{line.quantity}
                  {toppingNames.length ? ` (+${toppingNames.join(", ")})` : ""}
                </span>
                <span className="font-medium text-ink">
                  {formatVnd(lineTotal(line, itemsById, toppingsById))}
                </span>
              </div>
              <p className="text-xs text-ink-soft">
                Đường: {sugarIceLabel(line.sugarLevel)} · Đá: {sugarIceLabel(line.iceLevel)}
                {line.note ? ` · 📝 ${line.note}` : ""}
              </p>
            </div>
          );
        })}
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
          <span className="text-sm font-semibold text-ink">Tổng cộng</span>
          <span className="font-display text-lg font-bold text-primary">{formatVnd(total)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Tên của bạn</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition-colors focus:border-primary"
            autoComplete="name"
          />
          {errors.name ? <span className="text-xs font-medium text-error">{errors.name}</span> : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Số điện thoại</span>
          <input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setLookupStatus("idle");
            }}
            onBlur={handlePhoneBlur}
            placeholder="09xxxxxxxx"
            inputMode="numeric"
            autoComplete="tel"
            className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition-colors focus:border-primary"
          />
          {errors.phone ? <span className="text-xs font-medium text-error">{errors.phone}</span> : null}
          {!errors.phone && lookupStatus === "loading" ? (
            <span className="text-xs text-ink-soft">Đang tìm thông tin đã lưu…</span>
          ) : null}
          {!errors.phone && lookupStatus === "found" ? (
            <span className="text-xs font-medium text-primary">Đã tự điền thông tin từ lần đặt trước.</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Địa chỉ giao hàng</span>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Số nhà, đường, phường/xã, quận/huyện"
            rows={2}
            className="resize-none rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition-colors focus:border-primary"
            autoComplete="street-address"
          />
          {errors.address ? <span className="text-xs font-medium text-error">{errors.address}</span> : null}
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Ngày giao hàng</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dateOptions.map((option) => {
              const isActive = option.dateKey === delivery.dateKey;
              return (
                <button
                  key={option.dateKey}
                  type="button"
                  disabled={!option.hasAvailableSlot}
                  onClick={() => selectDate(option.dateKey)}
                  className={cn(
                    "flex shrink-0 flex-col items-center rounded-[var(--radius-sm)] border px-3.5 py-2 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    isActive
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface text-ink-soft hover:border-primary/40",
                  )}
                >
                  <span className="text-sm font-semibold">{option.primary}</span>
                  <span className="text-xs opacity-80">{option.secondary}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Thời gian giao hàng</span>
          <div className="grid grid-cols-2 gap-2">
            {DELIVERY_SLOTS.map((option) => {
              const isActive = option.id === delivery.slot;
              const isAvailable = isDeliverySlotAvailable(delivery.dateKey, option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setDelivery((current) => ({ ...current, slot: option.id }))}
                  className={cn(
                    "rounded-[var(--radius-sm)] border px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    isActive
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface text-ink-soft hover:border-primary/40",
                  )}
                >
                  {option.label}
                  {!isAvailable ? <span className="mt-0.5 block text-xs font-normal">Đã qua giờ nhận</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <Button type="submit" className="mt-2 w-full" disabled={submitting}>
          {submitting ? "Đang gửi đơn…" : `Đặt hàng — ${formatVnd(total)}`}
        </Button>
      </form>
    </div>
  );
}
