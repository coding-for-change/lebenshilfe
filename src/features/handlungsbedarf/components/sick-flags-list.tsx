"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CalendarOff,
  Info,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createVertretungAction,
  deleteWorkEventAsAdminAction,
} from "@/features/children/actions";
import {
  SchoolAssistantCombobox,
  type SchoolAssistantOption,
} from "@/features/children/components/calendar/school-assistant-combobox";
import type { ProblemFlag } from "../schemas";

/**
 * Krankheit-related subset of ProblemFlag — all four kinds carry a `date` and a
 * `childName`, which the row layout relies on.
 */
type KrankheitFlag = Extract<
  ProblemFlag,
  {
    kind:
      | "SB_SICK_NO_SUBSTITUTE"
      | "CHILD_ABSENT_BUT_WORK_BOOKED"
      | "CHILD_ABSENT_INFO"
      | "SUBSTITUTE_ALSO_SICK";
  }
>;

type Props = {
  flags: KrankheitFlag[];
  schoolAssistantOptions: SchoolAssistantOption[];
};

function formatGermanDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function SickFlagsList({ flags, schoolAssistantOptions }: Props) {
  if (flags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Keine offenen Krankheitsfälle in den nächsten 7 Tagen.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {flags.map((flag, i) => (
        <li
          key={`${flag.kind}-${i}`}
          className="p-3 sm:p-4"
        >
          <FlagRow
            flag={flag}
            schoolAssistantOptions={schoolAssistantOptions}
          />
        </li>
      ))}
    </ul>
  );
}

function FlagRow({
  flag,
  schoolAssistantOptions,
}: {
  flag: KrankheitFlag;
  schoolAssistantOptions: SchoolAssistantOption[];
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <FlagIcon kind={flag.kind} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{flag.childName}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatGermanDate(flag.date)}
            </span>
            <SeverityBadge kind={flag.kind} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <FlagHint flag={flag} />
          </p>
        </div>
      </div>
      <div className="sm:shrink-0">
        <QuickAction
          flag={flag}
          schoolAssistantOptions={schoolAssistantOptions}
        />
      </div>
    </div>
  );
}

function FlagIcon({ kind }: { kind: KrankheitFlag["kind"] }) {
  const Icon =
    kind === "SB_SICK_NO_SUBSTITUTE" || kind === "SUBSTITUTE_ALSO_SICK"
      ? AlertTriangle
      : kind === "CHILD_ABSENT_BUT_WORK_BOOKED"
        ? CalendarOff
        : Info;
  const colorClass =
    kind === "SB_SICK_NO_SUBSTITUTE" || kind === "SUBSTITUTE_ALSO_SICK"
      ? "text-red-500"
      : kind === "CHILD_ABSENT_BUT_WORK_BOOKED"
        ? "text-amber-500"
        : "text-muted-foreground";
  return <Icon className={cn("mt-0.5 size-5 shrink-0", colorClass)} />;
}

function SeverityBadge({ kind }: { kind: KrankheitFlag["kind"] }) {
  const { label, classes } =
    kind === "SB_SICK_NO_SUBSTITUTE"
      ? {
          label: "Vertretung fehlt",
          classes:
            "bg-red-500/15 text-red-900 dark:text-red-200 border-red-500/30",
        }
      : kind === "SUBSTITUTE_ALSO_SICK"
        ? {
            label: "Vertreter krank",
            classes:
              "bg-red-500/15 text-red-900 dark:text-red-200 border-red-500/30",
          }
        : kind === "CHILD_ABSENT_BUT_WORK_BOOKED"
          ? {
              label: "WORK trotz Krankheit",
              classes:
                "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30",
            }
          : {
              label: "Info",
              classes:
                "bg-muted/40 text-muted-foreground border-muted-foreground/30",
            };
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
        classes,
      )}
    >
      {label}
    </span>
  );
}

function FlagHint({ flag }: { flag: KrankheitFlag }) {
  switch (flag.kind) {
    case "SB_SICK_NO_SUBSTITUTE":
      return (
        <>
          Schulbegleiter <strong>{flag.sbName}</strong> ist krank — noch keine
          Vertretung eingetragen.
        </>
      );
    case "SUBSTITUTE_ALSO_SICK":
      return (
        <>
          Vertretung durch <strong>{flag.substituteName}</strong>, der/die
          selbst am gleichen Tag krank ist.
        </>
      );
    case "CHILD_ABSENT_BUT_WORK_BOOKED":
      return (
        <>
          Kind ist als krank markiert, aber <strong>{flag.workUserName}</strong>{" "}
          hat{" "}
          {flag.workStart && flag.workEnd
            ? `${flag.workStart}–${flag.workEnd}`
            : "WORK"}{" "}
          gebucht.
          {flag.absenceNote ? (
            <> Notiz: &bdquo;{flag.absenceNote}&ldquo;.</>
          ) : null}
        </>
      );
    case "CHILD_ABSENT_INFO":
      return (
        <>
          Kind ist krank gemeldet.
          {flag.absenceNote ? (
            <> Notiz: &bdquo;{flag.absenceNote}&ldquo;.</>
          ) : null}
        </>
      );
  }
}

function QuickAction({
  flag,
  schoolAssistantOptions,
}: {
  flag: KrankheitFlag;
  schoolAssistantOptions: SchoolAssistantOption[];
}) {
  if (
    flag.kind === "SB_SICK_NO_SUBSTITUTE" ||
    flag.kind === "SUBSTITUTE_ALSO_SICK"
  ) {
    return (
      <VertretungQuickAction
        childId={flag.childId}
        date={flag.date}
        schoolAssistantOptions={schoolAssistantOptions}
      />
    );
  }
  if (flag.kind === "CHILD_ABSENT_BUT_WORK_BOOKED") {
    return <DeleteWorkQuickAction workEventId={flag.workEventId} />;
  }
  return null;
}

function VertretungQuickAction({
  childId,
  date,
  schoolAssistantOptions,
}: {
  childId: string;
  date: string;
  schoolAssistantOptions: SchoolAssistantOption[];
}) {
  const [open, setOpen] = useState(false);
  const [substituteUserId, setSubstituteUserId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    if (!substituteUserId) return;
    startTransition(async () => {
      try {
        await createVertretungAction({ childId, substituteUserId, date });
        toast.success("Vertretung eingetragen.");
        setOpen(false);
        setSubstituteUserId(null);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
        );
      }
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSubstituteUserId(null);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className="w-full sm:w-auto"
        >
          <UserCheck className="size-3.5" /> Vertretung eintragen
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 p-3"
      >
        <div className="flex flex-col gap-2 text-sm">
          <div className="text-xs font-medium">Vertretung eintragen</div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Vertreter</Label>
            <SchoolAssistantCombobox
              options={schoolAssistantOptions}
              value={substituteUserId}
              onChange={setSubstituteUserId}
              placeholder="Wer vertritt?"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Zeit wird vom Stundenplan übernommen.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!substituteUserId || pending}
            >
              {pending ? "Speichert…" : "Anlegen"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DeleteWorkQuickAction({ workEventId }: { workEventId: string }) {
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("WORK-Eintrag wirklich löschen?")) return;
    startTransition(async () => {
      try {
        await deleteWorkEventAsAdminAction(workEventId);
        toast.success("WORK-Eintrag gelöscht.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Löschen fehlgeschlagen.",
        );
      }
    });
  };

  return (
    <Button
      size="sm"
      variant="destructive"
      className="w-full sm:w-auto"
      onClick={handleDelete}
      disabled={pending}
    >
      <Stethoscope className="size-3.5" /> WORK löschen
    </Button>
  );
}
