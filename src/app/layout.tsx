import type { Metadata, Viewport } from "next";
import { Fraunces, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const TITLE = "IT HOUSE — Đặt trà & cà phê";
const DESCRIPTION = "Chọn món, để lại số điện thoại — IT HOUSE nhận đơn và liên hệ xác nhận ngay.";

export const metadata: Metadata = {
  metadataBase: new URL("https://order.trungtam.io.vn"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "IT HOUSE",
    images: [{ url: "/preview-web.jpeg", width: 1280, height: 672, alt: TITLE }],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/preview-web.jpeg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e9e4cf",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${fraunces.variable} ${beVietnamPro.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">{children}</body>
    </html>
  );
}
