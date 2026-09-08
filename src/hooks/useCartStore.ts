import { create } from "zustand";
import { DEFAULT_SUGAR_ICE_LEVEL, MenuItem, SugarIceLevel, Topping } from "@/lib/menu-data";

export interface CartLine {
  id: string;
  itemId: string;
  sizeId?: string;
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

/** Resolves the base unit price for a line: the chosen size's price if the item has sizes, else the item's own price. */
export function lineBasePrice(line: CartLine, item: MenuItem): number {
  if (item.sizes.length === 0) return item.price;
  return item.sizes.find((size) => size.id === line.sizeId)?.price ?? item.sizes[0].price;
}

export function lineUnitPrice(
  line: CartLine,
  itemsById: Map<string, MenuItem>,
  toppingsById: Map<string, Topping>,
): number {
  const item = itemsById.get(line.itemId);
  if (!item) return 0;
  const toppingsPrice = line.toppingIds.reduce((sum, id) => sum + (toppingsById.get(id)?.price ?? 0), 0);
  return lineBasePrice(line, item) + toppingsPrice;
}

export function lineTotal(
  line: CartLine,
  itemsById: Map<string, MenuItem>,
  toppingsById: Map<string, Topping>,
): number {
  return lineUnitPrice(line, itemsById, toppingsById) * line.quantity;
}

export function cartTotal(
  lines: CartLine[],
  itemsById: Map<string, MenuItem>,
  toppingsById: Map<string, Topping>,
): number {
  return lines.reduce((sum, line) => sum + lineTotal(line, itemsById, toppingsById), 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}
