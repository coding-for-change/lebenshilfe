"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import SignaturePad from "signature_pad";
import {
  Dialog,
  DialogContent,
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const clear = useCallback(() => {
    padRef.current?.clear();
    setHasInk(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const c = canvasRef.current;
    if (!c) return;

    const pad = new SignaturePad(c, {
      penColor: "#09090b",
      minWidth: 1,
      maxWidth: 2.4,
    });
    padRef.current = pad;

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const cssW = c.offsetWidth;
      const cssH = c.offsetHeight;
      if (cssW === 0 || cssH === 0) return;
      c.width = cssW * ratio;
      c.height = cssH * ratio;
      c.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
      setHasInk(false);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    pad.addEventListener("beginStroke", () => setHasInk(true));

    return () => {
      ro.disconnect();
      pad.off();
      padRef.current = null;
    };
  }, [open]);

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
        </DialogHeader>
        {subtitle && (
          <p className="text-sm text-muted-foreground -mt-2">{subtitle}</p>
        )}
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {signerLabel}
        </p>

        <div className="relative rounded-xl border-2 border-dashed border-border bg-white">
          <canvas
            ref={canvasRef}
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
