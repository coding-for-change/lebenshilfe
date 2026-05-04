"use client";

import { DatePicker } from "@/components/ui/date-picker";
import { DetailSheet } from "@/components/detail-sheet";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { FlagRow } from "@/components/flag-row";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SerializedProfile } from "../serialize";
import { StatusBadge } from "./status-badge";
import { useAutosaveSchoolAssistant } from "./use-autosave-school-assistant";
import { WorkshopAttendanceList } from "./workshop-attendance-list";
import type { WorkshopOption } from "./wizard-types";

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
  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={profile?.name ?? ""}
      description={
        profile ? (
          <span className="flex items-center gap-2">
            <span>{profile.email}</span>
            <span>·</span>
            <StatusBadge status={profile.status} />
          </span>
        ) : null
      }
    >
      {profile ? (
        <DetailBody
          key={profile.id}
          profile={profile}
          workshops={workshops}
        />
      ) : null}
    </DetailSheet>
  );
}

function DetailBody({
  profile,
  workshops,
}: {
  profile: SerializedProfile;
  workshops: WorkshopOption[];
}) {
  const { form, update } = useAutosaveSchoolAssistant(profile, workshops);

  return (
    <div className="flex flex-col gap-5">
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
    </div>
  );
}
