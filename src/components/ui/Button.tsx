import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-[0_1px_0_0_theme(colors.white/0.15)_inset] hover:bg-primary-dark active:scale-[0.98] disabled:bg-ink-soft/40 disabled:text-white/70",
  ghost: "bg-transparent text-primary hover:bg-primary-soft active:scale-[0.98]",
  outline: "bg-surface text-ink border border-line hover:border-primary/40 active:scale-[0.98]",
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
