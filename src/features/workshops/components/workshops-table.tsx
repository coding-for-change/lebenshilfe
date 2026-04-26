"use client";

import { useState } from "react";
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
import { WorkshopFormDialog } from "./workshop-form-dialog";
import { WorkshopsRowActions } from "./workshops-row-actions";

type WorkshopRow = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

type EditTarget = {
  id: string;
  name: string;
  description: string | null;
};

export function WorkshopsTable({ workshops }: { workshops: WorkshopRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  function openCreate() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(row: WorkshopRow) {
    setEditTarget({
      id: row.id,
      name: row.name,
      description: row.description,
    });
    setDialogOpen(true);
  }

  return (
    <>
      <PageSection
        title="Workshops"
        action={<Button onClick={openCreate}>+ Neuen Workshop anlegen</Button>}
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
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">
                        {w.description ?? "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(w.createdAt).toLocaleDateString("de-DE")}
                      </TableCell>
                      <TableCell className="text-right">
                        <WorkshopsRowActions
                          workshopId={w.id}
                          name={w.name}
                          onEdit={() => openEdit(w)}
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
        initial={editTarget}
      />
    </>
  );
}
