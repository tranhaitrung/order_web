"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { deliverySlotLabel, DeliverySlotId, sugarIceLabel, SugarIceLevel } from "@/lib/menu-data";
import { formatDeliveryDateForMessage } from "@/lib/delivery";
import { formatVnd } from "@/lib/format";
import { Button } from "@/components/ui/Button";

const PHONE_PATTERN = /^0[35789][0-9]{8}$/;

interface OrderItemTopping {
  id: string;
  name: string;
  price: number;
}

interface OrderItem {
  itemName: string;
  sizeLabel: string | null;
  quantity: number;
  sugarLevel: SugarIceLevel;
  iceLevel: SugarIceLevel;
  note: string | null;
  toppings: OrderItemTopping[];
  lineTotal: number;
}

interface Order {
  id: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliverySlot: DeliverySlotId;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

function statusLabel(status: string): string {
  if (status === "confirmed") return "Đã xác nhận";
  if (status === "delivering") return "Đang giao";
  if (status === "completed") return "Hoàn tất";
  if (status === "cancelled") return "Đã huỷ";
  return "Đang xử lý";
}

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderLookupPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = phone.trim();

    if (!PHONE_PATTERN.test(trimmed)) {
      setError("Số điện thoại không hợp lệ");
      setOrders(null);
      return;
    }

    setError("");
    setLoading(true);
    setOrders(null);

    try {
      const response = await fetch(`/api/orders/lookup?phone=${encodeURIComponent(trimmed)}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.message ?? "Không tra cứu được đơn hàng, vui lòng thử lại.");
        return;
      }
      const body = (await response.json()) as { orders: Order[] };
      setOrders(body.orders);
    } catch {
      setError("Mất kết nối mạng, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8 pt-6">
      <div className="mb-4 flex justify-center">
        <Image src="/logo.png" alt="IT HOUSE" width={612} height={408} priority className="h-10 w-auto" />
      </div>

      <Link
        href="/"
        className="mb-4 flex w-fit items-center gap-1 text-sm font-semibold text-ink-soft hover:text-primary"
      >
        ← Về trang đặt hàng
      </Link>

      <h1 className="font-display text-2xl font-semibold text-ink">Tra cứu đơn hàng</h1>
      <p className="mt-1 text-sm text-ink-soft">Nhập số điện thoại bạn đã dùng khi đặt hàng.</p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-1.5">
        <div className="flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xxxxxxxx"
            inputMode="numeric"
            autoComplete="tel"
            className="flex-1 rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition-colors focus:border-primary"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Đang tìm…" : "Tra cứu"}
          </Button>
        </div>
        {error ? <span className="text-xs font-medium text-error">{error}</span> : null}
      </form>

      {orders ? (
        orders.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-soft">Không tìm thấy đơn hàng nào với số điện thoại này.</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-[var(--radius-md)] border border-line bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-soft">{formatCreatedAt(order.createdAt)}</span>
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-soft">
                          {item.itemName}
                          {item.sizeLabel ? ` (${item.sizeLabel})` : ""} x{item.quantity}
                          {item.toppings.length
                            ? ` (+${item.toppings.map((t) => t.name).join(", ")})`
                            : ""}
                        </span>
                        <span className="font-medium text-ink">{formatVnd(item.lineTotal)}</span>
                      </div>
                      <p className="text-xs text-ink-soft">
                        Đường: {sugarIceLabel(item.sugarLevel)} · Đá: {sugarIceLabel(item.iceLevel)}
                        {item.note ? ` · 📝 ${item.note}` : ""}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-sm font-semibold text-ink">Tổng cộng</span>
                  <span className="font-display text-base font-bold text-primary">{formatVnd(order.total)}</span>
                </div>

                <p className="mt-2 text-xs text-ink-soft">
                  🚚 {formatDeliveryDateForMessage(order.deliveryDate)} — {deliverySlotLabel(order.deliverySlot)}
                </p>
                <p className="text-xs text-ink-soft">📍 {order.deliveryAddress}</p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
