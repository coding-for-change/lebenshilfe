"use client";

import { FlagCell } from "@/components/flag-cell";
import { formatDate } from "@/lib/utils";
import type { WizardFormState, WorkshopOption } from "../wizard-types";

type Props = {
  value: WizardFormState;
  workshops: WorkshopOption[];
};

export function StepOverview({ value, workshops }: Props) {
  const selectedWorkshops = value.workshops
    .filter((w) => w.selected)
    .map((w) => ({
      ...w,
      workshop: workshops.find((opt) => opt.id === w.workshopId),
    }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Prüfe die Angaben. Mit dem Absenden wird die Einladung per E-Mail
        verschickt.
      </p>

      <Section title="Stammdaten">
        <Row
          label="Name"
          value={value.name || "—"}
        />
        <Row
          label="E-Mail"
          value={value.email || "—"}
        />
      </Section>

      <Section title="Vertrag">
        <Row
          label="Stunden"
          value={value.weeklyHours ? `${value.weeklyHours} h/Woche` : "—"}
        />
        <Row
          label="Einführungstag"
          value={
            value.introductionDay ? formatDate(value.introductionDay) : "—"
          }
        />
        <Row
          label="Leos One"
          value={<FlagCell on={value.leosOne} />}
        />
        <Row
          label="Outlook"
          value={<FlagCell on={value.outlook} />}
        />
        <Row
          label="ZV neu nach Bescheid"
          value={<FlagCell on={value.zvNeuNachBescheid} />}
        />
        {value.zvNeuNachBescheid && value.zvNeuNote ? (
          <Row
            label="Notiz"
            value={value.zvNeuNote}
          />
        ) : null}
      </Section>

      <Section title="Workshops">
        {selectedWorkshops.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine ausgewählt.</p>
        ) : (
          <ul className="flex flex-col gap-2 sm:gap-1.5">
            {selectedWorkshops.map((w) => (
              <li
                key={w.workshopId}
                className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <span>{w.workshop?.name ?? w.workshopId}</span>
                <span className="text-muted-foreground">
                  {w.attendedOn ? formatDate(w.attendedOn) : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
