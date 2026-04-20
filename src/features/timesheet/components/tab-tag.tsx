"use client";

import { useMemo, useState } from "react";
import { Lock, Plus, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  formatDateLong,
  formatDuration,
  isSameUtcDay,
  relativeLabel,
  timeToMinutes,
} from "./date-utils";
import { WeekStrip } from "./week-strip";
import { deleteEventAction } from "../actions";
import type { Event } from "@/generated/prisma";
import type { ChildOption } from "./children-filter";

type EventWithChild = Event & {
  child: { firstName: string; lastName: string } | null;
};

type Props = {
  selectedDate: Date;
  today: Date;
  onSelectDate: (d: Date) => void;
  onRequestNewEntry: () => void;
  events: EventWithChild[];
  lockedMonths: Set<string>;
  assignedChildren: ChildOption[];
};

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function TabTag({
  selectedDate,
  today,
  onSelectDate,
  onRequestNewEntry,
  events,
  lockedMonths,
  assignedChildren,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const dayEvents = useMemo(
    () => events.filter((e) => isSameUtcDay(e.date, selectedDate)),
    [events, selectedDate],
  );
  const sickEvent = dayEvents.find((e) => e.type === "SICK");
  const workEvents = dayEvents.filter((e) => e.type === "WORK");
  const monthKey = `${selectedDate.getUTCFullYear()}-${
    selectedDate.getUTCMonth() + 1
  }`;
  const locked = lockedMonths.has(monthKey);

  const totalMinutes = workEvents.reduce(
    (sum, e) =>
      sum +
      (e.startTime && e.endTime
        ? timeToMinutes(e.endTime) - timeToMinutes(e.startTime)
        : 0),
    0,
  );
  const totalDuration =
    totalMinutes > 0
      ? `${Math.floor(totalMinutes / 60)}h${
          totalMinutes % 60 ? ` ${totalMinutes % 60}m` : ""
        }`
      : null;

  const canDelete = (ev: EventWithChild) =>
    !locked && Date.now() - ev.createdAt.getTime() <= EDIT_WINDOW_MS;

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteEventAction(id);
      toast.success("Eintrag gelöscht.");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Löschen fehlgeschlagen.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        today={today}
        events={events}
      />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {formatDateLong(selectedDate)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {relativeLabel(selectedDate, today)}
            {locked && (
              <>
                {" · "}
                <Lock className="inline size-3.5" /> gesperrt
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-right">
          {totalDuration && (
            <Badge variant="secondary" className="font-mono tabular-nums">
              {totalDuration}
            </Badge>
          )}
        </div>
      </div>

      {sickEvent && (
        <Card className="border-rose-200 bg-rose-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center size-10 rounded-full bg-rose-500/20 text-rose-700">
              <Stethoscope className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-rose-900">Krank · ganztägig</p>
              {sickEvent.note && (
                <p className="text-sm text-rose-900/80">{sickEvent.note}</p>
              )}
            </div>
            {canDelete(sickEvent) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(sickEvent.id)}
                disabled={busyId === sickEvent.id}
              >
                Löschen
              </Button>
            )}
          </div>
        </Card>
      )}

      {workEvents.length > 0 && (
        <div className="space-y-2">
          {workEvents.map((ev) => {
            const child = ev.child;
            const dur =
              ev.startTime && ev.endTime
                ? formatDuration(ev.startTime, ev.endTime)
                : "";
            return (
              <Card key={ev.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {child
                        ? `${child.firstName} ${child.lastName}`
                        : "Arbeit"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="font-mono">
                        {dur}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-emerald-200 text-emerald-700"
                      >
                        Signiert
                      </Badge>
                      {assignedChildren.length > 1 &&
                        workEvents.filter(
                          (w) =>
                            w.signatureKey === ev.signatureKey &&
                            w.id !== ev.id,
                        ).length > 0 && (
                          <Badge variant="outline">Mehrere Kinder</Badge>
                        )}
                    </div>
                    {ev.note && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ev.note}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {ev.startTime}–{ev.endTime}
                  </span>
                  {canDelete(ev) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(ev.id)}
                      disabled={busyId === ev.id}
                    >
                      Löschen
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {dayEvents.length === 0 && (
        <Card className="flex flex-col items-center gap-3 border-dashed py-10 text-center">
          <p className="text-sm text-muted-foreground">Keine Einträge</p>
          {!locked && (
            <Button onClick={onRequestNewEntry}>
              <Plus className="size-4" /> Eintrag hinzufügen
            </Button>
          )}
        </Card>
      )}

      {!locked && dayEvents.length > 0 && (
        <Button
          onClick={onRequestNewEntry}
          className="fixed bottom-24 right-4 size-14 rounded-full shadow-lg sm:bottom-6"
          aria-label="Neuer Eintrag"
        >
          <Plus className="size-6" />
        </Button>
      )}
      {!locked && dayEvents.length === 0 && (
        <Button
          onClick={onRequestNewEntry}
          className="fixed bottom-24 right-4 size-14 rounded-full shadow-lg sm:bottom-6"
          aria-label="Neuer Eintrag"
        >
          <Plus className="size-6" />
        </Button>
      )}
    </div>
  );
}
