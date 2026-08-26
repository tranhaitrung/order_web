import { SHOP } from "@/lib/menu-data";

/** Fixed circular button that deep-links to Zalo chat via zalo.me — opens the app if installed. */
export function ZaloButton({ liftedByCartBar }: { liftedByCartBar: boolean }) {
  return (
    <a
      href={`https://zalo.me/${SHOP.zaloPhone}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat Zalo"
      className={`fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0068ff] shadow-[var(--shadow-float)] transition-[bottom] duration-200 ease-out active:scale-95 ${
        liftedByCartBar ? "bottom-24" : "bottom-[max(1.25rem,env(safe-area-inset-bottom))]"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="white" strokeWidth={2}>
        <path
          d="M12 3C6.98 3 3 6.58 3 11c0 2.5 1.29 4.73 3.32 6.2-.1.98-.4 2.24-1.13 3.35 1.5-.28 3-.98 4.02-1.72.88.2 1.81.32 2.79.32 5.02 0 9-3.58 9-8s-3.98-8-9-8Z"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
