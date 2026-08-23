import { z } from "zod";

const SUGAR_ICE_VALUES = ["khong", "it", "vua", "nhieu"] as const;
const DELIVERY_SLOT_VALUES = ["morning", "afternoon"] as const;
export const PHONE_REGEX = /^0[35789][0-9]{8}$/;

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
  customerPhone: z.string().trim().regex(PHONE_REGEX, "Số điện thoại không hợp lệ"),
  deliveryAddress: z.string().trim().min(1, "Vui lòng nhập địa chỉ giao hàng").max(200),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày giao hàng không hợp lệ"),
  deliverySlot: z.enum(DELIVERY_SLOT_VALUES, { message: "Vui lòng chọn khung giờ giao hàng" }),
  items: z.array(orderItemSchema).min(1, "Giỏ hàng đang trống"),
});

export type OrderInput = z.infer<typeof orderSchema>;

export const phoneQuerySchema = z.object({
  phone: z.string().trim().regex(PHONE_REGEX, "Số điện thoại không hợp lệ"),
});

const CLOSED_SCOPE_VALUES = ["shift", "day", "permanent", "range"] as const;
const DATETIME_LOCAL_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const storeStatusUpdateSchema = z
  .object({
    action: z.enum(["open", "close"]),
    scope: z.enum(CLOSED_SCOPE_VALUES).optional(),
    from: z.string().regex(DATETIME_LOCAL_REGEX).optional(),
    to: z.string().regex(DATETIME_LOCAL_REGEX).optional(),
    note: z.string().trim().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action !== "close") return;

    if (!data.scope) {
      ctx.addIssue({ code: "custom", message: "Thiếu phạm vi tắt nhận đơn", path: ["scope"] });
      return;
    }

    if (data.scope === "range") {
      if (!data.from) ctx.addIssue({ code: "custom", message: "Thiếu thời gian bắt đầu", path: ["from"] });
      if (!data.to) ctx.addIssue({ code: "custom", message: "Thiếu thời gian kết thúc", path: ["to"] });
    }
  });

export const menuItemUpdateSchema = z.object({
  soldOut: z.boolean(),
});

const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const createExpenseSchema = z.object({
  itemName: z.string().trim().min(1, "Vui lòng nhập nguyên liệu").max(120),
  amount: z.number().int().min(1, "Số tiền phải lớn hơn 0"),
  note: z.string().trim().max(200).optional(),
  purchasedAt: z.string().regex(DATE_KEY_REGEX, "Ngày không hợp lệ"),
});

export const expenseRangeQuerySchema = z.object({
  from: z.string().regex(DATE_KEY_REGEX, "Ngày không hợp lệ"),
  to: z.string().regex(DATE_KEY_REGEX, "Ngày không hợp lệ"),
});
