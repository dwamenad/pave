import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLElement> & {
  title?: string;
  icon?: ReactNode;
};

export function RailCard({ title, icon, className, children, ...props }: Props) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", className)} {...props}>
      {title ? (
        <div className="mb-5 flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
        </div>
      ) : null}
      {children}
    </section>
  );
}
