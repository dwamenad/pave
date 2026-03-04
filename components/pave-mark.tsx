import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function PaveMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
      {...props}
    >
      <path
        d="M6 42c3.8-9.4 11.4-14.5 20.2-14.5 2.8 0 5.6.6 8.1 1.8"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M33.9 7.5c-9.3 0-16.8 7.5-16.8 16.8 0 7.8 5.4 14.6 13 16.4l3.8 9.3 3.8-9.3c7.6-1.8 13-8.6 13-16.4 0-9.3-7.5-16.8-16.8-16.8zm0 8.8a8 8 0 110 16 8 8 0 010-16z"
        fill="currentColor"
      />
    </svg>
  );
}
