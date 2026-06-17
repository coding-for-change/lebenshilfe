"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  END_HOUR,
  HOUR_HEIGHT,
  START_HOUR,
  snapHours,
  einsatzExceeds,
  type PositionedEvent,
} from "./week-utils";
import type { SerializedWorkEvent } from "../../serialize";

type Props = {
  ev: PositionedEvent;
  col: number;
  cols: number;
  einsaetze: SerializedWorkEvent[];
  onDelete: () => void;
  onMove: (newStartHour: number, newEndHour: number) => void | Promise<void>;
};

export function ScheduleEinsatzBlock({
  ev,
  col,
  cols,
  einsaetze,
  onDelete,
  onMove,
}: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  const top = (ev.startHour - START_HOUR) * HOUR_HEIGHT;
  const height = Math.max(20, (ev.endHour - ev.startHour) * HOUR_HEIGHT);
  const visualTopOffset = (dragOffset ?? 0) * HOUR_HEIGHT;

  const SIDE_INSET = 4;
  const TOP_INSET = 3;

  const slotWidthPct = 100 / cols;
  const leftPct = col * slotWidthPct;
  const style: React.CSSProperties = {
    top: top + visualTopOffset + TOP_INSET,
    height: Math.max(12, height - 2 * TOP_INSET),
    left: `calc(${leftPct}% + ${SIDE_INSET}px)`,
    width: `calc(${slotWidthPct}% - ${2 * SIDE_INSET}px)`,
  };

  const anyExceeds = einsaetze.some((e) =>
    einsatzExceeds(e, ev.startHour, ev.endHour),
  );

  const blockClasses = anyExceeds
    ? "z-0 bg-red-500/15 border border-red-500/40 text-red-900 dark:text-red-200"
    : "z-0 bg-sky-500/15 border border-sky-500/40 text-sky-900 dark:text-sky-200";

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    e.stopPropagation();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    let dragged = false;
    let lastOffset = 0;
    const minOffset = START_HOUR - ev.startHour;
    const maxOffset = END_HOUR - ev.endHour;

    const onMoveEv = (mv: PointerEvent) => {
      const dy = mv.clientY - startY;
      if (Math.abs(dy) > 4) dragged = true;
      const raw = snapHours(dy / HOUR_HEIGHT);
      lastOffset = Math.max(minOffset, Math.min(maxOffset, raw));
      setDragOffset(lastOffset);
    };
    const onUpEv = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener("pointermove", onMoveEv);
      target.removeEventListener("pointerup", onUpEv);
      target.removeEventListener("pointercancel", onUpEv);
      setDragOffset(null);
      if (dragged && lastOffset !== 0) {
        void onMove(ev.startHour + lastOffset, ev.endHour + lastOffset);
      } else if (!dragged) {
        setPopoverOpen(true);
      }
    };
    target.addEventListener("pointermove", onMoveEv);
    target.addEventListener("pointerup", onUpEv);
    target.addEventListener("pointercancel", onUpEv);
  }

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
    >
      <PopoverAnchor asChild>
        <button
          type="button"
          className={cn(
            "absolute flex flex-col gap-0.5 overflow-hidden rounded px-1.5 py-1 text-left text-[11px] leading-tight cursor-grab hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            blockClasses,
            dragOffset !== null && "ring-2 ring-primary cursor-grabbing",
          )}
          style={style}
          onPointerDown={handlePointerDown}
        >
          {ev.sublabel && (
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wide opacity-50">
                Stundenplan
              </span>
              <div className="font-medium">{ev.sublabel}</div>
            </div>
          )}
          {einsaetze.map((e) => {
            const exceeds = einsatzExceeds(e, ev.startHour, ev.endHour);
            return (
              <div
                key={e.id}
                className="border-t border-current/20 pt-0.5"
              >
                <span className="text-[9px] font-semibold uppercase tracking-wide opacity-50">
                  Einsatz
                </span>
                <div className="truncate font-medium">{e.userName}</div>
                <span
                  className={cn(
                    "font-semibold",
                    exceeds && "text-red-700 dark:text-red-300",
                  )}
                >
                  {e.startTime}–{e.endTime}
                </span>
              </div>
            );
          })}
        </button>
      </PopoverAnchor>
      <PopoverContent
        className="w-56 p-2"
        align="start"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerDownOutside={(e) => e.stopPropagation()}
      >
        <div
          className="flex flex-col gap-2 text-sm"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div>
            <div className="font-medium text-xs text-muted-foreground mb-1">
              Stundenplan {ev.sublabel}
            </div>
            {einsaetze.map((e) => {
              const exceeds = einsatzExceeds(e, ev.startHour, ev.endHour);
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      exceeds ? "bg-red-500" : "bg-sky-500",
                    )}
                  />
                  <span className="text-xs">
                    <span className="font-medium">{e.userName}</span>{" "}
                    {e.startTime}–{e.endTime}
                  </span>
                </div>
              );
            })}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
          >
            <Trash2 />
            Löschen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
