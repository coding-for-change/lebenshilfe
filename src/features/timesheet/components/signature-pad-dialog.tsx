"use client";

import { useCallback, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import SignaturePad from "signature_pad";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  signerLabel: string;
  onConfirm: (pngBase64: string) => void | Promise<void>;
  submitting?: boolean;
};

export function SignaturePadDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  signerLabel,
  onConfirm,
  submitting,
}: Props) {
  const padRef = useRef<SignaturePad | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const clear = useCallback(() => {
    padRef.current?.clear();
    setHasInk(false);
  }, []);

  // Use a ref callback so we initialise exactly when the Radix Dialog mounts
  // the canvas into the DOM, and tear down when it unmounts. We wait via rAF
  // until offsetWidth/Height are non-zero — during the dialog open animation
  // the canvas can be momentarily 0×0, and constructing signature_pad against
  // a zero-dim canvas leaves it in a state where pointer events fire but
  // strokes never render.
  const attachCanvas = useCallback((c: HTMLCanvasElement | null) => {
    if (!c) return;

    let cancelled = false;
    const init = () => {
      if (cancelled) return;
      const cssW = c.offsetWidth;
      const cssH = c.offsetHeight;
      if (cssW === 0 || cssH === 0) {
        requestAnimationFrame(init);
        return;
      }
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      c.width = cssW * ratio;
      c.height = cssH * ratio;
      c.getContext("2d")?.scale(ratio, ratio);

      const pad = new SignaturePad(c, {
        penColor: "#09090b",
        minWidth: 1,
        maxWidth: 2.4,
      });
      pad.addEventListener("beginStroke", () => setHasInk(true));
      padRef.current = pad;
    };
    requestAnimationFrame(init);

    return () => {
      cancelled = true;
      padRef.current?.off();
      padRef.current = null;
      setHasInk(false);
    };
  }, []);

  const confirm = async () => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    const data = pad.toDataURL("image/png");
    await onConfirm(data);
  };

  const today = new Date();
  const stamp = `${String(today.getDate()).padStart(2, "0")}.${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}.${today.getFullYear()}`;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={cn(!subtitle && "sr-only")}>
            {subtitle ?? `Unterschrift von ${signerLabel} erfassen.`}
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {signerLabel}
        </p>

        <div className="relative rounded-xl border-2 border-dashed border-border bg-white">
          <canvas
            ref={attachCanvas}
            className="block h-[220px] w-full touch-none rounded-xl"
          />
          {!hasInk && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/70">
              Hier unterschreiben
            </div>
          )}
          <div className="pointer-events-none absolute bottom-2 left-3 text-[10.5px] text-muted-foreground/80">
            × {stamp}
          </div>
          <div className="pointer-events-none absolute bottom-8 left-4 right-4 border-b border-dotted border-border" />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={clear}
            disabled={submitting}
          >
            <X className="size-4" /> Leeren
          </Button>
          <Button
            type="button"
            onClick={confirm}
            disabled={!hasInk || submitting}
            className={cn("min-w-36")}
          >
            <Check className="size-4" />
            {submitting ? "Speichern…" : "Bestätigen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
