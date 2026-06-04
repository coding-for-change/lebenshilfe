"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
import {
  HolidayPlanSelect,
  type HolidayPlanOption,
  type SerializedHolidayPlan,
} from "@/features/holiday-plans";
import { SchoolWizard } from "./school-wizard";
import { SchoolDetailSheet } from "./school-detail-sheet";
import { assignHolidayPlanAction, deleteSchoolAction } from "../actions";
import type { SerializedSchool } from "../serialize";

type Props = {
  schools: SerializedSchool[];
  holidayPlans: SerializedHolidayPlan[];
};

export function SchoolsTable({ schools, holidayPlans }: Props) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [openSchoolId, setOpenSchoolId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchPlanId, setBatchPlanId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [extraPlans, setExtraPlans] = useState<HolidayPlanOption[]>([]);
  const [deleteSchool, setDeleteSchool] = useState<SerializedSchool | null>(
    null,
  );

  const allPlanOptions = useMemo(() => {
    const byId = new Map<string, HolidayPlanOption>();
    for (const p of holidayPlans) byId.set(p.id, { id: p.id, name: p.name });
    for (const o of extraPlans) byId.set(o.id, o);
    return Array.from(byId.values());
  }, [holidayPlans, extraPlans]);

  const addPlanOption = (created: HolidayPlanOption) =>
    setExtraPlans((prev) =>
      prev.some((o) => o.id === created.id) ? prev : [...prev, created],
    );

  const openSchool = useMemo(
    () => schools.find((s) => s.id === openSchoolId) ?? null,
    [schools, openSchoolId],
  );

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(ids: string[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  async function applyBatch(planId: string | null) {
    if (selected.size === 0) return;
    setBatchBusy(true);
    try {
      await assignHolidayPlanAction({
        schoolIds: Array.from(selected),
        holidayPlanId: planId,
      });
      toast.success(
        planId
          ? `Ferienplan ${selected.size} ${
              selected.size === 1 ? "Schule" : "Schulen"
            } zugewiesen.`
          : "Ferienplan-Zuweisung entfernt.",
      );
      setSelected(new Set());
      setBatchPlanId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Zuweisung fehlgeschlagen.",
      );
    } finally {
      setBatchBusy(false);
    }
  }

  return (
    <>
      <PageSection
        title="Schulen"
        action={
          <Button onClick={() => setWizardOpen(true)}>
            <Plus /> Neue Schule anlegen
          </Button>
        }
      >
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 px-4 py-3">
            <span className="text-sm font-medium">
              {selected.size} ausgewählt
            </span>
            <div className="w-64 max-w-full">
              <HolidayPlanSelect
                options={allPlanOptions}
                value={batchPlanId}
                onChange={setBatchPlanId}
                onCreated={addPlanOption}
                placeholder="Ferienplan zum Zuweisen…"
              />
            </div>
            <Button
              type="button"
              disabled={!batchPlanId || batchBusy}
              onClick={() => applyBatch(batchPlanId)}
            >
              Zuweisen
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={batchBusy}
              onClick={() => applyBatch(null)}
            >
              Zuweisung entfernen
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={batchBusy}
              onClick={() => setSelected(new Set())}
            >
              Auswahl aufheben
            </Button>
          </div>
        )}

        <div className="p-4">
          <SearchableTable
            rows={schools}
            placeholder="Nach Name oder Adresse suchen…"
            filterBy={(s, q) =>
              s.name.toLowerCase().includes(q) ||
              (s.address?.toLowerCase().includes(q) ?? false)
            }
            emptyState={
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Noch keine Schulen angelegt.
              </div>
            }
          >
            {(filtered) => {
              const filteredIds = filtered.map((s) => s.id);
              const allChecked =
                filteredIds.length > 0 &&
                filteredIds.every((id) => selected.has(id));
              const someChecked = filteredIds.some((id) => selected.has(id));
              return (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          aria-label="Alle auswählen"
                          checked={
                            allChecked
                              ? true
                              : someChecked
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={(v) =>
                            toggleAll(filteredIds, v === true)
                          }
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Ferienplan</TableHead>
                      <TableHead className="text-center">Kinder</TableHead>
                      <TableHead className="w-12 text-right">Aktion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer"
                        data-state={selected.has(s.id) ? "selected" : undefined}
                        onClick={() => setOpenSchoolId(s.id)}
                      >
                        <TableCell
                          className="w-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            aria-label={`${s.name} auswählen`}
                            checked={selected.has(s.id)}
                            onCheckedChange={() => toggleRow(s.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.address ?? "—"}</TableCell>
                        <TableCell>{s.holidayPlan?.name ?? "—"}</TableCell>
                        <TableCell className="text-center tabular-nums">
                          {s.childrenCount}
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Schule löschen"
                            onClick={() => setDeleteSchool(s)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            }}
          </SearchableTable>
        </div>
      </PageSection>

      <SchoolWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        holidayPlanOptions={allPlanOptions}
        onHolidayPlanCreated={addPlanOption}
      />

      <SchoolDetailSheet
        school={openSchool}
        open={!!openSchool}
        onOpenChange={(next) => !next && setOpenSchoolId(null)}
        holidayPlanOptions={allPlanOptions}
        holidayPlans={holidayPlans}
        onHolidayPlanCreated={addPlanOption}
      />

      <ConfirmDialog
        open={!!deleteSchool}
        onOpenChange={(next) => !next && setDeleteSchool(null)}
        title="Schule löschen?"
        description={
          deleteSchool
            ? `„${deleteSchool.name}“ wird gelöscht.${
                deleteSchool.childrenCount > 0
                  ? ` Bei ${deleteSchool.childrenCount} ${
                      deleteSchool.childrenCount === 1 ? "Kind" : "Kindern"
                    } wird die Schulzuordnung entfernt.`
                  : ""
              }`
            : ""
        }
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteSchool) return;
          try {
            await deleteSchoolAction(deleteSchool.id);
            toast.success("Schule gelöscht.");
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
