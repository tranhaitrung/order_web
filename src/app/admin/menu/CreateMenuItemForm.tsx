"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Category } from "@/lib/menu-data";
import { Button } from "@/components/ui/Button";
import { SizesEditor, SizeRow } from "@/app/admin/menu/SizesEditor";

export function CreateMenuItemForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(categories[0]?.id ?? "");
  const [imageSrc, setImageSrc] = useState("");
  const [imageOk, setImageOk] = useState(false);
  const [mustTry, setMustTry] = useState(false);
  const [sizes, setSizes] = useState<SizeRow[]>([]);
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
    if (!category) {
      setError("Vui lòng chọn danh mục");
      return;
    }
    if (!imageSrc.trim()) {
      setError("Vui lòng nhập link ảnh");
      return;
    }

    const parsedSizes: { label: string; price: number }[] = [];
    for (const row of sizes) {
      if (!row.label.trim() && !row.price.trim()) continue; // skip fully-empty rows
      const sizePriceNumber = Number(row.price);
      if (!row.label.trim() || !Number.isInteger(sizePriceNumber) || sizePriceNumber <= 0) {
        setError("Vui lòng nhập đủ tên và giá hợp lệ cho từng size, hoặc xoá size trống");
        return;
      }
      parsedSizes.push({ label: row.label.trim(), price: sizePriceNumber });
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: priceNumber,
          category,
          imageSrc: imageSrc.trim(),
          mustTry,
          sizes: parsedSizes.length > 0 ? parsedSizes : undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.message ?? "Không tạo được món, vui lòng kiểm tra lại thông tin.");
        return;
      }

      setName("");
      setPrice("");
      setImageSrc("");
      setImageOk(false);
      setMustTry(false);
      setSizes([]);
      router.refresh();
    } catch {
      setError("Mất kết nối mạng, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-col gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Tên món</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Trà đào cam sả"
            className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Giá (đ)</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            placeholder="25000"
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
          <span className="text-sm font-semibold text-ink">Đánh dấu Must Try</span>
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-semibold text-ink">Link ảnh món</span>
          <input
            value={imageSrc}
            onChange={(e) => {
              setImageSrc(e.target.value);
              setImageOk(false);
            }}
            placeholder="https://..."
            className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
          />
        </label>

        <SizesEditor sizes={sizes} onChange={setSizes} />
      </div>

      {imageSrc.trim() ? (
        <div className="flex items-center gap-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-line bg-surface-alt">
            <Image
              src={imageSrc.trim()}
              alt="Xem trước ảnh món"
              width={160}
              height={160}
              unoptimized
              className="h-full w-full object-cover"
              onLoad={() => setImageOk(true)}
              onError={() => setImageOk(false)}
            />
          </div>
          <span className="text-xs text-ink-soft">
            {imageOk ? "Ảnh tải được — sẵn sàng lưu." : "Đang tải ảnh xem trước…"}
          </span>
        </div>
      ) : null}

      {error ? <span className="text-xs font-medium text-error">{error}</span> : null}
      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Đang tạo…" : "Tạo món mới"}
      </Button>
    </form>
  );
}
