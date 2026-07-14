"use client";

import Link from "next/link";
import { CalendarClock, FileWarning, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProblemFlag } from "../schemas";

type OtherFlag = Extract<
  ProblemFlag,
  {
    kind:
      | "SCHEDULE_BLOCK_UNASSIGNED"
      | "BOOKED_HOURS_OVER_SCHEDULE"
      | "MISSING_SCHWEIGEPFLICHT";
  }
>;

type Props = { flags: OtherFlag[] };

function formatGermanDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function OtherFlagsList({ flags }: Props) {
  if (flags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Keine weiteren problematischen Fälle.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {flags.map((flag, i) => (
        <li key={`${flag.kind}-${i}`}>
          <FlagRowWrapper flag={flag}>
            <FlagRow flag={flag} />
          </FlagRowWrapper>
        </li>
      ))}
    </ul>
  );
}

/**
 * Wrappt die ganze Zeile in einen Link, wenn der Flag-Typ einen direkten
 * Navigationsziel hat. Sonst nur ein neutraler Container mit Padding.
 */
function FlagRowWrapper({
  flag,
  children,
}: {
  flag: OtherFlag;
  children: React.ReactNode;
}) {
  if (flag.kind === "SCHEDULE_BLOCK_UNASSIGNED") {
    return (
      <Link
        href={`/admin/children?childId=${encodeURIComponent(flag.childId)}&tab=calendar`}
        className="block p-3 transition-colors hover:bg-muted/50 sm:p-4"
      >
        {children}
      </Link>
    );
  }
  return <div className="p-3 sm:p-4">{children}</div>;
}

function FlagRow({ flag }: { flag: OtherFlag }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <FlagIcon kind={flag.kind} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium">{flag.childName}</span>
          {flag.kind !== "MISSING_SCHWEIGEPFLICHT" ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatGermanDate(flag.date)}
            </span>
          ) : null}
          <SeverityBadge kind={flag.kind} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          <FlagHint flag={flag} />
        </p>
      </div>
    </div>
  );
}

function FlagIcon({ kind }: { kind: OtherFlag["kind"] }) {
  const Icon =
    kind === "SCHEDULE_BLOCK_UNASSIGNED"
      ? CalendarClock
      : kind === "BOOKED_HOURS_OVER_SCHEDULE"
        ? FileWarning
        : ShieldAlert;
  const colorClass =
    kind === "MISSING_SCHWEIGEPFLICHT"
      ? "text-red-500"
      : kind === "BOOKED_HOURS_OVER_SCHEDULE"
        ? "text-amber-500"
        : "text-muted-foreground";
  return <Icon className={cn("mt-0.5 size-5 shrink-0", colorClass)} />;
}

function SeverityBadge({ kind }: { kind: OtherFlag["kind"] }) {
  const { label, classes } =
    kind === "SCHEDULE_BLOCK_UNASSIGNED"
      ? {
          label: "Stundenplan ohne SB",
          classes:
            "bg-muted/40 text-muted-foreground border-muted-foreground/30",
        }
      : kind === "BOOKED_HOURS_OVER_SCHEDULE"
        ? {
            label: "Über Stundenplan",
            classes:
              "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30",
          }
        : {
            label: "Schweigepflicht fehlt",
            classes:
              "bg-red-500/15 text-red-900 dark:text-red-200 border-red-500/30",
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

function FlagHint({ flag }: { flag: OtherFlag }) {
  switch (flag.kind) {
    case "SCHEDULE_BLOCK_UNASSIGNED":
      return (
        <>
          Stundenplan-Block {flag.startTime}–{flag.endTime}, kein Schulbegleiter
          zugewiesen und keine Vertretung eingetragen.
        </>
      );
    case "BOOKED_HOURS_OVER_SCHEDULE":
      return (
        <>
          {formatMinutes(flag.bookedMinutes)} gebucht, Stundenplan sieht{" "}
          {formatMinutes(flag.scheduledMinutes)} vor (Differenz{" "}
          {formatMinutes(flag.bookedMinutes - flag.scheduledMinutes)}).
        </>
      );
    case "MISSING_SCHWEIGEPFLICHT":
      return <>Schweigepflichtsentbindung liegt noch nicht vor.</>;
  }
}
