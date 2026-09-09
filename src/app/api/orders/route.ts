import { NextRequest, NextResponse } from "next/server";
import { formatDeliveryDateForMessage, isDeliverySlotAvailable, nowInVietnam } from "@/lib/delivery";
import { getClientIp } from "@/lib/http";
import { deliverySlotLabel, sugarIceLabel } from "@/lib/menu-data";
import { findMenuItemsByIds, findToppingsByIds } from "@/lib/menu-repository";
import { upsertCustomer } from "@/lib/customer-repository";
import { createOrder, type CreateOrderItemInput } from "@/lib/order-repository";
import { checkRateLimit } from "@/lib/rate-limit";
import { getStoreStatus, isEffectivelyClosed } from "@/lib/store-status-repository";
import { formatOrderMessage, sendTelegramMessageWithRetry, type OrderLineSummary } from "@/lib/telegram";
import { orderSchema } from "@/lib/validation";

const DEFAULT_CLOSED_MESSAGE = "Cửa hàng hiện đang tạm ngừng nhận đơn, vui lòng quay lại sau.";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ message: "Quá nhiều yêu cầu, vui lòng thử lại sau" }, { status: 429 });
  }

  const storeStatus = await getStoreStatus();
  if (isEffectivelyClosed(storeStatus)) {
    const message = storeStatus.closedNote || DEFAULT_CLOSED_MESSAGE;
    return NextResponse.json({ message }, { status: 422 });
  }

  const rawBody = await request.json().catch(() => null);
  if (rawBody === null) {
    return NextResponse.json({ errors: { body: "Payload không hợp lệ" } }, { status: 422 });
  }

  const parsed = orderSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { customerName, customerPhone, deliveryAddress, deliveryDate, deliverySlot, items } = parsed.data;

  const serverNow = nowInVietnam();
  if (!isDeliverySlotAvailable(deliveryDate, deliverySlot, serverNow)) {
    const message = "Khung giờ giao hàng đã chọn không còn khả dụng, vui lòng chọn lại ngày/giờ khác.";
    return NextResponse.json({ errors: { deliverySlot: message }, message }, { status: 422 });
  }

  const itemIds = [...new Set(items.map((line) => line.itemId))];
  const toppingIds = [...new Set(items.flatMap((line) => line.toppingIds))];
  const [itemsById, toppingsById] = await Promise.all([
    findMenuItemsByIds(itemIds),
    findToppingsByIds(toppingIds),
  ]);

  const summaryLines: OrderLineSummary[] = [];
  const orderItems: CreateOrderItemInput[] = [];
  let total = 0;

  for (const line of items) {
    const menuItem = itemsById.get(line.itemId);
    if (!menuItem) {
      return NextResponse.json(
        { errors: { items: `Món không tồn tại, đã ngừng bán, hoặc đã hết hàng: ${line.itemId}` } },
        { status: 422 },
      );
    }

    let unitPrice = menuItem.price;
    let sizeLabel: string | undefined;
    if (menuItem.sizes.length > 0) {
      const size = menuItem.sizes.find((s) => s.id === line.sizeId);
      if (!size) {
        return NextResponse.json(
          { errors: { items: `Vui lòng chọn size hợp lệ cho món: ${menuItem.name}` } },
          { status: 422 },
        );
      }
      unitPrice = size.price;
      sizeLabel = size.label;
    }

    const toppings: { id: string; name: string; price: number }[] = [];
    let toppingsPrice = 0;
    for (const toppingId of line.toppingIds) {
      const topping = toppingsById.get(toppingId);
      if (!topping) {
        return NextResponse.json(
          { errors: { items: `Topping không tồn tại: ${toppingId}` } },
          { status: 422 },
        );
      }
      toppings.push(topping);
      toppingsPrice += topping.price;
    }

    const lineTotalAmount = (unitPrice + toppingsPrice) * line.quantity;
    total += lineTotalAmount;

    summaryLines.push({
      name: menuItem.name,
      sizeLabel,
      quantity: line.quantity,
      toppingNames: toppings.map((t) => t.name),
      sugarLabel: sugarIceLabel(line.sugarLevel),
      iceLabel: sugarIceLabel(line.iceLevel),
      note: line.note,
      lineTotal: lineTotalAmount,
    });

    orderItems.push({
      itemId: menuItem.id,
      itemName: menuItem.name,
      sizeId: line.sizeId,
      sizeLabel,
      quantity: line.quantity,
      sugarLevel: line.sugarLevel,
      iceLevel: line.iceLevel,
      note: line.note,
      toppings,
      lineTotal: lineTotalAmount,
    });
  }

  let orderId: string;
  try {
    const created = await createOrder({
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryDate,
      deliverySlot,
      total,
      items: orderItems,
    });
    orderId = created.id;
  } catch (error) {
    console.error("[orders] Lưu đơn hàng vào database thất bại", error);
    return NextResponse.json(
      { message: "Không thể lưu đơn hàng, vui lòng thử lại sau." },
      { status: 500 },
    );
  }

  try {
    await upsertCustomer(customerPhone, customerName, deliveryAddress);
  } catch (error) {
    // Đơn hàng đã lưu — lưu hồ sơ khách chỉ phục vụ auto-fill lần sau, không chặn đơn hàng.
    console.error(`[orders] Lưu hồ sơ khách thất bại cho đơn ${orderId}`, error);
  }

  const orderSummary = {
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryDateLabel: formatDeliveryDateForMessage(deliveryDate, serverNow),
    deliverySlotLabel: deliverySlotLabel(deliverySlot),
    lines: summaryLines,
    total,
  };
  const message = formatOrderMessage(orderSummary);

  try {
    await sendTelegramMessageWithRetry(message);
  } catch (error) {
    // Đơn hàng đã lưu vào database — Telegram chỉ là kênh thông báo, không chặn đơn hàng.
    console.error(`[orders] Gửi Telegram thất bại cho đơn ${orderId}, cần kiểm tra thủ công`, error);
  }

  return NextResponse.json({ orderId, order_summary: orderSummary }, { status: 200 });
}
