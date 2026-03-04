import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, subtitle, icon, action, className }: Props) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        </div>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
