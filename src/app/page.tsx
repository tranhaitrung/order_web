"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, CategoryId, MenuItem } from "@/lib/menu-data";
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

type View = "browsing" | "checkout" | "success" | "error";

export default function Home() {
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [view, setView] = useState<View>("browsing");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastPayload, setLastPayload] = useState<CheckoutPayload | null>(null);

  const sectionIds = useMemo(() => CATEGORIES.map((c) => sectionIdFor(c.id)), []);
  const activeSectionId = useScrollSpy(sectionIds, STICKY_NAV_OFFSET_PX);
  const activeCategory = (activeSectionId?.replace("section-", "") ?? CATEGORIES[0].id) as CategoryId;

  const lines = useCartStore((state) => state.lines);
  const addLine = useCartStore((state) => state.addLine);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeLine = useCartStore((state) => state.removeLine);
  const clearCart = useCartStore((state) => state.clear);

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
            quantity: line.quantity,
            toppingIds: line.toppingIds,
            sugarLevel: line.sugarLevel,
            iceLevel: line.iceLevel,
            note: line.note,
          })),
        }),
      });

      if (response.ok) {
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
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-sm">
        <CategoryTabs active={activeCategory} onSelect={scrollToCategory} />
      </div>
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

      <CartBar count={cartCount(lines)} total={cartTotal(lines)} onOpen={() => setIsCartOpen(true)} />

      {isCartOpen ? (
        <CartDrawer
          lines={lines}
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
