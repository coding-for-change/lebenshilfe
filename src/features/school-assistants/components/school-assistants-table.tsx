"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FlagCell } from "@/components/flag-cell";
import { PageSection } from "@/components/page-section";
import { ScrollHint } from "@/components/scroll-hint";
import { SearchableTable } from "@/components/searchable-table";
import { SchoolAssistantRowActions } from "./school-assistant-row-actions";
import { SchoolAssistantWizard } from "./school-assistant-wizard";
import { SchoolAssistantDetailSheet } from "./school-assistant-detail-sheet";
import { StatusBadge } from "./status-badge";
import { formatDate } from "@/lib/utils";
import type { WorkshopOption } from "./wizard-types";
import type { SerializedProfile } from "../serialize";

type Props = {
  profiles: SerializedProfile[];
  workshops: WorkshopOption[];
};

export function SchoolAssistantsTable({ profiles, workshops }: Props) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [openProfileId, setOpenProfileId] = useState<string | null>(null);

  const openProfile = profiles.find((p) => p.id === openProfileId) ?? null;

  return (
    <>
      <PageSection
        title="Schulbegleiter"
        action={
          <>
            <Button
              onClick={() => setWizardOpen(true)}
              size="icon"
              className="sm:hidden"
              aria-label="Neuen Schulbegleiter anlegen"
            >
              <Plus />
            </Button>
            <Button
              onClick={() => setWizardOpen(true)}
              className="hidden sm:inline-flex"
            >
              <Plus /> Neuen Schulbegleiter anlegen
            </Button>
          </>
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
              <ScrollHint>
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
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => setOpenProfileId(p.id)}
                      >
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
                        <TableCell>
                          {p.introductionDay
                            ? formatDate(p.introductionDay)
                            : "—"}
                        </TableCell>
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
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SchoolAssistantRowActions
                            profileId={p.id}
                            name={p.name}
                            status={p.status}
                            onOpenDetails={() => setOpenProfileId(p.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollHint>
            )}
          </SearchableTable>
        </div>
      </PageSection>

      <SchoolAssistantWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        workshops={workshops}
      />

      <SchoolAssistantDetailSheet
        profile={openProfile}
        open={!!openProfile}
        onOpenChange={(next) => !next && setOpenProfileId(null)}
        workshops={workshops}
      />
    </>
  );
}
