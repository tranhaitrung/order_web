import { create } from "zustand";
import { DEFAULT_SUGAR_ICE_LEVEL, getMenuItem, getTopping, SugarIceLevel } from "@/lib/menu-data";

export interface CartLine {
  id: string;
  itemId: string;
  quantity: number;
  toppingIds: string[];
  sugarLevel: SugarIceLevel;
  iceLevel: SugarIceLevel;
  note?: string;
}

interface CartState {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "id">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeLine: (id: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  addLine: (line) =>
    set((state) => ({
      lines: [...state.lines, { ...line, id: crypto.randomUUID() }],
    })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      lines:
        quantity <= 0
          ? state.lines.filter((line) => line.id !== id)
          : state.lines.map((line) => (line.id === id ? { ...line, quantity } : line)),
    })),
  removeLine: (id) => set((state) => ({ lines: state.lines.filter((line) => line.id !== id) })),
  clear: () => set({ lines: [] }),
}));

export const DEFAULT_CART_MODIFIERS = {
  sugarLevel: DEFAULT_SUGAR_ICE_LEVEL,
  iceLevel: DEFAULT_SUGAR_ICE_LEVEL,
};

export function lineUnitPrice(line: CartLine): number {
  const item = getMenuItem(line.itemId);
  if (!item) return 0;
  const toppingsPrice = line.toppingIds.reduce((sum, id) => sum + (getTopping(id)?.price ?? 0), 0);
  return item.price + toppingsPrice;
}

export function lineTotal(line: CartLine): number {
  return lineUnitPrice(line) * line.quantity;
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}
