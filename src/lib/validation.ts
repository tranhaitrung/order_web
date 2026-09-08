import { z } from "zod";

const SUGAR_ICE_VALUES = ["khong", "it", "vua", "nhieu"] as const;
const DELIVERY_SLOT_VALUES = ["morning", "afternoon"] as const;
export const PHONE_REGEX = /^0[35789][0-9]{8}$/;

export const orderItemSchema = z.object({
  itemId: z.string().min(1),
  sizeId: z.string().min(1).optional(),
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

const menuItemSizeInputSchema = z.object({
  label: z.string().trim().min(1, "Vui lòng nhập tên size").max(40),
  price: z.number().int().min(1000, "Giá phải lớn hơn 0"),
});

// Accepts a full external URL (https://...) or a local path under /public (e.g. /menu/tra-sua.jpeg) —
// existing seeded items use local paths, only newly-added items via the admin form use external links.
const imageSrcSchema = z
  .string()
  .trim()
  .refine((value) => /^https?:\/\//.test(value) || value.startsWith("/"), "Link ảnh không hợp lệ");

export const menuItemUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập tên món").max(120).optional(),
    price: z.number().int().min(1000, "Giá phải lớn hơn 0").optional(),
    category: z.string().trim().min(1, "Vui lòng chọn danh mục").optional(),
    imageSrc: imageSrcSchema.optional(),
    mustTry: z.boolean().optional(),
    soldOut: z.boolean().optional(),
    sizes: z.array(menuItemSizeInputSchema).max(6, "Tối đa 6 size").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Không có gì để cập nhật" });

export const menuItemCreateSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên món").max(120),
  price: z.number().int().min(1000, "Giá phải lớn hơn 0"),
  category: z.string().trim().min(1, "Vui lòng chọn danh mục"),
  imageSrc: imageSrcSchema,
  mustTry: z.boolean().optional(),
  sizes: z.array(menuItemSizeInputSchema).max(6, "Tối đa 6 size").optional(),
});

export const toppingCreateSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên topping").max(120),
  price: z.number().int().min(0, "Giá không hợp lệ"),
});

export const toppingUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Vui lòng nhập tên topping").max(120).optional(),
    price: z.number().int().min(0, "Giá không hợp lệ").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Không có gì để cập nhật" });

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["pending", "completed", "cancelled"]),
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

export const createManualRevenueSchema = z.object({
  amount: z.number().int().min(1, "Số tiền phải lớn hơn 0"),
  note: z.string().trim().max(200).optional(),
  entryDate: z.string().regex(DATE_KEY_REGEX, "Ngày không hợp lệ"),
});

export const manualRevenueRangeQuerySchema = expenseRangeQuerySchema;
