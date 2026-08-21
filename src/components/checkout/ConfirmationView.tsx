import { Button } from "@/components/ui/Button";

interface ConfirmationViewProps {
  onOrderMore: () => void;
}

export function ConfirmationView({ onOrderMore }: ConfirmationViewProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <span
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-3xl text-primary"
      >
        ✓
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-ink">Đã gửi đơn!</h1>
      <p className="mt-2 text-sm text-ink-soft">
        IT HOUSE đã nhận được đơn hàng của bạn và sẽ liên hệ xác nhận qua số điện thoại bạn vừa để lại.
      </p>
      <Button className="mt-6" onClick={onOrderMore}>
        Đặt thêm món khác
      </Button>
    </div>
  );
}
