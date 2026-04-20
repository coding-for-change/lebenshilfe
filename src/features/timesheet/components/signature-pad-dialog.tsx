"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
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
  const [hasInk, setHasInk] = useState(false);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const c = canvasRef.current;
    if (!c) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = c.clientWidth;
      const cssH = c.clientHeight;
      if (cssW === 0 || cssH === 0) return;
      const nextW = Math.floor(cssW * dpr);
      const nextH = Math.floor(cssH * dpr);
      if (c.width === nextW && c.height === nextH) return;
      c.width = nextW;
      c.height = nextH;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#09090b";
      ctx.lineWidth = 2.4;
      setHasInk(false);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    return () => ro.disconnect();
  }, [open]);

  const toLocal = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const scaleX = rect.width ? c.clientWidth / rect.width : 1;
    const scaleY = rect.height ? c.clientHeight / rect.height : 1;
    return {
      x: (ev.clientX - rect.left) * scaleX,
      y: (ev.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    ev.preventDefault();
    canvasRef.current?.setPointerCapture(ev.pointerId);
    drawingRef.current = true;
    lastPointRef.current = toLocal(ev);
  };

  const onPointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const last = lastPointRef.current;
    if (!ctx || !last) return;
    const p = toLocal(ev);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
    if (!hasInk) setHasInk(true);
  };

  const onPointerUp = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastPointRef.current = null;
    try {
      canvasRef.current?.releasePointerCapture(ev.pointerId);
    } catch {}
  };

  const confirm = async () => {
    const c = canvasRef.current;
    if (!c || !hasInk) return;
    const data = c.toDataURL("image/png");
    await onConfirm(data);
  };

  const today = new Date();
  const stamp = `${String(today.getDate()).padStart(2, "0")}.${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}.${today.getFullYear()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
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
