import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, className }: Props) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-10 text-center shadow-sm", className)}>
      {icon ? <div className="mx-auto mb-3 inline-flex rounded-full bg-primary/10 p-2 text-primary">{icon}</div> : null}
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
