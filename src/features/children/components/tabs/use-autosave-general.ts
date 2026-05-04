"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "perfect-debounce";
import { toast } from "sonner";
import { updateChildAction } from "../../actions";
import type { UpdateChildInput } from "../../schemas";
import type { SerializedChild } from "../../serialize";
import type { SchoolValue } from "../school-autocomplete";

export type GeneralFormState = {
  firstName: string;
  lastName: string;
  school: SchoolValue;
  leosOne: boolean;
  schweigepflichtsentbindung: boolean;
  bescheid: string;
  sbIb: string;
  bemerkung: string;
  kostentraegerId: string | null;
};

function fromChild(c: SerializedChild): GeneralFormState {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    school: {
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
    kostentraegerId: c.costBearer?.id ?? null,
  };
}

function diff(
  base: GeneralFormState,
  next: GeneralFormState,
): UpdateChildInput | null {
  const patch: UpdateChildInput = {};
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
    next.school.placeId !== base.school.placeId ||
    next.school.name !== base.school.name ||
    next.school.address !== base.school.address ||
    next.school.lat !== base.school.lat ||
    next.school.lng !== base.school.lng
  ) {
    patch.school = next.school;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

// Debounced autosave for the "Allgemeines" tab. Form state is initialised
// from the first `child` prop and intentionally does NOT re-sync on
// subsequent same-child re-renders (e.g. autosave → revalidatePath →
// re-render); switching child remounts via `key={child.id}` on the parent.
export function useAutosaveGeneral(child: SerializedChild) {
  const [form, setForm] = useState<GeneralFormState>(() => fromChild(child));
  const initial = useRef(fromChild(child));

  // Keep `initial.current` in sync with the latest server snapshot so future
  // patches diff against fresh server state. Form state is left alone.
  useEffect(() => {
    initial.current = fromChild(child);
  }, [child]);

  const persist = useMemo(
    () =>
      debounce(async (patch: UpdateChildInput) => {
        try {
          await updateChildAction(child.id, patch);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
          );
        }
      }, 600),
    [child.id],
  );

  function update<K extends keyof GeneralFormState>(
    key: K,
    value: GeneralFormState[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      const patch = diff(initial.current, next);
      if (patch) void persist(patch);
      return next;
    });
  }

  return { form, update };
}
