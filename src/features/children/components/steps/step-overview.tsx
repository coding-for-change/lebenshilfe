"use client";

import { Check, Minus } from "lucide-react";
import type { CostBearerOption } from "@/features/cost-bearers";
import type { SchoolOption } from "@/features/schools";
import type { ChildWizardFormState } from "../../schemas";

type Props = {
  value: ChildWizardFormState;
  costBearerOptions: CostBearerOption[];
  schoolOptions: SchoolOption[];
};

export function StepOverviewChild({
  value,
  costBearerOptions,
  schoolOptions,
}: Props) {
  const kt = costBearerOptions.find((o) => o.id === value.kostentraegerId);
  const school = schoolOptions.find((o) => o.id === value.schoolId);
  return (
    <div className="flex flex-col gap-4 text-sm">
      <Section title="Stammdaten">
        <Row
          label="Name"
          value={`${value.firstName} ${value.lastName}`.trim()}
        />
        <Row
          label="Schule"
          value={school?.name ?? "—"}
        />
      </Section>

      <Section title="Verwaltung">
        <Row
          label="Kostenträger"
          value={kt?.name ?? "—"}
        />
        <Row
          label="SB / IB"
          value={value.sbIb || "—"}
        />
        <Row
          label="Bescheid"
          value={value.bescheid || "—"}
        />
        <Row
          label="Genehmigte direkte Leistung"
          value={
            value.approvedDirectHours
              ? `${value.approvedDirectHours} Std./Monat`
              : "—"
          }
        />
        <Row
          label="Genehmigte indirekte Leistung"
          value={
            value.approvedIndirectHours
              ? `${value.approvedIndirectHours} Std./Monat`
              : "—"
          }
        />
        <Flag
          label="Leos One"
          on={value.leosOne}
        />
        <Flag
          label="Schweigepflichtsentbindung"
          on={value.schweigepflichtsentbindung}
        />
        <Flag
          label="Vorviertelstunde"
          on={value.vorviertelstunde}
        />
        <Flag
          label="Nachviertelstunde"
          on={value.nachviertelstunde}
        />
        <Flag
          label="Ausflüge & Schullandheim"
          on={value.ausflugSchullandheim}
        />
        <Row
          label="Bemerkung"
          value={value.bemerkung || "—"}
        />
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
      <h4 className="mb-2 text-sm font-medium">{title}</h4>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-[max-content_1fr] sm:gap-x-4">
        {children}
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </>
  );
}

function Flag({ label, on }: { label: string; on: boolean }) {
  return (
    <>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5 text-sm">
        {on ? (
          <Check className="size-4 text-green-600" />
        ) : (
          <Minus className="size-4 text-muted-foreground" />
        )}
        {on ? "Ja" : "Nein"}
      </dd>
    </>
  );
}
