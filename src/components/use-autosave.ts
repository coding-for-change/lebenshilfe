"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "perfect-debounce";
import { toast } from "sonner";

type Options<TEntity, TForm, TPatch> = {
  entity: TEntity;
  entityKey: string;
  toForm: (entity: TEntity) => TForm;
  diff: (base: TForm, next: TForm) => TPatch | null;
  persist: (patch: TPatch) => Promise<void>;
  delayMs?: number;
};

export function useAutosave<TEntity, TForm, TPatch>({
  entity,
  entityKey,
  toForm,
  diff,
  persist: persistFn,
  delayMs = 600,
}: Options<TEntity, TForm, TPatch>) {
  const [form, setForm] = useState<TForm>(() => toForm(entity));
  const initial = useRef<TForm>(toForm(entity));

  // Refresh the diff baseline when the server snapshot changes — the form
  // itself is left alone so in-flight edits aren't clobbered. Switching to a
  // different entity must remount the consumer (e.g. via `key={entity.id}`).
  useEffect(() => {
    initial.current = toForm(entity);
  }, [entity, toForm]);

  // Stable ref so the debounced fn always calls the latest persist closure
  // without re-creating the debouncer on every render.
  const persistRef = useRef(persistFn);
  useEffect(() => {
    persistRef.current = persistFn;
  });

  // `entityKey` rebuilds the debouncer when the entity changes so any
  // pending save from the previous entity is cancelled by the cleanup below
  // before it could fire against the new entity. The ref is only read by
  // the debounced callback, which runs from event handlers — not render.
  const persist = useMemo(
    () =>
      debounce(async (patch: TPatch) => {
        try {
          await persistRef.current(patch);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
          );
        }
      }, delayMs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entityKey, delayMs],
  );

  useEffect(() => () => persist.cancel(), [persist]);

  function update(patch: Partial<TForm>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      const delta = diff(initial.current, next);
      if (delta) void persist(delta);
      return next;
    });
  }

  return { form, update };
}
