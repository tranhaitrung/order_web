export type CategoryId = string;

export interface Category {
  id: CategoryId;
  label: string;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: CategoryId;
  mustTry?: boolean;
  imageSrc: string;
  soldOut: boolean;
}

export const SHOP = {
  name: "IT HOUSE",
  tagline: "Tea ❤️ Coffee",
  claims: ["Nguyên liệu chọn lọc", "Thơm ngon – thanh mát", "Tự nhiên – tốt cho sức khỏe"],
  zaloPhone: "0358260822",
  contactPhone: "0358260822",
  contactEmail: "trungth1@mbbank.com.vn",
};

export const PAYMENT = {
  bankLabel: "MB Bank",
  accountName: "TRAN HAI TRUNG",
  accountNumber: "060808888",
  qrImageSrc: "/vietqr-mb.png",
};

export const SUGAR_ICE_LEVELS = [
  { id: "khong", label: "Không" },
  { id: "it", label: "Ít" },
  { id: "vua", label: "Vừa" },
  { id: "nhieu", label: "Nhiều" },
] as const;

export type SugarIceLevel = (typeof SUGAR_ICE_LEVELS)[number]["id"];
export const DEFAULT_SUGAR_ICE_LEVEL: SugarIceLevel = "vua";

export function sugarIceLabel(level: SugarIceLevel): string {
  return SUGAR_ICE_LEVELS.find((l) => l.id === level)?.label ?? level;
}

export const DELIVERY_SLOTS = [
  { id: "morning", label: "Buổi sáng" },
  { id: "afternoon", label: "Buổi chiều" },
] as const;

export type DeliverySlotId = (typeof DELIVERY_SLOTS)[number]["id"];

export function deliverySlotLabel(slot: DeliverySlotId): string {
  return DELIVERY_SLOTS.find((s) => s.id === slot)?.label ?? slot;
}
