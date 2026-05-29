"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WizardProgress } from "@/components/wizard-progress";
import { cn } from "@/lib/utils";

type WizardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Total number of steps. Omit to hide the progress bar. */
  steps?: number;
  /** 0-indexed current step. */
  current?: number;
  labels?: readonly string[];
  /**
   * When true, outside-click and Escape close attempts are ignored. Useful
   * during async submission so the dialog can't be dismissed mid-write.
   */
  busy?: boolean;
  /**
   * Called when the user submits the form (Enter on inputs, click on a
   * `type="submit"` button inside the footer). If omitted, the dialog still
   * renders a `<form>` (preventDefault'd) so Enter doesn't unexpectedly
   * navigate.
   */
  onSubmit?: () => void;
  /** Footer content (typically Back / Next / Submit buttons). */
  footer: React.ReactNode;
  /** Body content (the current step). */
  children: React.ReactNode;
  /**
   * Override max-width on desktop. Defaults to `sm:max-w-2xl`. Pass a Tailwind
   * class string (e.g. "sm:max-w-3xl") to widen specific wizards.
   */
  desktopMaxWidth?: string;
};

/**
 * Shared shell for multi-step wizards. On mobile it fills the viewport with a
 * sticky header (title + progress) and sticky footer (primary actions), so the
 * primary buttons are always reachable regardless of step content height. On
 * `sm:` and up it falls back to the standard centered dialog capped at
 * `85dvh`. The scrollable middle has `px-3 py-1 -mx-1` so input focus rings
 * are never clipped at the edges.
 */
export function WizardDialog({
  open,
  onOpenChange,
  title,
  description,
  steps,
  current,
  labels,
  busy = false,
  onSubmit,
  footer,
  children,
  desktopMaxWidth = "sm:max-w-2xl",
}: WizardDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        onInteractOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
        className={cn(
          // Mobile: anchor top-left, fill the viewport, no border/radius.
          "fixed inset-0 top-0 left-0 grid h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)] gap-0 rounded-none border-0 p-0",
          // Desktop: re-center, cap height, restore rounded card look.
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[85dvh] sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border",
          desktopMaxWidth,
        )}
      >
        <DialogHeader className="shrink-0 border-b bg-background px-6 pt-6 pb-4 text-left sm:rounded-t-lg">
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
          {steps != null && current != null ? (
            <div className="pt-2">
              <WizardProgress
                steps={steps}
                current={current}
                labels={labels}
              />
            </div>
          ) : null}
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (busy) return;
            onSubmit?.();
          }}
          className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto]"
        >
          <div className="-mx-1 min-h-0 overflow-y-auto px-7 py-3">
            {children}
          </div>
          <DialogFooter className="shrink-0 border-t bg-background px-6 py-4 sm:justify-between sm:rounded-b-lg">
            {footer}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
