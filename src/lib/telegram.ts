import { formatVnd } from "@/lib/format";
import { SHOP } from "@/lib/menu-data";

export interface OrderLineSummary {
  name: string;
  sizeLabel?: string;
  quantity: number;
  toppingNames: string[];
  sugarLabel: string;
  iceLabel: string;
  note?: string;
  lineTotal: number;
}

export interface OrderSummary {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDateLabel: string;
  deliverySlotLabel: string;
  lines: OrderLineSummary[];
  total: number;
}

const RETRY_DELAYS_MS = [500, 1000, 2000];

export function formatOrderMessage(order: OrderSummary): string {
  const lines = order.lines
    .map((line) => {
      const size = line.sizeLabel ? ` (${line.sizeLabel})` : "";
      const toppings = line.toppingNames.length ? ` (+${line.toppingNames.join(", ")})` : "";
      const modifiers = `Đường: ${line.sugarLabel}, Đá: ${line.iceLabel}`;
      const note = line.note ? `\n   📝 ${line.note}` : "";
      return `• ${line.name}${size} x${line.quantity}${toppings} — ${formatVnd(line.lineTotal)}\n   ${modifiers}${note}`;
    })
    .join("\n");

  return [
    `🧋 <b>ĐƠN HÀNG MỚI — ${SHOP.name}</b>`,
    "",
    lines,
    "",
    `💰 <b>Tổng: ${formatVnd(order.total)}</b>`,
    "",
    `🚚 Giao hàng: ${order.deliveryDateLabel} — ${order.deliverySlotLabel}`,
    `📍 ${order.deliveryAddress}`,
    "",
    `👤 ${order.customerName}`,
    `📞 ${order.customerPhone}`,
  ].join("\n");
}

function isTelegramEnabled(): boolean {
  return process.env.TELEGRAM_ENABLED === "true";
}

async function sendTelegramMessageOnce(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("Telegram chưa được cấu hình: thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram API lỗi ${response.status}: ${body}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries with fixed backoff (500ms / 1s / 2s) per BA Spec Section 3 (BE). */
export async function sendTelegramMessageWithRetry(text: string): Promise<void> {
  if (!isTelegramEnabled()) {
    console.warn("[telegram] TELEGRAM_ENABLED != 'true' — bỏ qua gửi thật.\n" + text);
    return;
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      await sendTelegramMessageOnce(text);
      return;
    } catch (error) {
      lastError = error;
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay !== undefined) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
