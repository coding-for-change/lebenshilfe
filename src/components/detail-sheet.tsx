"use client";

import { X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  /** Pinned action bar below the scrollable body (e.g. Bearbeiten/Speichern). */
  footer?: React.ReactNode;
};

export function DetailSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  bodyClassName,
  footer,
}: Props) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        // Custom 44px close lives in the header (the built-in one is a tiny
        // 16px target in the corner).
        showCloseButton={false}
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0",
          // Mobile: full-screen takeover.
          "inset-0 h-[100dvh] w-screen rounded-none border-0 sm:max-w-none",
          // Desktop (md+): docked card on the right with a margin.
          "md:inset-y-3 md:right-3 md:left-auto md:h-auto md:w-[calc(100%-1.5rem)] md:max-w-3xl md:rounded-2xl md:border md:shadow-2xl",
        )}
      >
        <SheetHeader className="flex-row items-start justify-between gap-2 border-b">
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate">{title}</SheetTitle>
            {description ? (
              <SheetDescription>{description}</SheetDescription>
            ) : null}
          </div>
          <SheetClose className="-mt-1 -mr-1 grid size-10 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-5" />
            <span className="sr-only">Schließen</span>
          </SheetClose>
        </SheetHeader>
        <div
          className={cn(
            "flex flex-1 flex-col gap-3 overflow-y-auto p-4",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer ? (
          <div
            className="flex flex-col-reverse gap-2 border-t p-4 max-md:[&>*]:w-full md:flex-row md:items-center md:justify-end"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
