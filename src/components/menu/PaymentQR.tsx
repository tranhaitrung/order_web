import Image from "next/image";
import { PAYMENT } from "@/lib/menu-data";

export function PaymentQR() {
  return (
    <section className="mt-8 px-4">
      <div className="mx-auto flex max-w-sm flex-col items-center rounded-[var(--radius-lg)] border border-line bg-surface p-5 text-center shadow-[var(--shadow-card)]">
        <p className="font-display text-lg font-semibold text-ink">Thanh toán chuyển khoản</p>
        <p className="mt-1 text-sm text-ink-soft">Quét mã để thanh toán cho đơn đã đặt</p>

        <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-line">
          <Image
            src={PAYMENT.qrImageSrc}
            alt={`Mã VietQR chuyển khoản tới ${PAYMENT.accountName} — ${PAYMENT.bankLabel}`}
            width={270}
            height={320}
            className="h-auto w-[270px]"
          />
        </div>

        <div className="mt-3 text-sm">
          <p className="font-semibold text-ink">{PAYMENT.accountName}</p>
          <p className="text-ink-soft">
            {PAYMENT.bankLabel} · {PAYMENT.accountNumber}
          </p>
        </div>

        <p className="mt-3 text-xs text-ink-soft">
          Vui lòng ghi chú tên và số điện thoại khi chuyển khoản để IT HOUSE đối chiếu đúng đơn hàng.
        </p>
      </div>
    </section>
  );
}
