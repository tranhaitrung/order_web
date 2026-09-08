"use client";

import { useMemo, useState } from "react";
import { CategoryId, MenuItem } from "@/lib/menu-data";
import { MenuData, MenuDataProvider, useMenuData } from "@/hooks/useMenuData";
import { useCartStore, cartCount, cartTotal } from "@/hooks/useCartStore";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { STICKY_NAV_OFFSET_PX } from "@/lib/layout-constants";
import { BrandHeader } from "@/components/menu/BrandHeader";
import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { MenuSections, sectionIdFor } from "@/components/menu/MenuSections";
import { ItemModal } from "@/components/item-modal/ItemModal";
import { CartBar } from "@/components/cart/CartBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CheckoutView, type CheckoutPayload } from "@/components/checkout/CheckoutView";
import { ConfirmationView } from "@/components/checkout/ConfirmationView";
import { ErrorView } from "@/components/checkout/ErrorView";
import { ZaloButton } from "@/components/ZaloButton";
import { saveLastCustomer } from "@/lib/customer-storage";

type View = "browsing" | "checkout" | "success" | "error";

const DEFAULT_CLOSED_MESSAGE = "Cửa hàng hiện đang tạm ngừng nhận đơn, vui lòng quay lại sau.";

interface HomeClientProps {
  menuData: MenuData;
  isClosed: boolean;
  closedNote: string | null;
}

export function HomeClient({ menuData, isClosed, closedNote }: HomeClientProps) {
  return (
    <MenuDataProvider data={menuData}>
      <Home isClosed={isClosed} closedNote={closedNote} />
    </MenuDataProvider>
  );
}

function Home({ isClosed, closedNote }: { isClosed: boolean; closedNote: string | null }) {
  const { categories, itemsById, toppingsById } = useMenuData();
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [view, setView] = useState<View>("browsing");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastPayload, setLastPayload] = useState<CheckoutPayload | null>(null);

  const sectionIds = useMemo(() => categories.map((c) => sectionIdFor(c.id)), [categories]);
  const activeSectionId = useScrollSpy(sectionIds, STICKY_NAV_OFFSET_PX);
  const activeCategory = (activeSectionId?.replace("section-", "") ?? categories[0]?.id ?? "") as CategoryId;

  const lines = useCartStore((state) => state.lines);
  const addLine = useCartStore((state) => state.addLine);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeLine = useCartStore((state) => state.removeLine);
  const clearCart = useCartStore((state) => state.clear);
  const hasCartItems = cartCount(lines) > 0;

  function scrollToCategory(category: CategoryId) {
    document.getElementById(sectionIdFor(category))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submitOrder(payload: CheckoutPayload) {
    setSubmitting(true);
    setLastPayload(payload);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          deliveryAddress: payload.deliveryAddress,
          deliveryDate: payload.deliveryDate,
          deliverySlot: payload.deliverySlot,
          items: lines.map((line) => ({
            itemId: line.itemId,
            sizeId: line.sizeId,
            quantity: line.quantity,
            toppingIds: line.toppingIds,
            sugarLevel: line.sugarLevel,
            iceLevel: line.iceLevel,
            note: line.note,
          })),
        }),
      });

      if (response.ok) {
        saveLastCustomer({
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          deliveryAddress: payload.deliveryAddress,
        });
        clearCart();
        setView("success");
        return;
      }

      const body = await response.json().catch(() => null);
      setErrorMessage(body?.message ?? "Không gửi được đơn hàng, vui lòng thử lại.");
      setView("error");
    } catch {
      setErrorMessage("Mất kết nối mạng, vui lòng thử lại.");
      setView("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "checkout") {
    return (
      <CheckoutView
        lines={lines}
        submitting={submitting}
        onBack={() => setView("browsing")}
        onSubmit={submitOrder}
      />
    );
  }

  if (view === "success") {
    return <ConfirmationView onOrderMore={() => setView("browsing")} />;
  }

  if (view === "error") {
    return (
      <ErrorView
        message={errorMessage}
        onRetry={() => {
          if (lastPayload) void submitOrder(lastPayload);
        }}
      />
    );
  }

  return (
    <div className="pb-4">
      <BrandHeader />
      <div className="sticky top-0 z-20 -mt-7 px-4">
        <div className="mx-auto max-w-md rounded-full border border-line bg-surface/95 shadow-[var(--shadow-float)] backdrop-blur-sm">
          <CategoryTabs active={activeCategory} onSelect={scrollToCategory} />
        </div>
      </div>
      {isClosed ? (
        <div className="mx-4 mt-3 rounded-[var(--radius-sm)] border border-error/30 bg-error-soft px-4 py-3 text-sm font-medium text-error">
          {closedNote || DEFAULT_CLOSED_MESSAGE}
        </div>
      ) : null}
      <MenuSections onSelect={setActiveItem} />

      {activeItem ? (
        <ItemModal
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onAddToCart={({ quantity, toppingIds, sugarLevel, iceLevel, note }) =>
            addLine({ itemId: activeItem.id, quantity, toppingIds, sugarLevel, iceLevel, note })
          }
        />
      ) : null}

      <CartBar
        count={cartCount(lines)}
        total={cartTotal(lines, itemsById, toppingsById)}
        onOpen={() => setIsCartOpen(true)}
      />

      <ZaloButton liftedByCartBar={hasCartItems} />

      {isCartOpen ? (
        <CartDrawer
          lines={lines}
          checkoutDisabled={isClosed}
          checkoutDisabledMessage={closedNote || DEFAULT_CLOSED_MESSAGE}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={updateQuantity}
          onRemove={removeLine}
          onCheckout={() => {
            setIsCartOpen(false);
            setView("checkout");
          }}
        />
      ) : null}
    </div>
  );
}
