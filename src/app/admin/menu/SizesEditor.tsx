"use client";

export interface SizeRow {
  label: string;
  price: string;
}

export function SizesEditor({ sizes, onChange }: { sizes: SizeRow[]; onChange: (sizes: SizeRow[]) => void }) {
  function updateRow(index: number, patch: Partial<SizeRow>) {
    onChange(sizes.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(sizes.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...sizes, { label: "", price: "" }]);
  }

  return (
    <div className="sm:col-span-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Size (không bắt buộc)</span>
        <button type="button" onClick={addRow} className="text-xs font-semibold text-primary hover:underline">
          + Thêm size
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        Thêm các size để khách chọn (VD: Nhỏ, Vừa, Lớn), mỗi size một giá riêng. Để trống nếu món chỉ có 1 giá.
      </p>
      {sizes.length > 0 ? (
        <div className="mt-2 flex flex-col gap-2">
          {sizes.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={row.label}
                onChange={(e) => updateRow(index, { label: e.target.value })}
                placeholder="Tên size (VD: Lớn)"
                className="flex-1 rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <input
                value={row.price}
                onChange={(e) => updateRow(index, { price: e.target.value })}
                inputMode="numeric"
                placeholder="Giá"
                className="w-28 rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label="Xoá size"
                className="shrink-0 text-error hover:text-error/80"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
