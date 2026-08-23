"use client";

import { FormEvent, useEffect, useState } from "react";
import { nowInVietnam, toDateKey } from "@/lib/delivery";
import { formatVnd } from "@/lib/format";
import { Button } from "@/components/ui/Button";

interface Expense {
  id: string;
  itemName: string;
  amount: number;
  note: string | null;
  purchasedAt: string;
  createdAt: string;
}

function monthStartKey(now: Date): string {
  return toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
}

export default function AdminExpensesPage() {
  const today = toDateKey(nowInVietnam());
  const [from, setFrom] = useState(() => monthStartKey(nowInVietnam()));
  const [to, setTo] = useState(today);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(today);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    fetch(`/api/admin/expenses?from=${from}&to=${to}`)
      .then((response) => (response.ok ? (response.json() as Promise<{ expenses: Expense[] }>) : null))
      .then((body) => {
        if (ignore) return;
        if (body) setExpenses(body.expenses);
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
    if (!itemName.trim()) {
      setError("Vui lòng nhập nguyên liệu");
      return;
    }
    if (!Number.isInteger(amountNumber) || amountNumber <= 0) {
      setError("Số tiền không hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemName: itemName.trim(),
          amount: amountNumber,
          note: note.trim() || undefined,
          purchasedAt,
        }),
      });

      if (!response.ok) {
        setError("Không lưu được chi phí, vui lòng thử lại.");
        return;
      }

      const body = (await response.json()) as { expense: Expense };
      setExpenses((current) =>
        [...current, body.expense].sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt)),
      );
      setItemName("");
      setAmount("");
      setNote("");
    } catch {
      setError("Mất kết nối mạng, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setExpenses((current) => current.filter((expense) => expense.id !== id));
    await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Ghi chi phí mua nguyên liệu</h2>
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">Nguyên liệu</span>
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="VD: Trà xanh, sữa tươi..."
                className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </label>
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
              <span className="text-sm font-semibold text-ink">Ngày mua</span>
              <input
                type="date"
                value={purchasedAt}
                onChange={(e) => setPurchasedAt(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink">Ghi chú (không bắt buộc)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: mua ở chợ đầu mối"
                className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </label>
          </div>
          {error ? <span className="text-xs font-medium text-error">{error}</span> : null}
          <Button type="submit" disabled={submitting} className="w-fit">
            {submitting ? "Đang lưu…" : "Lưu chi phí"}
          </Button>
        </form>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Danh sách chi phí</h2>
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
          {loading ? "Đang tải…" : `${expenses.length} khoản · Tổng ${formatVnd(total)}`}
        </p>

        <div className="mt-3 overflow-x-auto rounded-[var(--radius-md)] border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-3 py-2">Ngày mua</th>
                <th className="px-3 py-2">Nguyên liệu</th>
                <th className="px-3 py-2">Ghi chú</th>
                <th className="px-3 py-2 text-right">Số tiền</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-line">
                  <td className="px-3 py-2 text-ink-soft">{expense.purchasedAt}</td>
                  <td className="px-3 py-2 font-medium text-ink">{expense.itemName}</td>
                  <td className="px-3 py-2 text-ink-soft">{expense.note || "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold text-ink">{formatVnd(expense.amount)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-xs font-semibold text-error underline-offset-2 hover:underline"
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-ink-soft">
                    Chưa có khoản chi nào trong khoảng ngày này.
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
