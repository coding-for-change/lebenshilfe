"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import type { SchoolOption } from "@/features/schools";
import type { CostBearerOption } from "@/features/cost-bearers";
import { PoolRowActions } from "./pool-row-actions";
import { PoolWizard } from "./pool-wizard";
import { PoolDetailSheet } from "./pool-detail-sheet";
import type { PoolAssistantOption, PoolChildOption } from "./types";
import type { SerializedPool } from "../serialize";

type Props = {
  data: SerializedPool[];
  schoolOptions: SchoolOption[];
  costBearerOptions: CostBearerOption[];
  childOptions: PoolChildOption[];
  assistantOptions: PoolAssistantOption[];
};

export function PoolsTable({
  data,
  schoolOptions,
  costBearerOptions,
  childOptions,
  assistantOptions,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poolParam = searchParams.get("pool");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [openPoolId, setOpenPoolId] = useState<string | null>(() => poolParam);
  const [extraSchools, setExtraSchools] = useState<SchoolOption[]>([]);
  const [extraCostBearers, setExtraCostBearers] = useState<CostBearerOption[]>(
    [],
  );

  const dedupe = <T extends { id: string }>(base: T[], extra: T[]) => {
    const byId = new Map<string, T>();
    for (const o of [...base, ...extra]) byId.set(o.id, o);
    return Array.from(byId.values());
  };

  const allSchools = useMemo(
    () => dedupe(schoolOptions, extraSchools),
    [schoolOptions, extraSchools],
  );
  const allCostBearers = useMemo(
    () => dedupe(costBearerOptions, extraCostBearers),
    [costBearerOptions, extraCostBearers],
  );

  const addSchool = (created: SchoolOption) =>
    setExtraSchools((prev) =>
      prev.some((o) => o.id === created.id) ? prev : [...prev, created],
    );
  const addCostBearer = (created: CostBearerOption) =>
    setExtraCostBearers((prev) =>
      prev.some((o) => o.id === created.id) ? prev : [...prev, created],
    );

  const openPool = useMemo(
    () => data.find((p) => p.id === openPoolId) ?? null,
    [data, openPoolId],
  );

  const closeDetail = () => {
    setOpenPoolId(null);
    if (poolParam) router.replace("/admin/pools");
  };

  return (
    <>
      <PageSection
        title="Pools"
        action={
          <>
            <Button
              onClick={() => setWizardOpen(true)}
              size="icon"
              className="md:hidden"
              aria-label="Neuen Pool anlegen"
            >
              <Plus />
            </Button>
            <Button
              onClick={() => setWizardOpen(true)}
              className="hidden md:inline-flex"
            >
              <Plus /> Neuen Pool anlegen
            </Button>
          </>
        }
      >
        <div className="p-4">
          <SearchableTable
            rows={data}
            placeholder="Nach Name oder Schule suchen…"
            filterBy={(p, q) =>
              p.name.toLowerCase().includes(q) ||
              p.school.name.toLowerCase().includes(q)
            }
            emptyState={
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Keine Pools gefunden.
              </div>
            }
            getRowKey={(p) => p.id}
            renderCard={(p) => (
              <RecordCard
                title={p.name}
                subtitle={p.school.name}
                meta={`${p.childCount} Kinder · ${p.assistantCount} SB · ${p.costBearer.name}`}
                action={
                  <PoolRowActions
                    poolId={p.id}
                    poolName={p.name}
                    onOpenDetails={() => setOpenPoolId(p.id)}
                  />
                }
                onClick={() => setOpenPoolId(p.id)}
              />
            )}
          >
            {(filtered) => (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Schule</TableHead>
                    <TableHead>Kostenträger</TableHead>
                    <TableHead className="text-center">Kinder</TableHead>
                    <TableHead className="text-center">SB</TableHead>
                    <TableHead className="w-12 text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => setOpenPoolId(p.id)}
                    >
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.school.name}</TableCell>
                      <TableCell>{p.costBearer.name}</TableCell>
                      <TableCell className="text-center">
                        {p.childCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.assistantCount}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PoolRowActions
                          poolId={p.id}
                          poolName={p.name}
                          onOpenDetails={() => setOpenPoolId(p.id)}
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

      <PoolWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        schoolOptions={allSchools}
        costBearerOptions={allCostBearers}
        childOptions={childOptions}
        assistantOptions={assistantOptions}
        onSchoolCreated={addSchool}
        onCostBearerCreated={addCostBearer}
      />

      <PoolDetailSheet
        pool={openPool}
        open={!!openPool}
        onOpenChange={(next) => !next && closeDetail()}
        schoolOptions={allSchools}
        costBearerOptions={allCostBearers}
        childOptions={childOptions}
        assistantOptions={assistantOptions}
        onSchoolCreated={addSchool}
        onCostBearerCreated={addCostBearer}
      />
    </>
  );
}
