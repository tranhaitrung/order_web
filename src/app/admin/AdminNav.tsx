"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin/orders", label: "Đơn hàng theo ngày" },
  { href: "/admin/revenue", label: "Doanh thu" },
  { href: "/admin/menu", label: "Quản lý món" },
  { href: "/admin/expenses", label: "Chi phí" },
  { href: "/admin/settings", label: "Cài đặt" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-line px-4">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
