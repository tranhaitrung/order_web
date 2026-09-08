"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { nowInVietnam, toDateKey } from "@/lib/delivery";
import { formatVnd } from "@/lib/format";
import { Button } from "@/components/ui/Button";

interface ManualRevenueEntry {
  id: string;
  amount: number;
  note: string | null;
  entryDate: string;
  createdAt: string;
}

function monthStartKey(now: Date): string {
  return toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function ManualRevenueManager() {
  const router = useRouter();
  const today = toDateKey(nowInVietnam());
  const [from, setFrom] = useState(() => monthStartKey(nowInVietnam()));
  const [to, setTo] = useState(today);
  const [entries, setEntries] = useState<ManualRevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(today);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    fetch(`/api/admin/manual-revenue?from=${from}&to=${to}`)
      .then((response) => (response.ok ? (response.json() as Promise<{ entries: ManualRevenueEntry[] }>) : null))
      .then((body) => {
        if (ignore) return;
        if (body) setEntries(body.entries);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [from, to]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const amountNumber = Number(amount);
    if (!Number.isInteger(amountNumber) || amountNumber <= 0) {
      setError("Số tiền không hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/manual-revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNumber,
          note: note.trim() || undefined,
          entryDate,
        }),
      });

      if (!response.ok) {
        setError("Không lưu được doanh thu, vui lòng thử lại.");
        return;
      }

      const body = (await response.json()) as { entry: ManualRevenueEntry };
      setEntries((current) => [...current, body.entry].sort((a, b) => b.entryDate.localeCompare(a.entryDate)));
      setAmount("");
      setNote("");
      router.refresh();
    } catch {
      setError("Mất kết nối mạng, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    await fetch(`/api/admin/manual-revenue/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Thêm doanh thu bằng tay</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Dùng cho doanh thu ngoài hệ thống đặt hàng (bán tại quầy, tiền mặt...). Khoản này sẽ được cộng vào biểu đồ
          doanh thu ở trên.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-3 flex flex-col gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">Số tiền (đ)</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
                placeholder="500000"
                className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">Ngày</span>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-semibold text-ink">Ghi chú (không bắt buộc)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: bán tại quầy buổi tối"
                className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </label>
          </div>
          {error ? <span className="text-xs font-medium text-error">{error}</span> : null}
          <Button type="submit" disabled={submitting} className="w-fit">
            {submitting ? "Đang lưu…" : "Lưu doanh thu"}
          </Button>
        </form>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Danh sách doanh thu nhập tay</h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
            <span className="text-sm text-ink-soft">–</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
        </div>

        <p className="mt-2 text-sm text-ink-soft">
          {loading ? "Đang tải…" : `${entries.length} khoản · Tổng ${formatVnd(total)}`}
        </p>

        <div className="mt-3 overflow-x-auto rounded-[var(--radius-md)] border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-3 py-2">Ngày</th>
                <th className="px-3 py-2">Ghi chú</th>
                <th className="px-3 py-2 text-right">Số tiền</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-line">
                  <td className="px-3 py-2 text-ink-soft">{entry.entryDate}</td>
                  <td className="px-3 py-2 text-ink-soft">{entry.note || "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold text-ink">{formatVnd(entry.amount)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs font-semibold text-error underline-offset-2 hover:underline"
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-ink-soft">
                    Chưa có khoản doanh thu nhập tay nào trong khoảng ngày này.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
