import { z } from "zod";

const SUGAR_ICE_VALUES = ["khong", "it", "vua", "nhieu"] as const;
const DELIVERY_SLOT_VALUES = ["morning", "afternoon"] as const;

export const orderItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  toppingIds: z.array(z.string()).default([]),
  sugarLevel: z.enum(SUGAR_ICE_VALUES),
  iceLevel: z.enum(SUGAR_ICE_VALUES),
  note: z.string().trim().max(200).optional(),
});

export const orderSchema = z.object({
  customerName: z.string().trim().min(1, "Vui lòng nhập tên").max(100),
  customerPhone: z
    .string()
    .trim()
    .regex(/^0[35789][0-9]{8}$/, "Số điện thoại không hợp lệ"),
  deliveryAddress: z.string().trim().min(1, "Vui lòng nhập địa chỉ giao hàng").max(200),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày giao hàng không hợp lệ"),
  deliverySlot: z.enum(DELIVERY_SLOT_VALUES, { message: "Vui lòng chọn khung giờ giao hàng" }),
  items: z.array(orderItemSchema).min(1, "Giỏ hàng đang trống"),
});

export type OrderInput = z.infer<typeof orderSchema>;
