import { MenuItem } from "@/lib/menu-data";
import { formatVnd } from "@/lib/format";

interface MenuItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  return (
    <button
      onClick={() => onSelect(item)}
      className="group relative flex flex-col items-start gap-1 rounded-[var(--radius-md)] border border-line bg-surface p-4 text-left shadow-[var(--shadow-card)] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
    >
      {item.mustTry ? (
        <span className="absolute -top-2 right-3 rounded-full bg-accent-gold px-2.5 py-0.5 text-xs font-bold text-accent-gold-ink shadow-sm">
          Must Try
        </span>
      ) : null}
      <span className="font-display text-lg font-semibold leading-snug text-ink">{item.name}</span>
      <span className="text-sm font-semibold text-primary">{formatVnd(item.price)}</span>
      <span className="mt-2 text-xs font-medium text-ink-soft opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        Chạm để chọn topping →
      </span>
    </button>
  );
}
