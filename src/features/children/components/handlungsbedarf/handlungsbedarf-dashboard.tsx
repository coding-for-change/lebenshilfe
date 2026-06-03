"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  cn,
  formatIsoDateLocal,
  formatShortDateWithWeekday,
} from "@/lib/utils";

import {
  addDays,
  germanWeekRangeLabel,
  startOfWeekMonday,
} from "../calendar/week-utils";
import type { SchoolAssistantOption } from "../calendar/school-assistant-combobox";
import { getHandlungsbedarfAction } from "../../actions";
import type {
  HandlungsbedarfCase,
  HandlungsbedarfCategory,
  HandlungsbedarfResult,
  HandlungsbedarfSeverity,
} from "../../handlungsbedarf";
import { AssignVertretungDialog } from "./assign-vertretung-dialog";

type Props = {
  initialResult: HandlungsbedarfResult;
  initialWeekStartIso: string;
  schoolAssistantOptions: SchoolAssistantOption[];
};

const SEVERITY_META: Record<
  HandlungsbedarfSeverity,
  { Icon: LucideIcon; iconClass: string; cardClass: string }
> = {
  critical: {
    Icon: TriangleAlert,
    iconClass: "text-red-600 dark:text-red-400",
    cardClass: "border-red-500/40 bg-red-500/5",
  },
  warning: {
    Icon: CircleAlert,
    iconClass: "text-amber-600 dark:text-amber-400",
    cardClass: "border-amber-500/40 bg-amber-500/5",
  },
  info: {
    Icon: Info,
    iconClass: "text-sky-600 dark:text-sky-400",
    cardClass: "border-border bg-muted/30",
  },
};

const CATEGORY_ORDER: {
  key: HandlungsbedarfCategory;
  label: string;
  hint: string;
}[] = [
  {
    key: "krankheit",
    label: "Krankheit & Vertretung",
    hint: "Erkrankte Schulbegleiter, abwesende Kinder und betroffene Vertretungen.",
  },
  {
    key: "weitere",
    label: "Weitere Handlungsbedarfe",
    hint: "Auffälligkeiten in Einsätzen und Stundenplänen.",
  },
  {
    key: "stammdaten",
    label: "Stammdaten-Hinweise",
    hint: "Fehlende Unterlagen — unabhängig von der gewählten Woche.",
  },
];

function parseIsoLocal(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function HandlungsbedarfDashboard({
  initialResult,
  initialWeekStartIso,
  schoolAssistantOptions,
}: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    parseIsoLocal(initialWeekStartIso),
  );
  const [result, setResult] = useState<HandlungsbedarfResult>(initialResult);
  const [loading, setLoading] = useState(false);

  function load(next: Date) {
    setWeekStart(next);
    setLoading(true);
    getHandlungsbedarfAction(formatIsoDateLocal(next))
      .then(setResult)
      .catch(() => toast.error("Handlungsbedarf konnte nicht geladen werden."))
      .finally(() => setLoading(false));
  }

  function refresh() {
    setLoading(true);
    getHandlungsbedarfAction(formatIsoDateLocal(weekStart))
      .then(setResult)
      .catch(() => toast.error("Aktualisieren fehlgeschlagen."))
      .finally(() => setLoading(false));
  }

  const { counts, cases } = result;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card px-5 py-5 shadow-none sm:px-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">
              Handlungsbedarf
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Problematische Fälle dieser Woche auf einen Blick.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(addDays(weekStart, -7))}
                aria-label="Vorherige Woche"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(startOfWeekMonday(new Date()))}
              >
                Heute
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(addDays(weekStart, 7))}
                aria-label="Nächste Woche"
              >
                <ChevronRight />
              </Button>
              <span className="ml-1 text-sm font-medium">
                {germanWeekRangeLabel(weekStart)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {counts.critical > 0 ? (
                <Badge variant="destructive">{counts.critical} kritisch</Badge>
              ) : null}
              {counts.warning > 0 ? (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                >
                  {counts.warning} Warnungen
                </Badge>
              ) : null}
              {counts.info > 0 ? (
                <Badge variant="secondary">{counts.info} Hinweise</Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "space-y-6 transition-opacity",
          loading && "pointer-events-none opacity-60",
        )}
      >
        {cases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <CircleCheck className="size-8 text-emerald-600 dark:text-emerald-400" />
              <p className="font-medium">
                Kein Handlungsbedarf in dieser Woche.
              </p>
              <p className="text-sm text-muted-foreground">
                Alle Fälle sind versorgt.
              </p>
            </CardContent>
          </Card>
        ) : (
          CATEGORY_ORDER.map((category) => {
            const sectionCases = cases.filter(
              (c) => c.category === category.key,
            );
            if (sectionCases.length === 0) return null;
            return (
              <Card key={category.key}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {category.label}{" "}
                    <span className="text-muted-foreground">
                      ({sectionCases.length})
                    </span>
                  </CardTitle>
                  <CardDescription>{category.hint}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sectionCases.map((c) => (
                    <CaseRow
                      key={c.id}
                      caseItem={c}
                      schoolAssistantOptions={schoolAssistantOptions}
                      onResolved={refresh}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function CaseRow({
  caseItem,
  schoolAssistantOptions,
  onResolved,
}: {
  caseItem: HandlungsbedarfCase;
  schoolAssistantOptions: SchoolAssistantOption[];
  onResolved: () => void;
}) {
  const meta = SEVERITY_META[caseItem.severity];
  const Icon = meta.Icon;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between",
        meta.cardClass,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", meta.iconClass)} />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{caseItem.title}</span>
            {caseItem.date ? (
              <Badge
                variant="outline"
                className="font-normal"
              >
                {formatShortDateWithWeekday(caseItem.date)}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {caseItem.description}
          </p>
        </div>
      </div>

      {caseItem.assign ? (
        <div className="shrink-0 sm:pl-3">
          <AssignVertretungDialog
            target={caseItem.assign}
            schoolAssistantOptions={schoolAssistantOptions}
            onResolved={onResolved}
          />
        </div>
      ) : null}
    </div>
  );
}
