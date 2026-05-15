"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAutosave } from "@/components/use-autosave";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { adminDeleteEventAction, adminUpdateEventAction } from "../actions";
import type {
  SerializedAdminEditEntry,
  SerializedAdminEvent,
} from "../actions";
import type { UpdateEventInput } from "../schemas";
import { formatDayLabel } from "../lib/group";

type Props = {
  event: SerializedAdminEvent;
  edits: SerializedAdminEditEntry[];
  /** True when the event's month already has a signed MonthlyReport for this
   *  user. Shown as a small badge so admins know they're editing data that
   *  was already attested to. */
  isMonthSigned: boolean;
  /** Right-aligned secondary line. e.g. SB name on child Historie. */
  secondary?: React.ReactNode;
  onDeleted?: () => void;
};

type RowForm = {
  startTime: string;
  endTime: string;
  note: string;
};

function fromEvent(e: SerializedAdminEvent): RowForm {
  return {
    startTime: e.startTime ?? "",
    endTime: e.endTime ?? "",
    note: e.note ?? "",
  };
}

function diff(base: RowForm, next: RowForm): UpdateEventInput | null {
  const patch: Partial<UpdateEventInput> = {};
  if (next.startTime !== base.startTime && next.startTime) {
    patch.startTime = next.startTime;
  }
  if (next.endTime !== base.endTime && next.endTime) {
    patch.endTime = next.endTime;
  }
  if (next.note.trim() !== base.note.trim()) {
    patch.note = next.note.trim() || null;
  }
  if (patch.startTime || patch.endTime) {
    const start = patch.startTime ?? next.startTime;
    const end = patch.endTime ?? next.endTime;
    if (start && end && !(end > start)) return null;
  }
  return Object.keys(patch).length > 0 ? (patch as UpdateEventInput) : null;
}

export function AdminEventRow({
  event,
  edits,
  isMonthSigned,
  secondary,
  onDeleted,
}: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { form, update } = useAutosave<
    SerializedAdminEvent,
    RowForm,
    UpdateEventInput
  >({
    entity: event,
    entityKey: event.id,
    toForm: fromEvent,
    diff,
    persist: async (patch) => {
      await adminUpdateEventAction(event.id, patch);
    },
  });

  async function handleDelete() {
    if (deleting) return;
    if (
      !window.confirm(
        "Diesen Eintrag wirklich löschen? Die Änderung wird im Verlauf protokolliert.",
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await adminDeleteEventAction(event.id);
      onDeleted?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Löschen fehlgeschlagen.",
      );
      setDeleting(false);
    }
  }

  const isSick = event.type === "SICK";
  const editsCount = edits.length;

  return (
    <li className="flex flex-col gap-2 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="min-w-[8ch] font-medium">
          {formatDayLabel(event.date)}
        </span>

        {isSick ? (
          <span className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
            Krankheit (ganztägig)
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <Input
              type="time"
              aria-label="Startzeit"
              value={form.startTime}
              onChange={(e) => update({ startTime: e.target.value })}
              className="h-8 w-[7.5rem] tabular-nums"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="time"
              aria-label="Endzeit"
              value={form.endTime}
              onChange={(e) => update({ endTime: e.target.value })}
              className="h-8 w-[7.5rem] tabular-nums"
            />
          </div>
        )}

        {secondary ? (
          <span className="text-muted-foreground">{secondary}</span>
        ) : null}

        <div className="ml-auto flex items-center gap-1">
          {isMonthSigned ? (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <CheckCircle2 className="size-3" />
                    unterschrieben
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Dieser Monat wurde bereits vom Vorgesetzten unterschrieben.
                  Änderungen werden protokolliert; der ursprüngliche
                  Monatsbericht bleibt unverändert.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          {editsCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setShowHistory((v) => !v)}
            >
              <ChevronDown
                className={`size-3 transition-transform ${
                  showHistory ? "rotate-180" : ""
                }`}
              />
              {editsCount} Änderung{editsCount === 1 ? "" : "en"}
            </Button>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={deleting}
            onClick={handleDelete}
            aria-label="Eintrag löschen"
          >
            {deleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      <Textarea
        value={form.note}
        onChange={(e) => update({ note: e.target.value })}
        placeholder="Notiz (optional)"
        rows={1}
        className="min-h-8 resize-y text-sm"
      />

      {showHistory && editsCount > 0 ? (
        <ol className="ml-2 flex flex-col gap-1 border-l pl-3 text-xs text-muted-foreground">
          {edits.map((edit) => (
            <li
              key={edit.id}
              className="flex flex-wrap gap-x-2"
            >
              <span className="tabular-nums">
                {new Date(edit.editedAt).toLocaleString("de-DE")}
              </span>
              <span>·</span>
              <span>{edit.editedByName}</span>
              <span>·</span>
              <span className="tabular-nums">
                {edit.kind === "DELETE" ? (
                  <>
                    gelöscht (war {edit.prevStartTime ?? "—"}–
                    {edit.prevEndTime ?? "—"})
                  </>
                ) : (
                  <>
                    {edit.prevStartTime ?? "—"}–{edit.prevEndTime ?? "—"} →{" "}
                    {edit.nextStartTime ?? "—"}–{edit.nextEndTime ?? "—"}
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </li>
  );
}
