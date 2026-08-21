import { NextRequest, NextResponse } from "next/server";
import { formatDeliveryDateForMessage, isDeliverySlotAvailable, nowInVietnam } from "@/lib/delivery";
import { deliverySlotLabel, getMenuItem, getTopping, SHOP, sugarIceLabel } from "@/lib/menu-data";
import { checkRateLimit } from "@/lib/rate-limit";
import { formatOrderMessage, sendTelegramMessageWithRetry, type OrderLineSummary } from "@/lib/telegram";
import { orderSchema } from "@/lib/validation";

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ message: "Quá nhiều yêu cầu, vui lòng thử lại sau" }, { status: 429 });
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

  const lines: OrderLineSummary[] = [];
  let total = 0;

  for (const line of items) {
    const menuItem = getMenuItem(line.itemId);
    if (!menuItem) {
      return NextResponse.json(
        { errors: { items: `Món không tồn tại hoặc đã ngừng bán: ${line.itemId}` } },
        { status: 422 },
      );
    }

    const toppingNames: string[] = [];
    let toppingsPrice = 0;
    for (const toppingId of line.toppingIds) {
      const topping = getTopping(toppingId);
      if (!topping) {
        return NextResponse.json(
          { errors: { items: `Topping không tồn tại: ${toppingId}` } },
          { status: 422 },
        );
      }
      toppingNames.push(topping.name);
      toppingsPrice += topping.price;
    }

    const lineTotal = (menuItem.price + toppingsPrice) * line.quantity;
    total += lineTotal;

    lines.push({
      name: menuItem.name,
      quantity: line.quantity,
      toppingNames,
      sugarLabel: sugarIceLabel(line.sugarLevel),
      iceLabel: sugarIceLabel(line.iceLevel),
      note: line.note,
      lineTotal,
    });
  }

  const orderSummary = {
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryDateLabel: formatDeliveryDateForMessage(deliveryDate, serverNow),
    deliverySlotLabel: deliverySlotLabel(deliverySlot),
    lines,
    total,
  };
  const message = formatOrderMessage(orderSummary);

  try {
    await sendTelegramMessageWithRetry(message);
  } catch (error) {
    console.error("[orders] Telegram send failed after retries", error);
    return NextResponse.json(
      {
        message: `Không gửi được đơn hàng, vui lòng liên hệ trực tiếp qua Zalo ${SHOP.zaloPhone}`,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ order_summary: orderSummary, telegram_sent: true }, { status: 200 });
}
