import { SHOP } from "@/lib/menu-data";

export function BrandHeader() {
  return (
    <header
      className="relative overflow-hidden px-4 pb-8 pt-10 text-center"
      style={{
        background:
          "radial-gradient(120% 100% at 50% -20%, var(--color-surface-alt) 0%, var(--color-bg) 70%)",
      }}
      aria-labelledby="shop-name"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full opacity-40 blur-2xl"
        style={{ background: "var(--color-primary-soft)" }}
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary font-display text-xl font-bold text-primary">
          IT
        </span>
        <h1 id="shop-name" className="font-display text-display-sm font-semibold text-ink">
          {SHOP.name}
        </h1>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">{SHOP.tagline}</p>
        <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-ink-soft">
          {SHOP.claims.map((claim) => (
            <li key={claim} className="flex items-center gap-1">
              <span aria-hidden className="text-primary">
                ✓
              </span>
              {claim}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
