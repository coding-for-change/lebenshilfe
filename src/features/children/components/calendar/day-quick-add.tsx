"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Stethoscope, User, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  createAssignmentAction,
  createVertretungAction,
  deleteAbsenceAction,
  deleteAssignmentAction,
  deleteVertretungAction,
  saveAbsenceAction,
  updateVertretungAction,
} from "../../actions";
import type {
  SerializedAbsence,
  SerializedAssignment,
  SerializedSchedule,
  SerializedVertretung,
} from "../../serialize";
import { formatIsoDateLocal } from "@/lib/utils";
import {
  SchoolAssistantCombobox,
  type SchoolAssistantOption,
} from "./school-assistant-combobox";

type Props = {
  weekday: number;
  date: Date;
  childId: string;
  assignments: SerializedAssignment[];
  absence: SerializedAbsence | null;
  vertretungen: SerializedVertretung[];
  /** Schedules filtered to this weekday — used to preview Vertretung times. */
  daySchedules: SerializedSchedule[];
  schoolAssistantOptions: SchoolAssistantOption[];
  onChanged: () => void;
};

type Step = "choose" | "assignment" | "absence" | "vertretung";

export function DayQuickAddSection({
  weekday,
  date,
  childId,
  assignments,
  absence,
  vertretungen,
  daySchedules,
  schoolAssistantOptions,
  onChanged,
}: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");

  function reset() {
    setStep("choose");
  }

  async function handleDeleteAssignment(id: string) {
    try {
      await deleteAssignmentAction(id);
      toast.success("Zuweisung entfernt.");
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Löschen fehlgeschlagen.",
      );
    }
  }

  async function handleDeleteAbsence(id: string) {
    try {
      await deleteAbsenceAction(id);
      toast.success("Krankheitstag entfernt.");
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Löschen fehlgeschlagen.",
      );
    }
  }

  async function handleDeleteVertretung(childId: string, date: string) {
    try {
      await deleteVertretungAction(childId, date);
      toast.success("Vertretung entfernt.");
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Löschen fehlgeschlagen.",
      );
    }
  }

  const hasVertretung = vertretungen.length > 0;

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-1">
      {absence ? (
        <DayChip
          variant="absence"
          label="Krank"
          title={absence.note ?? undefined}
          onDelete={() => handleDeleteAbsence(absence.id)}
        />
      ) : null}

      {assignments.map((a) => (
        <DayChip
          key={a.id}
          variant="assignment"
          label={a.userName}
          title={a.tandem ? "Tandem" : undefined}
          tandem={a.tandem}
          strikethrough={hasVertretung}
          onDelete={() => handleDeleteAssignment(a.id)}
        />
      ))}

      {vertretungen.length > 0 && (
        <VertretungChip
          childId={childId}
          date={formatIsoDateLocal(date)}
          substituteUserId={vertretungen[0].substituteUserId}
          substituteUserName={vertretungen[0].substituteUserName}
          timeBlocks={vertretungen.map((v) => ({
            startTime: v.startTime,
            endTime: v.endTime,
          }))}
          schoolAssistantOptions={schoolAssistantOptions}
          onDelete={() =>
            handleDeleteVertretung(childId, formatIsoDateLocal(date))
          }
          onChanged={onChanged}
        />
      )}

      <Popover
        open={popoverOpen}
        onOpenChange={(next) => {
          setPopoverOpen(next);
          if (!next) reset();
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Zuweisung, Vertretung oder Krankheit hinzufügen"
            className="flex h-6 items-center justify-center rounded-md border border-dashed border-muted-foreground/40 text-muted-foreground transition-colors hover:border-primary hover:bg-accent/50 hover:text-foreground"
          >
            <Plus className="size-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className="w-64 p-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {step === "choose" ? (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setStep("assignment")}
                className="flex items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="size-2.5 rounded-sm bg-primary/70" />
                <User className="size-4" />
                <span className="font-medium">Zuweisung</span>
              </button>
              {vertretungen.length === 0 && (
                <button
                  type="button"
                  onClick={() => setStep("vertretung")}
                  className="flex items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="size-2.5 rounded-sm bg-amber-500/70" />
                  <UserCheck className="size-4" />
                  <span className="font-medium">Vertretung</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setStep("absence")}
                className="flex items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="size-2.5 rounded-sm bg-red-500/70" />
                <Stethoscope className="size-4" />
                <span className="font-medium">Krankheit</span>
              </button>
            </div>
          ) : step === "assignment" ? (
            <DayAssignmentForm
              childId={childId}
              weekday={weekday}
              schoolAssistantOptions={schoolAssistantOptions}
              onSaved={() => {
                setPopoverOpen(false);
                reset();
                onChanged();
              }}
              onBack={() => setStep("choose")}
            />
          ) : step === "vertretung" ? (
            <DayVertretungForm
              childId={childId}
              date={date}
              daySchedules={daySchedules}
              schoolAssistantOptions={schoolAssistantOptions}
              onSaved={() => {
                setPopoverOpen(false);
                reset();
                onChanged();
              }}
              onBack={() => setStep("choose")}
            />
          ) : (
            <DayAbsenceForm
              childId={childId}
              date={date}
              onSaved={() => {
                setPopoverOpen(false);
                reset();
                onChanged();
              }}
              onBack={() => setStep("choose")}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DayChip({
  variant,
  label,
  title,
  tandem,
  strikethrough,
  onDelete,
}: {
  variant: "assignment" | "absence";
  label: string;
  title?: string;
  tandem?: boolean;
  strikethrough?: boolean;
  onDelete: () => void;
}) {
  const styles = strikethrough
    ? "bg-muted/40 text-muted-foreground/60 border-muted-foreground/20"
    : variant === "assignment"
      ? "bg-primary/15 text-foreground border-primary/30"
      : "bg-red-500/15 text-red-900 dark:text-red-200 border-red-500/30";

  return (
    <div
      title={title ?? label}
      className={cn(
        "group/chip flex w-full min-w-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] leading-tight",
        styles,
      )}
    >
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          strikethrough && "line-through",
        )}
      >
        {label}
      </span>
      {tandem && !strikethrough ? (
        <span className="shrink-0 rounded bg-primary px-1 py-px text-[9px] font-semibold text-primary-foreground">
          T
        </span>
      ) : null}
      <button
        type="button"
        aria-label="Entfernen"
        onClick={onDelete}
        className="ml-auto shrink-0 opacity-0 transition-opacity group-hover/chip:opacity-100"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function VertretungChip({
  childId,
  date,
  substituteUserId: initialSubstituteUserId,
  substituteUserName,
  timeBlocks,
  schoolAssistantOptions,
  onDelete,
  onChanged,
}: {
  childId: string;
  date: string;
  substituteUserId: string;
  substituteUserName: string;
  timeBlocks: { startTime: string; endTime: string }[];
  schoolAssistantOptions: SchoolAssistantOption[];
  onDelete: () => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [substituteUserId, setSubstituteUserId] = useState(
    initialSubstituteUserId,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSubstituteUserId(initialSubstituteUserId);
      setError(null);
    }
  }, [open, initialSubstituteUserId]);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await updateVertretungAction(childId, date, { substituteUserId });
      toast.success("Vertretung aktualisiert.");
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  const timeDisplay = timeBlocks
    .map((b) => `${b.startTime}–${b.endTime}`)
    .join(", ");

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <div
        className={cn(
          "group/chip flex w-full min-w-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] leading-tight",
          "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30",
        )}
      >
        <PopoverAnchor asChild>
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left"
            onClick={() => setOpen(true)}
          >
            {substituteUserName}
          </button>
        </PopoverAnchor>
        <button
          type="button"
          aria-label="Entfernen"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-auto shrink-0 opacity-0 transition-opacity group-hover/chip:opacity-100"
        >
          <X className="size-3" />
        </button>
      </div>
      <PopoverContent
        align="center"
        className="w-64 p-3"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2 text-sm">
          <div className="text-xs font-medium">Vertretung bearbeiten</div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Vertreter</Label>
            <SchoolAssistantCombobox
              options={schoolAssistantOptions}
              value={substituteUserId}
              onChange={(id) => setSubstituteUserId(id ?? "")}
              placeholder="Wer vertritt?"
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Zeit: {timeDisplay} (laut Stundenplan)
          </p>

          {error ? (
            <div className="text-xs text-destructive">{error}</div>
          ) : null}

          <div className="flex justify-between gap-2 pt-1">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={busy}
            >
              Löschen
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={busy}
            >
              {busy ? "Speichert…" : "Speichern"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DayAssignmentForm({
  childId,
  weekday,
  schoolAssistantOptions,
  onSaved,
  onBack,
}: {
  childId: string;
  weekday: number;
  schoolAssistantOptions: SchoolAssistantOption[];
  onSaved: () => void;
  onBack: () => void;
}) {
  const [userId, setUserId] = useState(schoolAssistantOptions[0]?.id ?? "");
  const [tandem, setTandem] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!userId) {
      setError("Bitte Schulbegleiter wählen.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Whole-day assignment — the server still requires start/end so we
      // pin them to the visible day boundaries.
      await createAssignmentAction({
        childId,
        userId,
        weekday,
        startTime: "00:00",
        endTime: "23:59",
        tandem,
      });
      toast.success("Zuweisung gespeichert.");
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="text-xs font-medium">Neue Zuweisung</div>
      <SchoolAssistantCombobox
        options={schoolAssistantOptions}
        value={userId || null}
        onChange={(id) => setUserId(id ?? "")}
        placeholder="Schulbegleiter…"
      />
      <label className="flex cursor-pointer items-center gap-2">
        <Checkbox
          checked={tandem}
          onCheckedChange={(v) => setTandem(v === true)}
        />
        <span className="text-xs">Tandem</span>
      </label>
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={busy}
        >
          Zurück
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={busy}
        >
          {busy ? "Speichert…" : "Anlegen"}
        </Button>
      </div>
    </div>
  );
}

function DayVertretungForm({
  childId,
  date,
  daySchedules,
  schoolAssistantOptions,
  onSaved,
  onBack,
}: {
  childId: string;
  date: Date;
  daySchedules: SerializedSchedule[];
  schoolAssistantOptions: SchoolAssistantOption[];
  onSaved: () => void;
  onBack: () => void;
}) {
  const timeDisplay =
    daySchedules.length > 0
      ? daySchedules
          .slice()
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((s) => `${s.startTime}–${s.endTime}`)
          .join(", ")
      : "00:00–23:59";

  const [substituteUserId, setSubstituteUserId] = useState(
    schoolAssistantOptions[0]?.id ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!substituteUserId) {
      setError("Bitte den Vertreter wählen.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createVertretungAction({
        childId,
        substituteUserId,
        date: formatIsoDateLocal(date),
      });
      toast.success("Vertretung gespeichert.");
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="text-xs font-medium">Vertretung eintragen</div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Vertreter</Label>
        <SchoolAssistantCombobox
          options={schoolAssistantOptions}
          value={substituteUserId || null}
          onChange={(id) => setSubstituteUserId(id ?? "")}
          placeholder="Wer vertritt?"
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        Zeit: {timeDisplay} (laut Stundenplan)
      </p>

      {error ? <div className="text-xs text-destructive">{error}</div> : null}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={busy}
        >
          Zurück
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={busy}
        >
          {busy ? "Speichert…" : "Anlegen"}
        </Button>
      </div>
    </div>
  );
}

function DayAbsenceForm({
  childId,
  date,
  onSaved,
  onBack,
}: {
  childId: string;
  date: Date;
  onSaved: () => void;
  onBack: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await saveAbsenceAction({
        childId,
        date: formatIsoDateLocal(date),
        note: note.trim() || null,
      });
      toast.success("Krankheitstag gespeichert.");
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="text-xs font-medium">Krankheitstag</div>
      <Textarea
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notiz (optional)…"
      />
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={busy}
        >
          Zurück
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={busy}
        >
          {busy ? "Speichert…" : "Anlegen"}
        </Button>
      </div>
    </div>
  );
}
