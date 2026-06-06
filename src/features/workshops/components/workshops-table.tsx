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
import { PageSection } from "@/components/page-section";
import { RecordCard } from "@/components/record-card";
import { SearchableTable } from "@/components/searchable-table";
import { formatDate } from "@/lib/utils";
import { WorkshopFormDialog } from "./workshop-form-dialog";
import { WorkshopDetailSheet } from "./workshop-detail-sheet";
import { WorkshopsRowActions } from "./workshops-row-actions";

type WorkshopRow = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

export function WorkshopsTable({ workshops }: { workshops: WorkshopRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openWorkshopId, setOpenWorkshopId] = useState<string | null>(null);

  const openWorkshop = workshops.find((w) => w.id === openWorkshopId) ?? null;

  return (
    <>
      <PageSection
        title="Workshops"
        action={
          <>
            <Button
              onClick={() => setDialogOpen(true)}
              size="icon"
              className="md:hidden"
              aria-label="Neuen Workshop anlegen"
            >
              <Plus />
            </Button>
            <Button
              onClick={() => setDialogOpen(true)}
              className="hidden md:inline-flex"
            >
              <Plus /> Neuen Workshop anlegen
            </Button>
          </>
        }
      >
        <div className="p-4">
          <SearchableTable
            rows={workshops}
            placeholder="Nach Name oder Beschreibung suchen…"
            filterBy={(w, q) =>
              w.name.toLowerCase().includes(q) ||
              (w.description?.toLowerCase().includes(q) ?? false)
            }
            emptyState={
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Noch keine Workshops angelegt.
              </div>
            }
            getRowKey={(w) => w.id}
            renderCard={(w) => (
              <RecordCard
                title={w.name}
                subtitle={w.description ?? undefined}
                meta={`Erstellt: ${formatDate(w.createdAt)}`}
                action={
                  <WorkshopsRowActions
                    workshopId={w.id}
                    name={w.name}
                    onOpenDetails={() => setOpenWorkshopId(w.id)}
                  />
                }
                onClick={() => setOpenWorkshopId(w.id)}
              />
            )}
          >
            {(filtered) => (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead className="w-12 text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((w) => (
                    <TableRow
                      key={w.id}
                      className="cursor-pointer"
                      onClick={() => setOpenWorkshopId(w.id)}
                    >
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">
                        {w.description ?? "—"}
                      </TableCell>
                      <TableCell>{formatDate(w.createdAt)}</TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <WorkshopsRowActions
                          workshopId={w.id}
                          name={w.name}
                          onOpenDetails={() => setOpenWorkshopId(w.id)}
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

      <WorkshopFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <WorkshopDetailSheet
        workshop={openWorkshop}
        open={!!openWorkshop}
        onOpenChange={(next) => !next && setOpenWorkshopId(null)}
      />
    </>
  );
}
