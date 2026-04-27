"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "perfect-debounce";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { updateKindAction } from "../../actions";
import type { UpdateKindInput } from "../../schemas";
import {
  KostentraegerCombobox,
  type KostentraegerOption,
} from "../kostentraeger-combobox";
import { SchuleAutocomplete, type SchuleValue } from "../schule-autocomplete";
import { SchulePreview } from "../schule-preview";
import type { SerializedChild } from "../serialize";

type Props = {
  child: SerializedChild;
  kostentraegerOptions: KostentraegerOption[];
  onKostentraegerCreated: (created: KostentraegerOption) => void;
};

type FormState = {
  firstName: string;
  lastName: string;
  schule: SchuleValue;
  leosOne: boolean;
  schweigepflichtsentbindung: boolean;
  bescheid: string;
  sbIb: string;
  bemerkung: string;
  kostentraegerId: string | null;
};

function fromChild(c: SerializedChild): FormState {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    schule: {
      placeId: c.schoolPlaceId,
      name: c.schoolName,
      address: c.schoolAddress,
      lat: c.schoolLat,
      lng: c.schoolLng,
    },
    leosOne: c.leosOne,
    schweigepflichtsentbindung: c.schweigepflichtsentbindung,
    bescheid: c.bescheid ?? "",
    sbIb: c.sbIb ?? "",
    bemerkung: c.bemerkung ?? "",
    kostentraegerId: c.kostentraeger?.id ?? null,
  };
}

export function TabAllgemeines({
  child,
  kostentraegerOptions,
  onKostentraegerCreated,
}: Props) {
  const [form, setForm] = useState<FormState>(() => fromChild(child));
  const [saving, setSaving] = useState(false);
  const initial = useRef(fromChild(child));

  // Reset state when the child changes (different row clicked).
  useEffect(() => {
    const next = fromChild(child);
    setForm(next);
    initial.current = next;
  }, [child]);

  const persist = useMemo(
    () =>
      debounce(async (patch: UpdateKindInput) => {
        setSaving(true);
        try {
          await updateKindAction(child.id, patch);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
          );
        } finally {
          setSaving(false);
        }
      }, 600),
    [child.id],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      const patch = toUpdateInput(initial.current, next);
      if (patch) void persist(patch);
      return next;
    });
  }

  function toUpdateInput(
    base: FormState,
    next: FormState,
  ): UpdateKindInput | null {
    const patch: UpdateKindInput = {};
    if (next.firstName !== base.firstName) patch.firstName = next.firstName;
    if (next.lastName !== base.lastName) patch.lastName = next.lastName;
    if (next.leosOne !== base.leosOne) patch.leosOne = next.leosOne;
    if (next.schweigepflichtsentbindung !== base.schweigepflichtsentbindung) {
      patch.schweigepflichtsentbindung = next.schweigepflichtsentbindung;
    }
    if ((next.bescheid || null) !== (base.bescheid || null)) {
      patch.bescheid = next.bescheid || null;
    }
    if ((next.sbIb || null) !== (base.sbIb || null)) {
      patch.sbIb = next.sbIb || null;
    }
    if ((next.bemerkung || null) !== (base.bemerkung || null)) {
      patch.bemerkung = next.bemerkung || null;
    }
    if (next.kostentraegerId !== base.kostentraegerId) {
      patch.kostentraegerId = next.kostentraegerId;
    }
    if (
      next.schule.placeId !== base.schule.placeId ||
      next.schule.name !== base.schule.name ||
      next.schule.address !== base.schule.address ||
      next.schule.lat !== base.schule.lat ||
      next.schule.lng !== base.schule.lng
    ) {
      patch.schule = next.schule;
    }
    return Object.keys(patch).length > 0 ? patch : null;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-end text-xs text-muted-foreground">
        {saving ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" />
            Speichert…
          </span>
        ) : (
          <span>Änderungen werden automatisch gespeichert.</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="det-first">
            <FieldContent>
              <span>Vorname</span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="det-first"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="det-last">
            <FieldContent>
              <span>Nachname</span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="det-last"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="det-schule">
          <FieldContent>
            <span>Schule</span>
          </FieldContent>
        </FieldLabel>
        <SchuleAutocomplete
          id="det-schule"
          value={form.schule}
          onChange={(next) => update("schule", next)}
        />
        <SchulePreview
          placeId={form.schule.placeId}
          address={form.schule.address}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="det-kostentraeger">
          <FieldContent>
            <span>Kostenträger</span>
          </FieldContent>
        </FieldLabel>
        <KostentraegerCombobox
          id="det-kostentraeger"
          options={kostentraegerOptions}
          value={form.kostentraegerId}
          onChange={(id) => update("kostentraegerId", id)}
          onCreated={onKostentraegerCreated}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="det-sbib">
            <FieldContent>
              <span>SB / IB</span>
            </FieldContent>
          </FieldLabel>
          <Input
            id="det-sbib"
            value={form.sbIb}
            onChange={(e) => update("sbIb", e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="det-bescheid">
            <FieldContent>
              <span>Bescheid</span>
            </FieldContent>
          </FieldLabel>
          <Textarea
            id="det-bescheid"
            value={form.bescheid}
            onChange={(e) => update("bescheid", e.target.value)}
            rows={2}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
        <FlagRow
          id="det-leos"
          label="Leos One"
          description="In das Kostenkalkulationstool aufnehmen."
          checked={form.leosOne}
          onChange={(v) => update("leosOne", v)}
        />
        <FlagRow
          id="det-schweige"
          label="Schweigepflichtsentbindung"
          description="Liegt unterschrieben vor."
          checked={form.schweigepflichtsentbindung}
          onChange={(v) => update("schweigepflichtsentbindung", v)}
        />
      </div>

      <Field>
        <FieldLabel htmlFor="det-bemerkung">
          <FieldContent>
            <span>Bemerkung</span>
          </FieldContent>
        </FieldLabel>
        <Textarea
          id="det-bemerkung"
          value={form.bemerkung}
          onChange={(e) => update("bemerkung", e.target.value)}
          rows={4}
        />
      </Field>
    </div>
  );
}

function FlagRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </label>
  );
}
