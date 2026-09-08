"use client";

import { FormEvent, useState } from "react";
import { Topping } from "@/lib/menu-data";
import { formatVnd } from "@/lib/format";
import { Button } from "@/components/ui/Button";

function EditToppingForm({
  topping,
  onCancel,
  onSaved,
}: {
  topping: Topping;
  onCancel: () => void;
  onSaved: (updated: Topping) => void;
}) {
  const [name, setName] = useState(topping.name);
  const [price, setPrice] = useState(String(topping.price));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const priceNumber = Number(price);
    if (!name.trim()) {
      setError("Vui lòng nhập tên topping");
      return;
    }
    if (!Number.isInteger(priceNumber) || priceNumber < 0) {
      setError("Giá không hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/toppings/${topping.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), price: priceNumber }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.message ?? "Không lưu được, vui lòng thử lại.");
        return;
      }

      const body = (await response.json()) as { topping: Topping };
      onSaved(body.topping);
    } catch {
      setError("Mất kết nối mạng, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Tên topping</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Giá (đ)</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
      </div>
      {error ? <span className="text-xs font-medium text-error">{error}</span> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting} className="w-fit">
          {submitting ? "Đang lưu…" : "Lưu"}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-surface-alt disabled:opacity-60"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

export function ToppingsManager({ toppings: initialToppings }: { toppings: Topping[] }) {
  const [toppings, setToppings] = useState(initialToppings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const priceNumber = Number(price);
    if (!name.trim()) {
      setError("Vui lòng nhập tên topping");
      return;
    }
    if (!Number.isInteger(priceNumber) || priceNumber < 0) {
      setError("Giá không hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/toppings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), price: priceNumber }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.message ?? "Không tạo được topping, vui lòng thử lại.");
        return;
      }

      const body = (await response.json()) as { topping: Topping };
      setToppings((current) => [...current, body.topping]);
      setName("");
      setPrice("");
    } catch {
      setError("Mất kết nối mạng, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSaved(updated: Topping) {
    setToppings((current) => current.map((t) => (t.id === updated.id ? updated : t)));
    setEditingId(null);
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mt-3 flex flex-col gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Tên topping</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Trân châu đường đen"
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Giá (đ)</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              placeholder="5000"
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
        </div>
        {error ? <span className="text-xs font-medium text-error">{error}</span> : null}
        <Button type="submit" disabled={submitting} className="w-fit">
          {submitting ? "Đang tạo…" : "Tạo topping mới"}
        </Button>
      </form>

      <div className="mt-3 flex flex-col gap-2">
        {toppings.map((topping) => {
          const isEditing = editingId === topping.id;
          return (
            <div
              key={topping.id}
              className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-3"
            >
              {isEditing ? (
                <EditToppingForm
                  topping={topping}
                  onCancel={() => setEditingId(null)}
                  onSaved={handleSaved}
                />
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{topping.name}</p>
                    <p className="text-xs text-ink-soft">{formatVnd(topping.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingId(topping.id)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Sửa
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {toppings.length === 0 ? (
          <p className="px-1 text-sm text-ink-soft">Chưa có topping nào.</p>
        ) : null}
      </div>
    </div>
  );
}
