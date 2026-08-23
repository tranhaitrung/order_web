import Image from "next/image";
import { SHOP } from "@/lib/menu-data";

export function BrandHeader() {
  return (
    <header className="relative" aria-labelledby="shop-name">
      <h1 id="shop-name" className="sr-only">
        {SHOP.name} — {SHOP.tagline}
      </h1>
      <Image
        src="/banner.png"
        alt={`${SHOP.name} — ${SHOP.tagline}. ${SHOP.claims.join(", ")}.`}
        width={1264}
        height={843}
        priority
        sizes="100vw"
        className="h-auto w-full"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-bg to-transparent" />
    </header>
  );
}
