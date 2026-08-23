"use client";

import { CategoryId } from "@/lib/menu-data";
import { useMenuData } from "@/hooks/useMenuData";
import { cn } from "@/lib/cn";

interface CategoryTabsProps {
  active: CategoryId;
  onSelect: (category: CategoryId) => void;
}

export function CategoryTabs({ active, onSelect }: CategoryTabsProps) {
  const { categories } = useMenuData();

  return (
    <div
      role="tablist"
      aria-label="Danh mục món"
      className="flex gap-2 overflow-x-auto px-4 py-3 sm:justify-center"
    >
      {categories.map((category) => {
        const isActive = category.id === active;
        return (
          <button
            key={category.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(category.id)}
            className={cn(
              "shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-150",
              isActive
                ? "bg-primary text-white shadow-[var(--shadow-card)]"
                : "bg-surface text-ink-soft border border-line hover:border-primary/40",
            )}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
