"use client";

import { useMemo, useState } from "react";
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
import { SearchableTable } from "@/components/searchable-table";
import { ChildRowActions } from "./child-row-actions";
import { ChildWizard } from "./child-wizard";
import { ChildDetailSheet } from "./child-detail-sheet";
import type { CostBearerOption } from "@/features/cost-bearers";
import type { SerializedChild } from "../serialize";

type SchoolAssistantOption = {
  id: string;
  name: string;
};

type Props = {
  data: SerializedChild[];
  costBearerOptions: CostBearerOption[];
  schoolAssistantOptions: SchoolAssistantOption[];
};

export function ChildrenTable({
  data,
  costBearerOptions,
  schoolAssistantOptions,
}: Props) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [openChildId, setOpenChildId] = useState<string | null>(null);
  const [openTab, setOpenTab] = useState<"general" | "history" | "calendar">(
    "general",
  );
  const [extraOptions, setExtraOptions] = useState<CostBearerOption[]>([]);

  // Merge the server-fetched options with locally-created ones, deduping by
  // id. After `revalidatePath`, the freshly-created Kostenträger lands in
  // both arrays — without deduping it would render twice.
  const allCostBearerOptions = useMemo(() => {
    const byId = new Map<string, CostBearerOption>();
    for (const opt of [...costBearerOptions, ...extraOptions]) {
      byId.set(opt.id, opt);
    }
    return Array.from(byId.values());
  }, [costBearerOptions, extraOptions]);

  const openChild = useMemo(
    () => data.find((c) => c.id === openChildId) ?? null,
    [data, openChildId],
  );

  return (
    <>
      <PageSection
        title="Kinder"
        action={
          <Button onClick={() => setWizardOpen(true)}>
            + Neues Kind anlegen
          </Button>
        }
      >
        <div className="p-4">
          <SearchableTable
            rows={data}
            placeholder="Nach Name oder Schule suchen…"
            filterBy={(c, q) =>
              `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
              (c.schoolName?.toLowerCase().includes(q) ?? false)
            }
            emptyState={
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Keine Kinder gefunden.
              </div>
            }
          >
            {(filtered) => (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Schule</TableHead>
                    <TableHead>Kostenträger</TableHead>
                    <TableHead className="text-center">Leos One</TableHead>
                    <TableHead className="text-center">
                      Schweigepflicht
                    </TableHead>
                    <TableHead className="w-12 text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => setOpenChildId(c.id)}
                    >
                      <TableCell className="font-medium">
                        {c.firstName} {c.lastName}
                      </TableCell>
                      <TableCell>{c.schoolName ?? "—"}</TableCell>
                      <TableCell>{c.costBearer?.name ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <FlagCell on={c.leosOne} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <FlagCell on={c.schweigepflichtsentbindung} />
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ChildRowActions
                          childId={c.id}
                          childName={`${c.firstName} ${c.lastName}`}
                          onOpenDetails={() => setOpenChildId(c.id)}
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

      <ChildWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        costBearerOptions={allCostBearerOptions}
        onCostBearerCreated={(created) =>
          setExtraOptions((prev) =>
            prev.some((o) => o.id === created.id) ? prev : [...prev, created],
          )
        }
        onSavedOpenCalendar={(childId) => {
          setOpenTab("calendar");
          setOpenChildId(childId);
        }}
      />

      <ChildDetailSheet
        child={openChild}
        open={!!openChild}
        onOpenChange={(next) => !next && setOpenChildId(null)}
        tab={openTab}
        onTabChange={setOpenTab}
        costBearerOptions={allCostBearerOptions}
        schoolAssistantOptions={schoolAssistantOptions}
        onCostBearerCreated={(created) =>
          setExtraOptions((prev) =>
            prev.some((o) => o.id === created.id) ? prev : [...prev, created],
          )
        }
      />
    </>
  );
}
