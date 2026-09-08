"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Category, MenuItem } from "@/lib/menu-data";
import { Button } from "@/components/ui/Button";
import { SizesEditor, SizeRow } from "@/app/admin/menu/SizesEditor";

export function EditMenuItemForm({
  item,
  categories,
  onCancel,
  onSaved,
}: {
  item: MenuItem;
  categories: Category[];
  onCancel: () => void;
  onSaved: (updated: MenuItem) => void;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price));
  const [category, setCategory] = useState(item.category);
  const [imageSrc, setImageSrc] = useState(item.imageSrc);
  const [mustTry, setMustTry] = useState(Boolean(item.mustTry));
  const [sizes, setSizes] = useState<SizeRow[]>(
    item.sizes.map((size) => ({ label: size.label, price: String(size.price) })),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const priceNumber = Number(price);
    if (!name.trim()) {
      setError("Vui lòng nhập tên món");
      return;
    }
    if (!Number.isInteger(priceNumber) || priceNumber <= 0) {
      setError("Giá không hợp lệ");
      return;
    }
    if (!imageSrc.trim()) {
      setError("Vui lòng nhập link ảnh");
      return;
    }

    const parsedSizes: { label: string; price: number }[] = [];
    for (const row of sizes) {
      if (!row.label.trim() && !row.price.trim()) continue;
      const sizePriceNumber = Number(row.price);
      if (!row.label.trim() || !Number.isInteger(sizePriceNumber) || sizePriceNumber <= 0) {
        setError("Vui lòng nhập đủ tên và giá hợp lệ cho từng size, hoặc xoá size trống");
        return;
      }
      parsedSizes.push({ label: row.label.trim(), price: sizePriceNumber });
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: priceNumber,
          category,
          imageSrc: imageSrc.trim(),
          mustTry,
          sizes: parsedSizes,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.message ?? "Không lưu được, vui lòng kiểm tra lại thông tin.");
        return;
      }

      const body = (await response.json()) as { item: MenuItem };
      onSaved(body.item);
    } catch {
      setError("Mất kết nối mạng, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-1">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Tên món</span>
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
          <span className="text-xs text-ink-soft">Dùng khi món không có size riêng.</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Danh mục</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5">
          <input
            type="checkbox"
            checked={mustTry}
            onChange={(e) => setMustTry(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-primary"
          />
          <span className="text-sm font-semibold text-ink">Must Try</span>
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-semibold text-ink">Link ảnh món</span>
          <input
            value={imageSrc}
            onChange={(e) => setImageSrc(e.target.value)}
            placeholder="https://..."
            className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>

        <SizesEditor sizes={sizes} onChange={setSizes} />
      </div>

      {imageSrc.trim() ? (
        <div className="h-20 w-20 overflow-hidden rounded-[var(--radius-sm)] border border-line bg-surface-alt">
          <Image
            src={imageSrc.trim()}
            alt="Xem trước ảnh món"
            width={160}
            height={160}
            unoptimized
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

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
