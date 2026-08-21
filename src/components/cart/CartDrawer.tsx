import { CartLine, cartTotal } from "@/hooks/useCartStore";
import { formatVnd } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { CartItemRow } from "@/components/cart/CartItemRow";

interface CartDrawerProps {
  lines: CartLine[];
  onClose: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({ lines, onClose, onUpdateQuantity, onRemove, onCheckout }: CartDrawerProps) {
  const total = cartTotal(lines);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button aria-label="Đóng" onClick={onClose} className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col rounded-t-[var(--radius-lg)] bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-float)] animate-[slide-up_var(--duration-normal)_var(--ease-out-expo)] sm:rounded-[var(--radius-lg)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="cart-drawer-title" className="font-display text-xl font-semibold text-ink">
            Giỏ hàng
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-2 text-ink-soft transition-colors hover:bg-primary-soft hover:text-primary"
          >
            ✕
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">Giỏ hàng trống, chọn món để bắt đầu.</p>
        ) : (
          <div className="mt-2 flex-1 overflow-y-auto">
            {lines.map((line) => (
              <CartItemRow key={line.id} line={line} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} />
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm font-semibold text-ink-soft">Tổng cộng</span>
          <span className="font-display text-xl font-bold text-primary">{formatVnd(total)}</span>
        </div>

        <Button className="mt-4 w-full" disabled={lines.length === 0} onClick={onCheckout}>
          Đặt hàng
        </Button>
      </div>
    </div>
  );
}
