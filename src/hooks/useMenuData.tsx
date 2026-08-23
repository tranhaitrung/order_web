"use client";

import { createContext, ReactNode, useContext, useMemo } from "react";
import { Category, MenuItem, Topping } from "@/lib/menu-data";

export interface MenuData {
  categories: Category[];
  toppings: Topping[];
  items: MenuItem[];
}

interface MenuDataContextValue extends MenuData {
  itemsById: Map<string, MenuItem>;
  toppingsById: Map<string, Topping>;
  itemsByCategory: (categoryId: string) => MenuItem[];
}

const MenuDataContext = createContext<MenuDataContextValue | null>(null);

export function MenuDataProvider({ data, children }: { data: MenuData; children: ReactNode }) {
  const value = useMemo<MenuDataContextValue>(() => {
    const itemsById = new Map(data.items.map((item) => [item.id, item]));
    const toppingsById = new Map(data.toppings.map((topping) => [topping.id, topping]));
    return {
      ...data,
      itemsById,
      toppingsById,
      itemsByCategory: (categoryId) => data.items.filter((item) => item.category === categoryId),
    };
  }, [data]);

  return <MenuDataContext.Provider value={value}>{children}</MenuDataContext.Provider>;
}

export function useMenuData(): MenuDataContextValue {
  const context = useContext(MenuDataContext);
  if (!context) {
    throw new Error("useMenuData phải được dùng bên trong MenuDataProvider");
  }
  return context;
}
