"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Small secondary line(s) below the badges (e.g. dates, hours). */
  meta?: ReactNode;
  /** Status / flag chips. */
  badges?: ReactNode;
  /** Row action menu — pinned top-right; its taps never trigger `onClick`. */
  action?: ReactNode;
  onClick?: () => void;
  className?: string;
};

/**
 * The mobile counterpart of a table row: a full-width card with the primary
 * label and the action menu always co-visible (no horizontal scroll to reach
 * either). Used by every admin list below the `md` breakpoint.
 */
export function RecordCard({
  title,
  subtitle,
  meta,
  badges,
  action,
  onClick,
  className,
}: Props) {
  const interactive = typeof onClick === "function";

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "rounded-xl border bg-card p-3",
        interactive &&
          "cursor-pointer transition-colors active:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{title}</div>
          {subtitle ? (
            <div className="truncate text-sm text-muted-foreground">
              {subtitle}
            </div>
          ) : null}
        </div>
        {action ? (
          <div
            className="-mt-1 -mr-1 shrink-0"
            // Tapping the action menu must not also open the card.
            onClick={(e) => e.stopPropagation()}
          >
            {action}
          </div>
        ) : null}
      </div>
      {badges ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">{badges}</div>
      ) : null}
      {meta ? (
        <div className="mt-2 text-xs text-muted-foreground">{meta}</div>
      ) : null}
    </div>
  );
}
