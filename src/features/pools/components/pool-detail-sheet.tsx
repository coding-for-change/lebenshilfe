"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DetailSheet } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchoolSelect, type SchoolOption } from "@/features/schools";
import {
  CostBearerCombobox,
  type CostBearerOption,
} from "@/features/cost-bearers";
import {
  setPoolAssistantsAction,
  setPoolChildrenAction,
  updatePoolAction,
} from "../actions";
import { PoolExportDialog } from "@/features/kostentraeger-export";
import type { SerializedPool } from "../serialize";
import { MemberTable } from "./member-table";
import { SchoolMismatchWarning } from "./school-mismatch-warning";
import type { PoolAssistantOption, PoolChildOption } from "./types";

type Tab = "general" | "export";

type Props = {
  pool: SerializedPool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolOptions: SchoolOption[];
  costBearerOptions: CostBearerOption[];
  childOptions: PoolChildOption[];
  assistantOptions: PoolAssistantOption[];
  onSchoolCreated: (created: SchoolOption) => void;
  onCostBearerCreated: (created: CostBearerOption) => void;
};

export function PoolDetailSheet({
  pool,
  open,
  onOpenChange,
  schoolOptions,
  costBearerOptions,
  childOptions,
  assistantOptions,
  onSchoolCreated,
  onCostBearerCreated,
}: Props) {
  const [tab, setTab] = useState<Tab>("general");
  const [name, setName] = useState("");
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [kostentraegerId, setKostentraegerId] = useState<string | null>(null);
  const [childIds, setChildIds] = useState<string[]>([]);
  const [assistantIds, setAssistantIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pool) return;
    setTab("general");
    setName(pool.name);
    setSchoolId(pool.school.id);
    setKostentraegerId(pool.costBearer.id);
    setChildIds(pool.children.map((c) => c.id));
    setAssistantIds(pool.assistants.map((a) => a.id));
  }, [pool]);

  const sameSet = (a: string[], b: string[]) =>
    a.length === b.length && a.every((x) => b.includes(x));

  const generalDirty =
    !!pool &&
    (name.trim() !== pool.name ||
      schoolId !== pool.school.id ||
      kostentraegerId !== pool.costBearer.id);
  const childrenDirty =
    !!pool &&
    !sameSet(
      childIds,
      pool.children.map((c) => c.id),
    );
  const assistantsDirty =
    !!pool &&
    !sameSet(
      assistantIds,
      pool.assistants.map((a) => a.id),
    );
  const dirty = generalDirty || childrenDirty || assistantsDirty;

  const mismatchedNames = useMemo(() => {
    if (!schoolId) return [];
    return childOptions
      .filter(
        (c) =>
          childIds.includes(c.id) &&
          c.schoolId != null &&
          c.schoolId !== schoolId,
      )
      .map((c) => `${c.firstName} ${c.lastName}`);
  }, [childOptions, childIds, schoolId]);

  const childMembers = useMemo(
    () =>
      childOptions.map((c) => {
        const warn =
          schoolId != null && c.schoolId != null && c.schoolId !== schoolId;
        return {
          id: c.id,
          label: `${c.firstName} ${c.lastName}`,
          warn,
          hint: warn ? "Andere Schule" : undefined,
        };
      }),
    [childOptions, schoolId],
  );

  const assistantMembers = useMemo(
    () =>
      assistantOptions.map((a) => ({ id: a.id, label: a.name, hint: a.email })),
    [assistantOptions],
  );

  const add =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) =>
      setter((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const remove =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) =>
      setter((prev) => prev.filter((x) => x !== id));

  async function save() {
    if (!pool) return;
    if (!name.trim() || !schoolId || !kostentraegerId) {
      toast.error("Name, Schule und Kostenträger sind erforderlich.");
      return;
    }
    setSaving(true);
    try {
      if (generalDirty) {
        await updatePoolAction(pool.id, {
          name: name.trim(),
          schoolId,
          kostentraegerId,
        });
      }
      if (childrenDirty) {
        await setPoolChildrenAction({ poolId: pool.id, childIds });
      }
      if (assistantsDirty) {
        await setPoolAssistantsAction({
          poolId: pool.id,
          profileIds: assistantIds,
        });
      }
      toast.success("Gespeichert.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={pool?.name ?? ""}
      description={
        pool ? `${pool.school.name} · ${pool.costBearer.name}` : null
      }
      bodyClassName="overflow-hidden p-4"
      footer={
        pool && tab === "general" ? (
          <Button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
          >
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        ) : null
      }
    >
      {pool ? (
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          className="flex flex-1 flex-col gap-3 overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-1">
            <TabsContent value="general">
              <div className="flex flex-col gap-5">
                <Field>
                  <FieldLabel htmlFor="pool-edit-name">
                    <FieldContent>
                      <span>Name</span>
                    </FieldContent>
                  </FieldLabel>
                  <Input
                    id="pool-edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={!name.trim()}
                  />
                  <FieldError>{!name.trim() ? "Name fehlt." : ""}</FieldError>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="pool-edit-school">
                      <FieldContent>
                        <span>Schule</span>
                      </FieldContent>
                    </FieldLabel>
                    <SchoolSelect
                      id="pool-edit-school"
                      options={schoolOptions}
                      value={schoolId}
                      onChange={setSchoolId}
                      onCreated={onSchoolCreated}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="pool-edit-kostentraeger">
                      <FieldContent>
                        <span>Kostenträger</span>
                      </FieldContent>
                    </FieldLabel>
                    <CostBearerCombobox
                      id="pool-edit-kostentraeger"
                      options={costBearerOptions}
                      value={kostentraegerId}
                      onChange={setKostentraegerId}
                      onCreated={onCostBearerCreated}
                    />
                  </Field>
                </div>

                <Separator />

                <SchoolMismatchWarning names={mismatchedNames} />

                <MemberTable
                  title="Kinder"
                  options={childMembers}
                  selectedIds={childIds}
                  onAdd={add(setChildIds)}
                  onRemove={remove(setChildIds)}
                  addLabel="Kind"
                  emptyText="Noch keine Kinder zugewiesen."
                  searchPlaceholder="Kind suchen…"
                />

                <MemberTable
                  title="Schulbegleiter"
                  options={assistantMembers}
                  selectedIds={assistantIds}
                  onAdd={add(setAssistantIds)}
                  onRemove={remove(setAssistantIds)}
                  addLabel="Schulbegleiter"
                  emptyText="Noch keine Schulbegleiter zugewiesen."
                  searchPlaceholder="Schulbegleiter suchen…"
                />
              </div>
            </TabsContent>

            <TabsContent value="export">
              <PoolExportDialog
                poolId={pool.id}
                poolName={pool.name}
              />
            </TabsContent>
          </div>
        </Tabs>
      ) : null}
    </DetailSheet>
  );
}
