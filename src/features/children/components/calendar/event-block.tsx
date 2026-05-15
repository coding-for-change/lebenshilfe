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
  type CalendarEvent,
} from "./week-utils";

type Props = {
  ev: CalendarEvent;
  col: number;
  cols: number;
  onDelete: () => void;
  onMove: (newStartHour: number, newEndHour: number) => void | Promise<void>;
};

export function EventBlock({ ev, col, cols, onDelete, onMove }: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  // Visual offset (in fractional hours) while a drag-to-move is in progress.
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  const draggable = ev.layer !== "absence";
  const top = (ev.startHour - START_HOUR) * HOUR_HEIGHT;
  const height = Math.max(20, (ev.endHour - ev.startHour) * HOUR_HEIGHT);
  const visualTopOffset = (dragOffset ?? 0) * HOUR_HEIGHT;

  // Breathing room: an inset on every side so the surrounding grid is still
  // clickable for drag-to-create even when columns are densely packed.
  const SIDE_INSET = 4; // px on left + right
  const TOP_INSET = 3; // px on top + bottom

  // Per-column positioning. Cluster width is divided into `cols` slots; this
  // event occupies slot `col`.
  const slotWidthPct = 100 / cols;
  const leftPct = col * slotWidthPct;
  const style: React.CSSProperties = {
    top: top + visualTopOffset + TOP_INSET,
    height: Math.max(12, height - 2 * TOP_INSET),
    left: `calc(${leftPct}% + ${SIDE_INSET}px)`,
    width: `calc(${slotWidthPct}% - ${2 * SIDE_INSET}px)`,
  };

  let layerClasses = "";
  if (ev.layer === "schedule") {
    layerClasses =
      "z-0 bg-sky-500/15 border border-sky-500/40 text-sky-900 dark:text-sky-200";
  } else if (ev.layer === "assignment") {
    layerClasses =
      "z-10 bg-primary/15 border border-primary/40 text-foreground";
    if (ev.tandem) {
      layerClasses += " ring-1 ring-primary";
    }
  } else {
    // Absence: full-width backdrop, override the column slot.
    style.left = `${SIDE_INSET}px`;
    style.width = `calc(100% - ${2 * SIDE_INSET}px)`;
    layerClasses =
      "z-20 bg-red-500/15 border border-red-500/40 text-red-900 dark:text-red-200";
  }
  if (dragOffset !== null) {
    layerClasses += " ring-2 ring-primary cursor-grabbing";
  }

  // Drag-to-move on event blocks. Mouse-down records the starting Y. If the
  // pointer moves > 4px before release, we treat it as a drag and snap to
  // 15-minute increments. Otherwise the click opens the delete popover.
  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    // Stop the calendar grid from starting a drag-to-create on the same press.
    e.stopPropagation();

    if (!draggable) {
      // Click on absence: open popover; don't drag.
      setPopoverOpen(true);
      return;
    }

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
            "absolute flex flex-col gap-0.5 overflow-hidden rounded px-1.5 py-1 text-left text-[11px] leading-tight hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            draggable && "cursor-grab",
            layerClasses,
          )}
          style={style}
          onPointerDown={handlePointerDown}
        >
          <span className="font-medium">
            {ev.label}
            {ev.tandem ? (
              <span className="ml-1 rounded bg-primary px-1 py-px text-[9px] font-semibold text-primary-foreground">
                Tandem
              </span>
            ) : null}
          </span>
          {ev.sublabel ? (
            <span className="truncate text-[10px] opacity-80">
              {ev.sublabel}
            </span>
          ) : null}
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
            <div className="font-medium">{ev.label}</div>
            {ev.sublabel ? (
              <div className="text-xs text-muted-foreground">{ev.sublabel}</div>
            ) : null}
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
