"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Persist the pending changes. Should close the panel itself on success. */
  onSave: () => Promise<void> | void;
  /** Discard the pending changes and close the panel. */
  onDiscard: () => void;
};

/** Asks what to do with unsaved edits when a detail panel is being closed. */
export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onSave,
  onDiscard,
}: Props) {
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !saving && onOpenChange(next)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ungespeicherte Änderungen</DialogTitle>
          <DialogDescription>
            Möchtest du deine Änderungen speichern, bevor du schließt?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onDiscard}
            disabled={saving}
          >
            Verwerfen
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
