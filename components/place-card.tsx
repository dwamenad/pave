import Image from "next/image";
import type { ReactNode } from "react";
import { Star } from "lucide-react";
import type { PlaceCard as PlaceCardType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  place: PlaceCardType;
  focused?: boolean;
  onClick?: () => void;
  footer?: ReactNode;
};

export function PlaceCard({ place, focused, onClick, footer }: Props) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
        focused ? "ring-2 ring-primary/35" : ""
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex gap-3">
        {place.photoUrl ? (
          <Image src={place.photoUrl} alt={place.name} width={96} height={96} className="h-20 w-20 rounded-lg object-cover" unoptimized />
        ) : (
          <div className="social-floating-gradient h-20 w-20 rounded-lg" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="line-clamp-1 text-sm font-bold text-slate-900">{place.name}</h4>
          <p className="line-clamp-2 text-xs text-slate-500">{place.address ?? "Address unavailable"}</p>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {place.rating ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {place.rating.toFixed(1)}
              </span>
            ) : null}
            {typeof place.priceLevel === "number" ? (
              <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">Price {place.priceLevel}</span>
            ) : null}
            {typeof place.openNow === "boolean" ? (
              <span className={cn("rounded-md px-2 py-1 font-semibold", place.openNow ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                {place.openNow ? "Open" : "Closed"}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </article>
  );
}
