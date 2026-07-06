"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DetailSheet } from "@/components/detail-sheet";
import { UnsavedChangesDialog } from "@/components/unsaved-changes-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { FlagRow } from "@/components/flag-row";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SerializedProfile } from "../serialize";
import { StatusBadge } from "./status-badge";
import {
  useSchoolAssistantEditor,
  type DetailFormState,
} from "./use-school-assistant-editor";
import { WorkshopAttendanceList } from "./workshop-attendance-list";
import type { WorkshopOption } from "./wizard-types";

const FORM_ID = "school-assistant-detail-form";

type Props = {
  profile: SerializedProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshops: WorkshopOption[];
};

export function SchoolAssistantDetailSheet({
  profile,
  open,
  onOpenChange,
  workshops,
}: Props) {
  const editor = useSchoolAssistantEditor(profile, workshops);
  const [askSave, setAskSave] = useState(false);

  // Closing with unsaved edits asks first; otherwise it just closes.
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
        title={profile?.name ?? ""}
        description={
          profile ? (
            <span className="flex flex-wrap items-center gap-2">
              <span>{profile.email}</span>
              <span>·</span>
              <StatusBadge status={profile.status} />
              {profile.pool ? (
                <Link
                  href={`/admin/pools?pool=${profile.pool.id}`}
                  className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer gap-1 transition-colors hover:bg-secondary/70"
                  >
                    Pool: {profile.pool.name}
                    <ArrowUpRight className="size-3" />
                  </Badge>
                </Link>
              ) : null}
            </span>
          ) : null
        }
        footer={
          profile ? (
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
        {profile && editor.form ? (
          <SchoolAssistantFields
            key={profile.id}
            form={editor.form}
            update={editor.update}
            onSubmit={editor.save}
            workshops={workshops}
          />
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

function SchoolAssistantFields({
  form,
  update,
  onSubmit,
  workshops,
}: {
  form: DetailFormState;
  update: (patch: Partial<DetailFormState>) => void;
  onSubmit: () => void;
  workshops: WorkshopOption[];
}) {
  return (
    <form
      id={FORM_ID}
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Field>
        <FieldLabel htmlFor="sb-det-name">
          <FieldContent>
            <span>Name</span>
          </FieldContent>
        </FieldLabel>
        <Input
          id="sb-det-name"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="sb-det-hours">
            <FieldContent>
              <span>Stunden / Woche</span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="sb-det-hours"
            type="number"
            inputMode="decimal"
            min={0}
            max={168}
            step="0.25"
            value={form.weeklyHours}
            onChange={(e) => update({ weeklyHours: e.target.value })}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="sb-det-introday">
            <FieldContent>
              <span>Einführungstag</span>
            </FieldContent>
          </FieldLabel>
          <DatePicker
            id="sb-det-introday"
            value={form.introductionDay}
            onChange={(next) => update({ introductionDay: next })}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
        <FlagRow
          id="sb-det-leos"
          label="Leos One"
          description="Zugang zum Leos-One-System."
          checked={form.leosOne}
          onChange={(v) => update({ leosOne: v })}
        />
        <FlagRow
          id="sb-det-outlook"
          label="Outlook"
          description="Outlook-Konto eingerichtet."
          checked={form.outlook}
          onChange={(v) => update({ outlook: v })}
        />
        <FlagRow
          id="sb-det-zvneu"
          label="ZV neu nach Bescheid"
          description="Notiz wird sichtbar, sobald aktiviert."
          checked={form.zvNeuNachBescheid}
          onChange={(v) =>
            update({
              zvNeuNachBescheid: v,
              zvNeuNote: v ? form.zvNeuNote : "",
            })
          }
        />
        {form.zvNeuNachBescheid ? (
          <Field>
            <FieldLabel htmlFor="sb-det-zvnote">
              <FieldContent>
                <span>Notiz</span>
              </FieldContent>
            </FieldLabel>
            <Textarea
              id="sb-det-zvnote"
              value={form.zvNeuNote}
              onChange={(e) => update({ zvNeuNote: e.target.value })}
              rows={3}
              placeholder="Hinweise zum Bescheid…"
            />
          </Field>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Workshops</div>
        <WorkshopAttendanceList
          rows={form.workshops}
          workshops={workshops}
          onChange={(rows) => update({ workshops: rows })}
        />
      </div>
    </form>
  );
}
