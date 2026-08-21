import { SHOP } from "@/lib/menu-data";
import { Button } from "@/components/ui/Button";

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  const telHref = `tel:${SHOP.zaloPhone.replace(/\s/g, "")}`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <span
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-full bg-error-soft text-3xl text-error"
      >
        !
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-ink">Gửi đơn thất bại</h1>
      <p className="mt-2 text-sm text-ink-soft">{message}</p>
      <div className="mt-6 flex w-full flex-col gap-3">
        <Button onClick={onRetry}>Thử lại</Button>
        <a href={telHref}>
          <Button variant="outline" className="w-full">
            Gọi Zalo {SHOP.zaloPhone}
          </Button>
        </a>
      </div>
    </div>
  );
}
