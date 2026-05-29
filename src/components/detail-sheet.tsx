"use client";

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
        className={cn(
          "inset-y-3 right-3 h-auto rounded-2xl border shadow-2xl",
          "flex w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl",
        )}
      >
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
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
          <div className="flex items-center justify-end gap-2 border-t p-4">
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
