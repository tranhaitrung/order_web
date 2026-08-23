"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type ClosedScope = "shift" | "day" | "permanent" | "range";
type QuickScope = Exclude<ClosedScope, "range">;

interface StoreStatus {
  isClosed: boolean;
  closedScope: ClosedScope | null;
  closedFrom: string | null;
  closedUntil: string | null;
  closedNote: string | null;
  updatedAt: string;
}

const SCOPE_LABEL: Record<QuickScope, string> = {
  shift: "Tắt buổi này",
  day: "Tắt hôm nay",
  permanent: "Tắt vĩnh viễn",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StoreStatusPanel({ initialStatus }: { initialStatus: StoreStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [rangeError, setRangeError] = useState("");
  const [pending, setPending] = useState(false);

  async function apply(
    body:
      | { action: "open" }
      | { action: "close"; scope: QuickScope; note?: string }
      | { action: "close"; scope: "range"; from: string; to: string; note?: string },
  ) {
    setPending(true);
    setRangeError("");
    try {
      const response = await fetch("/api/admin/store-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const data = (await response.json()) as { status: StoreStatus };
        setStatus(data.status);
        setNote("");
        setRangeFrom("");
        setRangeTo("");
        router.refresh();
      } else {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        setRangeError(data?.message ?? "Không áp dụng được, vui lòng thử lại.");
      }
    } finally {
      setPending(false);
    }
  }

  function submitRange() {
    if (!rangeFrom || !rangeTo) {
      setRangeError("Vui lòng chọn đủ thời gian bắt đầu và kết thúc");
      return;
    }
    if (rangeTo <= rangeFrom) {
      setRangeError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }
    void apply({ action: "close", scope: "range", from: rangeFrom, to: rangeTo, note: note.trim() || undefined });
  }

  const isScheduled = status.closedFrom && new Date() < new Date(status.closedFrom);

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div
        className={cn(
          "rounded-[var(--radius-md)] border p-4",
          status.isClosed ? "border-error/30 bg-error-soft" : "border-primary/30 bg-primary-soft",
        )}
      >
        <p className={cn("font-semibold", status.isClosed ? "text-error" : "text-primary")}>
          {status.isClosed ? (isScheduled ? "Đã lên lịch tắt nhận đơn" : "Đã tắt nhận đơn") : "Đang nhận đơn"}
        </p>
        {status.isClosed ? (
          <p className="mt-1 text-sm text-ink-soft">
            {status.closedScope === "permanent"
              ? "Tắt vĩnh viễn — cần bật lại thủ công."
              : status.closedScope === "range" && status.closedFrom && status.closedUntil
                ? `${isScheduled ? "Sẽ tắt" : "Tắt"} từ ${formatDateTime(status.closedFrom)} đến ${formatDateTime(status.closedUntil)}`
                : status.closedUntil
                  ? `Tự động mở lại lúc ${formatDateTime(status.closedUntil)}`
                  : ""}
            {status.closedNote ? ` · "${status.closedNote}"` : ""}
          </p>
        ) : null}
      </div>

      {status.isClosed ? (
        <Button disabled={pending} onClick={() => apply({ action: "open" })}>
          Bật lại nhận đơn
        </Button>
      ) : (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Ghi chú cho khách (không bắt buộc)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Hết nguyên liệu, mai bán lại nhé!"
              className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-primary"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(SCOPE_LABEL) as QuickScope[]).map((scope) => (
              <Button
                key={scope}
                variant="outline"
                disabled={pending}
                onClick={() => apply({ action: "close", scope, note: note.trim() || undefined })}
              >
                {SCOPE_LABEL[scope]}
              </Button>
            ))}
          </div>

          <div className="rounded-[var(--radius-md)] border border-line bg-surface p-4">
            <p className="text-sm font-semibold text-ink">Hoặc chọn khoảng thời gian</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-soft">Từ</span>
                <input
                  type="datetime-local"
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-soft">Đến</span>
                <input
                  type="datetime-local"
                  value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value)}
                  className="rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                />
              </label>
            </div>
            {rangeError ? <p className="mt-2 text-xs font-medium text-error">{rangeError}</p> : null}
            <Button variant="outline" disabled={pending} onClick={submitRange} className="mt-3 w-fit">
              Áp dụng khoảng thời gian
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
