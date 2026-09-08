const STORAGE_KEY = "order_web:last_customer";

export interface SavedCustomerInfo {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
}

/** Best-effort — silently no-ops if localStorage is unavailable (SSR, privacy mode, etc). */
export function saveLastCustomer(info: SavedCustomerInfo): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    // ignore — auto-fill is a convenience, not critical
  }
}

export function loadLastCustomer(): SavedCustomerInfo | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedCustomerInfo>;
    if (!parsed.customerName || !parsed.customerPhone || !parsed.deliveryAddress) return null;
    return {
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone,
      deliveryAddress: parsed.deliveryAddress,
    };
  } catch {
    return null;
  }
}
