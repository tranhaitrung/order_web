import { CATEGORIES, itemsByCategory, MenuItem } from "@/lib/menu-data";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { PaymentQR } from "@/components/menu/PaymentQR";
import { ContactFooter } from "@/components/menu/ContactFooter";
import { STICKY_NAV_OFFSET_PX } from "@/lib/layout-constants";

export function sectionIdFor(categoryId: string): string {
  return `section-${categoryId}`;
}

interface MenuSectionsProps {
  onSelect: (item: MenuItem) => void;
}

export function MenuSections({ onSelect }: MenuSectionsProps) {
  return (
    <div>
      {CATEGORIES.map((category) => (
        <section
          key={category.id}
          id={sectionIdFor(category.id)}
          style={{ scrollMarginTop: STICKY_NAV_OFFSET_PX }}
          className="px-4 pt-5"
        >
          <h2 className="font-display text-lg font-semibold text-ink">{category.label}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {itemsByCategory(category.id).map((item) => (
              <MenuItemCard key={item.id} item={item} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}
      <PaymentQR />
      <ContactFooter />
      <div className="h-24" aria-hidden />
    </div>
  );
}
