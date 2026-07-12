"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { FlagCell, FlagChip } from "@/components/flag-cell";
import { PageSection } from "@/components/page-section";
import { RecordCard } from "@/components/record-card";
import { SearchableTable } from "@/components/searchable-table";
import { ChildRowActions } from "./child-row-actions";
import { ChildWizard } from "./child-wizard";
import { ChildDetailSheet } from "./child-detail-sheet";
import type { CostBearerOption } from "@/features/cost-bearers";
import type { SchoolOption } from "@/features/schools";
import type { SerializedChild } from "../serialize";

type SchoolAssistantOption = {
  id: string;
  name: string;
};

type Props = {
  data: SerializedChild[];
  costBearerOptions: CostBearerOption[];
  schoolAssistantOptions: SchoolAssistantOption[];
  schoolOptions: SchoolOption[];
};

export function ChildrenTable({
  data,
  costBearerOptions,
  schoolAssistantOptions,
  schoolOptions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [openChildId, setOpenChildId] = useState<string | null>(
    searchParams.get("childId"),
  );
  const [openTab, setOpenTab] = useState<"general" | "history" | "calendar">(
    () => {
      const t = searchParams.get("tab");
      return t === "history" || t === "calendar" ? t : "general";
    },
  );

  // Keep the URL in sync with deep-links from other admin pages
  // (e.g. /admin/handlungsbedarf flags). Without this, navigating to
  // /admin/children?childId=…&tab=calendar a second time would not re-open
  // the sheet because state was already initialized.
  useEffect(() => {
    const urlChildId = searchParams.get("childId");
    const urlTab = searchParams.get("tab");
    if (urlChildId && urlChildId !== openChildId) setOpenChildId(urlChildId);
    if (
      (urlTab === "history" || urlTab === "calendar" || urlTab === "general") &&
      urlTab !== openTab
    ) {
      setOpenTab(urlTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Strip the query params when the sheet is closed so a refresh doesn't
  // re-open it. `replace` (not `push`) keeps the back button clean.
  const clearDeepLink = () => {
    if (searchParams.has("childId") || searchParams.has("tab")) {
      router.replace(pathname);
    }
  };
  const [extraOptions, setExtraOptions] = useState<CostBearerOption[]>([]);
  const [extraSchoolOptions, setExtraSchoolOptions] = useState<SchoolOption[]>(
    [],
  );

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

  const allSchoolOptions = useMemo(() => {
    const byId = new Map<string, SchoolOption>();
    for (const opt of [...schoolOptions, ...extraSchoolOptions]) {
      byId.set(opt.id, opt);
    }
    return Array.from(byId.values());
  }, [schoolOptions, extraSchoolOptions]);

  const addSchoolOption = (created: SchoolOption) =>
    setExtraSchoolOptions((prev) =>
      prev.some((o) => o.id === created.id) ? prev : [...prev, created],
    );

  const openChild = useMemo(
    () => data.find((c) => c.id === openChildId) ?? null,
    [data, openChildId],
  );

  return (
    <>
      <PageSection
        title="Kinder"
        action={
          <>
            <Button
              onClick={() => setWizardOpen(true)}
              size="icon"
              className="md:hidden"
              aria-label="Neues Kind anlegen"
            >
              <Plus />
            </Button>
            <Button
              onClick={() => setWizardOpen(true)}
              className="hidden md:inline-flex"
            >
              <Plus /> Neues Kind anlegen
            </Button>
          </>
        }
      >
        <div className="p-4">
          <SearchableTable
            rows={data}
            placeholder="Nach Name oder Schule suchen…"
            filterBy={(c, q) =>
              `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
              (c.school?.name?.toLowerCase().includes(q) ?? false)
            }
            emptyState={
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Keine Kinder gefunden.
              </div>
            }
            getRowKey={(c) => c.id}
            renderCard={(c) => (
              <RecordCard
                title={`${c.firstName} ${c.lastName}`}
                subtitle={c.school?.name ?? undefined}
                badges={
                  <>
                    <FlagChip
                      label="Leos One"
                      on={c.leosOne}
                    />
                    <FlagChip
                      label="Schweigepflicht"
                      on={c.schweigepflichtsentbindung}
                    />
                  </>
                }
                meta={`Kostenträger: ${c.costBearer?.name ?? "—"}`}
                action={
                  <ChildRowActions
                    childId={c.id}
                    childName={`${c.firstName} ${c.lastName}`}
                    onOpenDetails={() => setOpenChildId(c.id)}
                  />
                }
                onClick={() => setOpenChildId(c.id)}
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
                      <TableCell>{c.school?.name ?? "—"}</TableCell>
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
        schoolOptions={allSchoolOptions}
        onSchoolCreated={addSchoolOption}
        onSavedOpenCalendar={(childId) => {
          setOpenTab("calendar");
          setOpenChildId(childId);
        }}
      />

      <ChildDetailSheet
        child={openChild}
        open={!!openChild}
        onOpenChange={(next) => {
          if (!next) {
            setOpenChildId(null);
            clearDeepLink();
          }
        }}
        tab={openTab}
        onTabChange={setOpenTab}
        costBearerOptions={allCostBearerOptions}
        schoolAssistantOptions={schoolAssistantOptions}
        onCostBearerCreated={(created) =>
          setExtraOptions((prev) =>
            prev.some((o) => o.id === created.id) ? prev : [...prev, created],
          )
        }
        schoolOptions={allSchoolOptions}
        onSchoolCreated={addSchoolOption}
      />
    </>
  );
}
