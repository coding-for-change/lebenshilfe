"use client";

import { Check, Minus } from "lucide-react";
import type { WizardFormState, WorkshopOption } from "../wizard-types";

type Props = {
  value: WizardFormState;
  workshops: WorkshopOption[];
  mode: "create" | "edit";
};

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("de-DE");
}

function FlagIcon({ on }: { on: boolean }) {
  return on ? (
    <Check className="size-4 text-green-600" />
  ) : (
    <Minus className="size-4 text-muted-foreground" />
  );
}

export function StepOverview({ value, workshops, mode }: Props) {
  const selectedWorkshops = value.workshops
    .filter((w) => w.selected)
    .map((w) => ({
      ...w,
      workshop: workshops.find((opt) => opt.id === w.workshopId),
    }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {mode === "create"
          ? "Prüfe die Angaben. Mit dem Absenden wird die Einladung per E-Mail verschickt."
          : "Prüfe die Änderungen vor dem Speichern."}
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
          value={formatDate(value.introductionDay)}
        />
        <Row
          label="Leos One"
          value={<FlagIcon on={value.leosOne} />}
        />
        <Row
          label="Outlook"
          value={<FlagIcon on={value.outlook} />}
        />
        <Row
          label="ZV neu nach Bescheid"
          value={<FlagIcon on={value.zvNeuNachBescheid} />}
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
          <ul className="flex flex-col gap-1.5">
            {selectedWorkshops.map((w) => (
              <li
                key={w.workshopId}
                className="flex items-center justify-between text-sm"
              >
                <span>{w.workshop?.name ?? w.workshopId}</span>
                <span className="text-muted-foreground">
                  {formatDate(w.attendedOn)}
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
