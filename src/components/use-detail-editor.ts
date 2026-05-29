"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

type Options<TEntity, TForm, TPatch> = {
  /** The server snapshot, or `null` when no entity is selected. */
  entity: TEntity | null;
  /** Stable id of the entity; a change means a different entity was picked. */
  entityKey: string | undefined;
  toForm: (entity: TEntity) => TForm;
  /** Returns the changed-fields patch, or `null` when nothing changed. */
  diff: (base: TForm, next: TForm) => TPatch | null;
  persist: (patch: TPatch) => Promise<void>;
};

export type DetailEditor<TForm> = {
  /** Editable form state, or `null` when no entity is selected. */
  form: TForm | null;
  /** `true` when the form diverges from the saved baseline. */
  dirty: boolean;
  saving: boolean;
  update: (patch: Partial<TForm>) => void;
  /** Persists changed fields. Resolves `true` on success (or nothing to save). */
  save: () => Promise<boolean>;
};

/**
 * Drives an always-editable detail panel. Fields are live immediately, but
 * nothing is written until an explicit `save()` — so a single field edit can
 * never clobber untouched fields, and the panel is free of any edit-mode
 * toggle.
 */
export function useDetailEditor<TEntity, TForm, TPatch>({
  entity,
  entityKey,
  toForm,
  diff,
  persist,
}: Options<TEntity, TForm, TPatch>): DetailEditor<TForm> {
  const [form, setForm] = useState<TForm | null>(() =>
    entity ? toForm(entity) : null,
  );
  const [saving, setSaving] = useState(false);
  const baseline = useRef<TForm | null>(form);
  const lastEntity = useRef<TEntity | null>(entity);
  const lastKey = useRef<string | undefined>(entityKey);
  // Guards against a second submit (e.g. Enter again) while a save is in flight.
  const savingRef = useRef(false);

  // Re-sync to the server snapshot during render (React's supported pattern
  // for resetting state from props) so the panel never flashes empty.
  if (entity) {
    if (lastEntity.current !== entity) {
      const keyChanged = lastKey.current !== entityKey;
      const wasDirty =
        !!form && !!baseline.current && diff(baseline.current, form) != null;
      lastEntity.current = entity;
      lastKey.current = entityKey;
      const fresh = toForm(entity);
      baseline.current = fresh;
      // Adopt the new snapshot on a different entity, or when the form had no
      // unsaved edits. Pending edits win over a background refresh.
      if (keyChanged || !wasDirty) setForm(fresh);
    }
  } else if (lastEntity.current !== null) {
    lastEntity.current = null;
    lastKey.current = entityKey;
    baseline.current = null;
    setForm(null);
  }

  const dirty =
    !!form && !!baseline.current && diff(baseline.current, form) != null;

  function update(patch: Partial<TForm>) {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function save(): Promise<boolean> {
    if (savingRef.current || !form || !baseline.current) return false;
    const patch = diff(baseline.current, form);
    if (!patch) return true; // nothing changed — a no-op save still "succeeds"
    savingRef.current = true;
    setSaving(true);
    try {
      await persist(patch);
      toast.success("Änderungen gespeichert.");
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return { form, dirty, saving, update, save };
}
