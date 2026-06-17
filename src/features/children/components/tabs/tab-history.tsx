"use client";

import { useEffect, useState, useTransition } from "react";
import {
  FileDown,
  Loader2,
  Mail,
  Plus,
  Pencil,
  Trash,
  Undo2,
} from "lucide-react";
import { match } from "ts-pattern";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CostBearerExportDialog } from "@/features/kostentraeger-export";
import {
  listWorkEventsForChildAction,
  createWorkEventAsAdminAction,
  updateWorkEventAsAdminAction,
  deleteWorkEventAsAdminAction,
  restoreWorkEventAsAdminAction,
} from "../../actions";
import { formatMonthYearLong, formatShortDateWithWeekday } from "@/lib/utils";
import type { SerializedChild } from "../../serialize";

type Props = {
  child: SerializedChild;
  schoolAssistantOptions: { id: string; name: string }[];
};

type WorkEvent = Awaited<
  ReturnType<typeof listWorkEventsForChildAction>
>[number];

function groupByMonth(events: WorkEvent[]) {
  const groups = new Map<string, { label: string; rows: WorkEvent[] }>();
  for (const e of events) {
    const date = new Date(`${e.date}T00:00:00`);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups.has(key)) {
      groups.set(key, { label: formatMonthYearLong(date), rows: [] });
    }
    groups.get(key)!.rows.push(e);
  }
  return [...groups.entries()].map(([key, val]) => ({ key, ...val }));
}

function totalHours(events: WorkEvent[]) {
  let mins = 0;
  for (const e of events) {
    if (!e.startTime || !e.endTime) continue;
    const [h1, m1] = e.startTime.split(":").map(Number);
    const [h2, m2] = e.endTime.split(":").map(Number);
    mins += h2 * 60 + m2 - (h1 * 60 + m1);
  }
  return (mins / 60).toFixed(2).replace(".", ",");
}

/** Earliest calendar year present in the events, or undefined when none. */
function earliestEventYear(events: WorkEvent[]): number | undefined {
  if (events.length === 0) return undefined;
  return events.reduce((earliest, event) => {
    const year = new Date(`${event.date}T00:00:00`).getFullYear();
    return year < earliest ? year : earliest;
  }, Number.POSITIVE_INFINITY);
}

type LoadState =
  | { status: "loading"; childId: string }
  | { status: "loaded"; childId: string; events: WorkEvent[] }
  | { status: "error"; childId: string; message: string };

export function TabHistory({ child, schoolAssistantOptions }: Props) {
  const [state, setState] = useState<LoadState>({
    status: "loading",
    childId: child.id,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WorkEvent | null>(null);
  const [formData, setFormData] = useState({
    userId: "",
    date: "",
    startTime: "",
    endTime: "",
    note: "",
  });
  const [isPending, startTransition] = useTransition();
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listWorkEventsForChildAction(child.id)
      .then((rows) => {
        if (!cancelled) {
          setState({ status: "loaded", childId: child.id, events: rows });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: "error",
            childId: child.id,
            message:
              err instanceof Error ? err.message : "Laden fehlgeschlagen.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [child.id]);

  const minYear =
    state.status === "loaded" ? earliestEventYear(state.events) : undefined;

  const reload = () =>
    listWorkEventsForChildAction(child.id).then((rows) =>
      setState({ status: "loaded", childId: child.id, events: rows }),
    );

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({
      userId: "",
      date: new Date().toISOString().slice(0, 10),
      startTime: "",
      endTime: "",
      note: "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (e: WorkEvent) => {
    setEditingEvent(e);
    setFormData({
      userId: e.userId ?? "",
      date: e.date,
      startTime: e.startTime ?? "",
      endTime: e.endTime ?? "",
      note: e.note ?? "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Eintrag wirklich löschen?")) return;
    startTransition(async () => {
      try {
        await deleteWorkEventAsAdminAction(id);
        toast.success("Eintrag gelöscht.");
        reload();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Fehler beim Löschen.",
        );
      }
    });
  };

  const handleRestore = (id: string) => {
    startTransition(async () => {
      try {
        await restoreWorkEventAsAdminAction(id);
        toast.success("Eintrag wiederhergestellt.");
        reload();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Fehler beim Wiederherstellen.",
        );
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editingEvent) {
          await updateWorkEventAsAdminAction(editingEvent.id, {
            ...formData,
            userId: formData.userId || undefined,
            note: formData.note || undefined,
          });
          toast.success("Eintrag aktualisiert.");
        } else {
          if (!formData.userId) throw new Error("Benutzer auswählen.");
          await createWorkEventAsAdminAction({
            childId: child.id,
            userId: formData.userId,
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            note: formData.note || undefined,
          });
          toast.success("Eintrag hinzugefügt.");
        }
        setDialogOpen(false);
        reload();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
        );
      }
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Übersicht aller Arbeitszeiten der Schulbegleiter mit{" "}
            <strong>
              {child.firstName} {child.lastName}
            </strong>
            .
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenAdd}
            >
              <Plus className="mr-1 h-4 w-4" />
              Eintrag
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
            >
              <FileDown />
              PDF erstellen
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    type="button"
                    size="sm"
                    disabled
                  >
                    <Mail />
                    An Kostenstelle senden
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Kommt in Kürze.</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {match(state)
          .with({ status: "error", childId: child.id }, ({ message }) => (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
              {message}
            </div>
          ))
          .with({ status: "loaded", childId: child.id, events: [] }, () => (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Noch keine erfassten Zeiten.
            </div>
          ))
          .with({ status: "loaded", childId: child.id }, ({ events }) => (
            <div className="flex flex-col gap-3">
              {groupByMonth(events).map(({ key, label, rows }) => (
                <div
                  key={key}
                  className="overflow-hidden rounded-md border"
                >
                  <div className="flex items-baseline justify-between gap-2 border-b bg-muted/40 px-4 py-2">
                    <h4 className="text-sm font-medium">{label}</h4>
                    <span className="text-xs text-muted-foreground">
                      {rows.length} Eintrag {rows.length === 1 ? "" : "e"} ·{" "}
                      {totalHours(rows)} h
                    </span>
                  </div>
                  <ul className="divide-y">
                    {rows.map((r) => (
                      <li
                        key={r.id}
                        className={`grid grid-cols-1 gap-1.5 px-4 py-3 text-sm hover:bg-muted/30 md:grid-cols-[max-content_1fr_max-content_max-content] md:items-center md:gap-3 md:py-2 ${
                          r.deleted ? "opacity-60" : ""
                        }`}
                      >
                        <span
                          className={`font-medium ${
                            r.deleted ? "line-through" : ""
                          }`}
                        >
                          {formatShortDateWithWeekday(r.date)}
                        </span>
                        <span className="text-muted-foreground flex flex-col gap-0.5">
                          <span className="flex items-center gap-2">
                            {r.userName}
                            {r.signed ? (
                              <span className="rounded bg-emerald-500/10 px-1 py-0.5 text-[10px] text-emerald-600">
                                Unterschrieben
                              </span>
                            ) : (
                              <span className="rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">
                                Admin
                              </span>
                            )}
                            {r.deleted && (
                              <span className="rounded bg-destructive/10 px-1 py-0.5 text-[10px] text-destructive">
                                Gelöscht/Bearbeitet
                              </span>
                            )}
                          </span>
                          {r.note && (
                            <span className="text-xs">Hinweis: {r.note}</span>
                          )}
                        </span>
                        <span className="tabular-nums">
                          {r.startTime ?? "—"} – {r.endTime ?? "—"}
                        </span>
                        <div className="flex items-center gap-1">
                          {r.deleted ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleRestore(r.id)}
                                >
                                  <Undo2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Wiederherstellen</TooltipContent>
                            </Tooltip>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenEdit(r)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(r.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))
          .otherwise(() => (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Lade Historie…
            </div>
          ))}

        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEvent
                  ? "Eintrag bearbeiten"
                  : "Neuen Eintrag hinzufügen"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label>Mitarbeiter</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, userId: v }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bitte wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolAssistantOptions.map((opt) => (
                      <SelectItem
                        key={opt.id}
                        value={opt.id}
                      >
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Von</Label>
                  <Input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, startTime: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Bis</Label>
                  <Input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, endTime: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Hinweis (optional)</Label>
                <Input
                  type="text"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, note: e.target.value }))
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isPending}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Speichern
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <CostBearerExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          childId={child.id}
          childName={`${child.firstName} ${child.lastName}`}
          minYear={minYear}
        />
      </div>
    </TooltipProvider>
  );
}
