export type CategoryId = "tra-tra-sua" | "cafe";

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

export const CATEGORIES: Category[] = [
  { id: "tra-tra-sua", label: "Trà & Trà Sữa" },
  { id: "cafe", label: "Café" },
];

export const TOPPINGS: Topping[] = [
  { id: "nha-dam", name: "Nha đam", price: 5000 },
  { id: "tran-chau-trang", name: "Trân châu trắng", price: 5000 },
  { id: "tran-chau-đen", name: "Trân châu đen", price: 7000 },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "tra-sua-thai-xanh",
    name: "Trà sữa Thái xanh",
    price: 20000,
    category: "tra-tra-sua",
    mustTry: true,
    imageSrc: "/menu/tra-thai-xanh.jpeg",
  },
  {
    id: "tra-sua-truyen-thong",
    name: "Trà sữa truyền thống",
    price: 25000,
    category: "tra-tra-sua",
    imageSrc: "/menu/tra-sua.jpeg",
  },
  {
    id: "tra-tac",
    name: "Trà tắc",
    price: 15000,
    category: "tra-tra-sua",
    imageSrc: "/menu/tra-tac.jpeg",
  },
  {
    id: "tra-chanh",
    name: "Trà chanh",
    price: 15000,
    category: "tra-tra-sua",
    mustTry: true,
    imageSrc: "/menu/tra-chanh.jpeg",
  },
  {
    id: "matcha-latte",
    name: "Matcha Latte",
    price: 30000,
    category: "tra-tra-sua",
    imageSrc: "/menu/matcha-latte.jpeg",
  },
  {
    id: "cold-brew",
    name: "Cold Brew",
    price: 30000,
    category: "cafe",
    imageSrc: "/menu/cold-brew.jpeg",
  },
  {
    id: "cold-brew-chanh-vang",
    name: "Cold Brew chanh vàng",
    price: 35000,
    category: "cafe",
    mustTry: true,
    imageSrc: "/menu/cold-brew-chanh-vang.jpeg",
  },
  {
    id: "cafe-muoi",
    name: "Café muối",
    price: 30000,
    category: "cafe",
    mustTry: true,
    imageSrc: "/menu/cafe-muoi.jpeg",
  },
  {
    id: "cafe-sua",
    name: "Café sữa",
    price: 25000,
    category: "cafe",
    imageSrc: "/menu/cafe-sua.jpeg",
  },
  {
    id: "bac-xiu",
    name: "Bạc Xỉu",
    price: 25000,
    category: "cafe",
    imageSrc: "/menu/bac-xiu.jpeg",
  },
];

export function getMenuItem(id: string): MenuItem | undefined {
  return MENU_ITEMS.find((item) => item.id === id);
}

export function getTopping(id: string): Topping | undefined {
  return TOPPINGS.find((topping) => topping.id === id);
}

export function itemsByCategory(category: CategoryId): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.category === category);
}

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
