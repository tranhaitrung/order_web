import { ReactNode } from "react";
import { SHOP } from "@/lib/menu-data";
import { AdminNav } from "@/app/admin/AdminNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="px-4 pt-6">
        <p className="font-display text-xl font-semibold text-ink">{SHOP.name} — Quản trị</p>
      </header>
      <div className="mt-4">
        <AdminNav />
      </div>
      <main className="px-4 py-5">{children}</main>
    </div>
  );
}
