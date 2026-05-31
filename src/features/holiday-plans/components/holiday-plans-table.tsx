"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { HolidayPlanCreateDialog } from "./holiday-plan-create-dialog";
import { HolidayPlanDetailSheet } from "./holiday-plan-detail-sheet";
import { deleteHolidayPlanAction } from "../actions";
import type { SerializedHolidayPlan } from "../serialize";

type Props = {
  plans: SerializedHolidayPlan[];
};

export function HolidayPlansTable({ plans }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);
  const [deletePlan, setDeletePlan] = useState<SerializedHolidayPlan | null>(
    null,
  );

  const openPlan = useMemo(
    () => plans.find((p) => p.id === openPlanId) ?? null,
    [plans, openPlanId],
  );

  return (
    <>
      <PageSection
        title="Ferienpläne"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Neuer Ferienplan
          </Button>
        }
      >
        <div className="p-4">
          <SearchableTable
            rows={plans}
            placeholder="Nach Name suchen…"
            filterBy={(p, q) => p.name.toLowerCase().includes(q)}
            emptyState={
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Noch keine Ferienpläne angelegt.
              </div>
            }
          >
            {(filtered) => (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Zeiträume</TableHead>
                    <TableHead className="text-center">Schulen</TableHead>
                    <TableHead className="w-12 text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => setOpenPlanId(p.id)}
                    >
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-center tabular-nums">
                        {p.holidays.length}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {p.schoolCount}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Ferienplan löschen"
                          onClick={() => setDeletePlan(p)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SearchableTable>
        </div>
      </PageSection>

      <HolidayPlanCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          /* revalidatePath refreshes the list */
        }}
      />

      <HolidayPlanDetailSheet
        plan={openPlan}
        open={!!openPlan}
        onOpenChange={(next) => !next && setOpenPlanId(null)}
      />

      <ConfirmDialog
        open={!!deletePlan}
        onOpenChange={(next) => !next && setDeletePlan(null)}
        title="Ferienplan löschen?"
        description={
          deletePlan
            ? `"${deletePlan.name}" wird gelöscht. ${
                deletePlan.schoolCount > 0
                  ? `Die Zuweisung wird bei ${deletePlan.schoolCount} ${
                      deletePlan.schoolCount === 1 ? "Schule" : "Schulen"
                    } entfernt.`
                  : ""
              }`
            : ""
        }
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={async () => {
          if (!deletePlan) return;
          try {
            await deleteHolidayPlanAction(deletePlan.id);
            toast.success("Ferienplan gelöscht.");
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Löschen fehlgeschlagen.",
            );
          }
        }}
      />
    </>
  );
}
