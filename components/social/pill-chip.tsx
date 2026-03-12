import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon?: ReactNode;
};

export function PillChip({ active, icon, className, children, type = "button", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
        className
      )}
      type={type}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
