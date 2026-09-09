import { NextRequest, NextResponse } from "next/server";
import { findCustomerByPhone } from "@/lib/customer-repository";
import { getClientIp } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { phoneQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ message: "Quá nhiều yêu cầu, vui lòng thử lại sau" }, { status: 429 });
  }

  const parsed = phoneQuerySchema.safeParse({ phone: request.nextUrl.searchParams.get("phone") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ message: "Số điện thoại không hợp lệ" }, { status: 422 });
  }

  const customer = await findCustomerByPhone(parsed.data.phone);
  return NextResponse.json({ customer });
}
