"use client";

import { useMemo, useState } from "react";
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
import { KinderRowActions } from "./kinder-row-actions";
import { KinderWizard } from "./kinder-wizard";
import { KindDetailSheet } from "./kind-detail-sheet";
import type { KostentraegerOption } from "./kostentraeger-combobox";
import type { SerializedChild } from "./serialize";

type SchulbegleiterOption = {
  id: string;
  name: string;
};

type Props = {
  kinder: SerializedChild[];
  kostentraegerOptions: KostentraegerOption[];
  schulbegleiterOptions: SchulbegleiterOption[];
};

function FlagCell({ on }: { on: boolean }) {
  return on ? (
    <Check className="size-4 text-green-600" />
  ) : (
    <Minus className="size-4 text-muted-foreground" />
  );
}

export function KinderTable({
  kinder,
  kostentraegerOptions,
  schulbegleiterOptions,
}: Props) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [openChildId, setOpenChildId] = useState<string | null>(null);
  const [openTab, setOpenTab] = useState<
    "allgemeines" | "historie" | "kalender"
  >("allgemeines");
  const [extraOptions, setExtraOptions] = useState<KostentraegerOption[]>([]);

  // Merge the server-fetched options with locally-created ones, deduping by
  // id. After `revalidatePath`, the freshly-created Kostenträger lands in
  // both arrays — without deduping it would render twice.
  const allKostentraegerOptions = useMemo(() => {
    const byId = new Map<string, KostentraegerOption>();
    for (const opt of [...kostentraegerOptions, ...extraOptions]) {
      byId.set(opt.id, opt);
    }
    return Array.from(byId.values());
  }, [kostentraegerOptions, extraOptions]);

  const openChild = useMemo(
    () => kinder.find((c) => c.id === openChildId) ?? null,
    [kinder, openChildId],
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
            rows={kinder}
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
                      <TableCell>{c.kostentraeger?.name ?? "—"}</TableCell>
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
                        <KinderRowActions
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

      <KinderWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        kostentraegerOptions={allKostentraegerOptions}
        onKostentraegerCreated={(created) =>
          setExtraOptions((prev) =>
            prev.some((o) => o.id === created.id) ? prev : [...prev, created],
          )
        }
        onSavedOpenCalendar={(childId) => {
          setOpenTab("kalender");
          setOpenChildId(childId);
        }}
      />

      <KindDetailSheet
        child={openChild}
        open={!!openChild}
        onOpenChange={(next) => !next && setOpenChildId(null)}
        tab={openTab}
        onTabChange={setOpenTab}
        kostentraegerOptions={allKostentraegerOptions}
        schulbegleiterOptions={schulbegleiterOptions}
        onKostentraegerCreated={(created) =>
          setExtraOptions((prev) =>
            prev.some((o) => o.id === created.id) ? prev : [...prev, created],
          )
        }
      />
    </>
  );
}
