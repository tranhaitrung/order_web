import { SHOP } from "@/lib/menu-data";

export function ContactFooter() {
  return (
    <footer className="mt-6 border-t border-line px-4 py-6 text-center">
      <p className="text-sm font-semibold text-ink">Liên hệ đặt hàng</p>
      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-ink-soft">
        <a href={`tel:${SHOP.contactPhone}`} className="font-medium text-primary hover:underline">
          {SHOP.contactPhone}
        </a>
        <span aria-hidden>·</span>
        <a href={`mailto:${SHOP.contactEmail}`} className="font-medium text-primary hover:underline">
          {SHOP.contactEmail}
        </a>
      </p>
    </footer>
  );
}
