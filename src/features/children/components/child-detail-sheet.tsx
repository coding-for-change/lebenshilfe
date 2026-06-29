"use client";

import { useState } from "react";
import { DetailSheet } from "@/components/detail-sheet";
import { UnsavedChangesDialog } from "@/components/unsaved-changes-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabGeneral } from "./tabs/tab-general";
import { TabHistory } from "./tabs/tab-history";
import { TabCalendar } from "./tabs/tab-calendar";
import { useGeneralEditor } from "./tabs/use-general-editor";
import type { CostBearerOption } from "@/features/cost-bearers";
import type { SchoolOption } from "@/features/schools";
import type { SerializedChild } from "../serialize";

export type DetailTab = "general" | "history" | "calendar";

const FORM_ID = "child-general-detail-form";

type Props = {
  child: SerializedChild | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab?: DetailTab;
  onTabChange?: (next: DetailTab) => void;
  costBearerOptions: CostBearerOption[];
  schoolAssistantOptions: { id: string; name: string }[];
  onCostBearerCreated: (created: CostBearerOption) => void;
  schoolOptions: SchoolOption[];
  onSchoolCreated: (created: SchoolOption) => void;
};

export function ChildDetailSheet({
  child,
  open,
  onOpenChange,
  tab,
  onTabChange,
  costBearerOptions,
  schoolAssistantOptions,
  onCostBearerCreated,
  schoolOptions,
  onSchoolCreated,
}: Props) {
  const editor = useGeneralEditor(child);
  const [askSave, setAskSave] = useState(false);
  const activeTab: DetailTab = tab ?? "general";
  const pool = child?.pool ?? null;

  function requestClose() {
    if (editor.dirty) setAskSave(true);
    else onOpenChange(false);
  }

  return (
    <>
      <DetailSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
        title={child ? `${child.firstName} ${child.lastName}` : ""}
        description={
          child
            ? `${child.school?.name ?? "Keine Schule hinterlegt"}${
                child.costBearer?.name ? ` · ${child.costBearer.name}` : ""
              }`
            : null
        }
        // Inner Tabs owns its own scroll container so the TabsList stays pinned.
        bodyClassName="overflow-hidden p-4"
        // Only the "Allgemeines" tab has editable fields to save.
        footer={
          child && activeTab === "general" ? (
            <Button
              type="submit"
              form={FORM_ID}
              disabled={!editor.dirty || editor.saving}
            >
              {editor.saving ? "Speichern…" : "Speichern"}
            </Button>
          ) : null
        }
      >
        {child ? (
          <Tabs
            value={activeTab}
            onValueChange={(v) => onTabChange?.(v as DetailTab)}
            className="flex flex-1 flex-col gap-3 overflow-hidden"
          >
            {pool ? (
              <div className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-200">
                Dieses Kind wird über den Pool &bdquo;{pool.name}&ldquo;
                verwaltet. Abrechnung und Zuweisungen erfolgen über den Pool.
              </div>
            ) : null}
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Allgemeines</TabsTrigger>
              <TabsTrigger value="history">Historie</TabsTrigger>
              <TabsTrigger value="calendar">Kalender</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-1">
              <TabsContent value="general">
                {editor.form ? (
                  <TabGeneral
                    key={child.id}
                    form={editor.form}
                    update={editor.update}
                    onSubmit={editor.save}
                    formId={FORM_ID}
                    costBearerOptions={costBearerOptions}
                    onCostBearerCreated={onCostBearerCreated}
                    schoolOptions={schoolOptions}
                    onSchoolCreated={onSchoolCreated}
                    billingDisabled={!!pool}
                  />
                ) : null}
              </TabsContent>
              <TabsContent value="history">
                <TabHistory
                  child={child}
                  schoolAssistantOptions={schoolAssistantOptions}
                />
              </TabsContent>
              <TabsContent value="calendar">
                {pool ? (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Zuweisungen und Stundenpläne werden für Pool-Kinder nicht
                    einzeln gepflegt. Die Erfassung erfolgt über den Pool
                    &bdquo;{pool.name}&ldquo;.
                  </p>
                ) : (
                  <TabCalendar
                    child={child}
                    schoolAssistantOptions={schoolAssistantOptions}
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        ) : null}
      </DetailSheet>

      <UnsavedChangesDialog
        open={askSave}
        onOpenChange={setAskSave}
        onSave={async () => {
          if (await editor.save()) {
            setAskSave(false);
            onOpenChange(false);
          }
        }}
        onDiscard={() => {
          setAskSave(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
