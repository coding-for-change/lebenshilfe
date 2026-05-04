"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageSection } from "@/components/page-section";
import { SearchableTable } from "@/components/searchable-table";
import { SchoolAssistantRowActions } from "./school-assistant-row-actions";
import { SchoolAssistantWizard } from "./school-assistant-wizard";
import { StatusBadge } from "./status-badge";
import type { WizardFormState, WorkshopOption } from "./wizard-types";
import type { SerializedProfile } from "../serialize";

type Props = {
  profiles: SerializedProfile[];
  workshops: WorkshopOption[];
};

function formatIsoDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("de-DE");
}

function FlagCell({ on }: { on: boolean }) {
  return on ? (
    <Check className="size-4 text-green-600" />
  ) : (
    <Minus className="size-4 text-muted-foreground" />
  );
}

function profileToFormState(
  profile: SerializedProfile,
  workshops: WorkshopOption[],
): WizardFormState {
  const attendanceMap = new Map(
    profile.attendances.map((a) => [a.workshopId, a]),
  );
  return {
    name: profile.name,
    email: profile.email,
    leosOne: profile.leosOne,
    outlook: profile.outlook,
    weeklyHours: profile.weeklyHours == null ? "" : String(profile.weeklyHours),
    zvNeuNachBescheid: profile.zvNeuNachBescheid,
    zvNeuNote: profile.zvNeuNote ?? "",
    introductionDay: profile.introductionDay ?? "",
    workshops: workshops.map((w) => {
      const found = attendanceMap.get(w.id);
      return {
        workshopId: w.id,
        selected: !!found,
        attendedOn: found ? found.attendedOn : "",
      };
    }),
  };
}

export function SchoolAssistantsTable({ profiles, workshops }: Props) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    id: string;
    initial: WizardFormState;
  } | null>(null);

  function openCreate() {
    setEditTarget(null);
    setWizardOpen(true);
  }

  function openEdit(profile: SerializedProfile) {
    setEditTarget({
      id: profile.id,
      initial: profileToFormState(profile, workshops),
    });
    setWizardOpen(true);
  }

  return (
    <>
      <PageSection
        title="Schulbegleiter"
        action={
          <Button onClick={openCreate}>+ Neuen Schulbegleiter anlegen</Button>
        }
      >
        <div className="p-4">
          <SearchableTable
            rows={profiles}
            placeholder="Nach Name oder E-Mail suchen…"
            filterBy={(p, q) =>
              p.name.toLowerCase().includes(q) ||
              p.email.toLowerCase().includes(q)
            }
            emptyState={
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Keine Schulbegleiter gefunden.
              </div>
            }
          >
            {(filtered) => (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stunden</TableHead>
                    <TableHead>Einführungstag</TableHead>
                    <TableHead className="text-center">Leos One</TableHead>
                    <TableHead className="text-center">Outlook</TableHead>
                    <TableHead className="text-center">ZV neu</TableHead>
                    <TableHead className="w-12 text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell>
                        {p.weeklyHours == null
                          ? "—"
                          : `${Number(p.weeklyHours)} h`}
                      </TableCell>
                      <TableCell>{formatIsoDate(p.introductionDay)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <FlagCell on={p.leosOne} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <FlagCell on={p.outlook} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <FlagCell on={p.zvNeuNachBescheid} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <SchoolAssistantRowActions
                          profileId={p.id}
                          name={p.name}
                          status={p.status}
                          onEdit={() => openEdit(p)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SearchableTable>
        </div>
      </PageSection>

      <SchoolAssistantWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        workshops={workshops}
        edit={editTarget}
      />
    </>
  );
}
