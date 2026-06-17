"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Pinned action bar below the scrollable body (e.g. Speichern/Abbrechen). */
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/**
 * Mobile-first modal container: a bottom sheet on phones (< md), a centred
 * dialog on larger screens (>= md). Mirrors the proven timesheet
 * `NewEntrySheet` shell so admin forms/pickers feel like the same product.
 *
 * Keyboard handling is global: the root `interactive-widget=resizes-content`
 * viewport shrinks the layout when the soft keyboard opens, so `92dvh` + an
 * internally scrollable body keep the content (and the footer) reachable.
 */
export function MobileSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  bodyClassName,
}: Props) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="bottom"
        // Don't auto-focus the first field — that yanks the keyboard open the
        // instant the sheet appears, before the user has oriented themselves.
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "flex max-h-[92dvh] flex-col gap-0 rounded-t-2xl p-0",
          "md:inset-y-0 md:mx-auto md:my-auto md:h-fit md:max-h-[85dvh] md:max-w-lg md:rounded-2xl md:border",
          className,
        )}
      >
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        <div className={cn("flex-1 overflow-y-auto p-4", bodyClassName)}>
          {children}
        </div>
        {footer ? (
          <div
            className="flex items-center justify-end gap-2 border-t p-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
