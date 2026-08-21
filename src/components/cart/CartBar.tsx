import { formatVnd } from "@/lib/format";

interface CartBarProps {
  count: number;
  total: number;
  onOpen: () => void;
}

export function CartBar({ count, total, onOpen }: CartBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-[slide-up_var(--duration-normal)_var(--ease-out-expo)]">
      <button
        onClick={onOpen}
        className="mx-auto flex w-full max-w-md items-center justify-between rounded-full bg-primary px-5 py-3.5 text-white shadow-[var(--shadow-float)] transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs">
            {count}
          </span>
          Xem giỏ hàng
        </span>
        <span className="text-sm font-bold">{formatVnd(total)}</span>
      </button>
    </div>
  );
}
