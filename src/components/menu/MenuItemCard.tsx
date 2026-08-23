import Image from "next/image";
import { MenuItem } from "@/lib/menu-data";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/cn";

interface MenuItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  const soldOut = item.soldOut;

  return (
    <div
      role={soldOut ? undefined : "button"}
      tabIndex={soldOut ? undefined : 0}
      onClick={soldOut ? undefined : () => onSelect(item)}
      onKeyDown={
        soldOut
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(item);
              }
            }
      }
      className={cn(
        "group relative aspect-[3/4] overflow-hidden rounded-[var(--radius-sm)] bg-surface-alt shadow-[var(--shadow-card)] transition-transform duration-150",
        soldOut
          ? "cursor-not-allowed"
          : "cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
      )}
    >
      <Image
        src={item.imageSrc}
        alt={item.name}
        width={1152}
        height={805}
        loading="lazy"
        className={cn(
          "h-full w-full object-cover transition-transform duration-300",
          soldOut ? "grayscale" : "group-hover:scale-105",
        )}
      />

      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-ink/95 via-ink/45 to-transparent" />

      {soldOut ? (
        <span className="absolute left-1 top-1 rounded-full bg-ink/80 px-1.5 py-0.5 text-[8px] font-bold leading-none text-white shadow-sm">
          Hết hàng
        </span>
      ) : item.mustTry ? (
        <span className="absolute left-1 top-1 rounded-full bg-accent-gold px-1.5 py-0.5 text-[8px] font-bold leading-none text-accent-gold-ink shadow-sm">
          Must Try
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 py-1 pl-1.5 pr-7">
        <span className="line-clamp-2 font-display text-[10.5px] font-semibold leading-[1.15] text-white">
          {item.name}
        </span>
        <span className="mt-0.5 block text-[10px] font-semibold text-white/95">{formatVnd(item.price)}</span>
      </div>

      {soldOut ? null : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item);
          }}
          aria-label={`Chọn ${item.name}`}
          className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform duration-150 hover:bg-primary-dark active:scale-90"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
