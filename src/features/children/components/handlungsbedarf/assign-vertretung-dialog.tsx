"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserCog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";

import {
  SchoolAssistantCombobox,
  type SchoolAssistantOption,
} from "../calendar/school-assistant-combobox";
import { createVertretungAction, updateVertretungAction } from "../../actions";
import type { VertretungAssignTarget } from "../../handlungsbedarf";

type Props = {
  target: VertretungAssignTarget;
  schoolAssistantOptions: SchoolAssistantOption[];
  /** Called after a successful save so the dashboard can reload the week. */
  onResolved?: () => void;
};

/**
 * Inline "Vertretung zuweisen" / "Vertretung ändern" action used by the
 * Handlungsbedarf dashboard. Creates a new Vertretung when none exists yet,
 * or swaps the substitute when one is already in place (e.g. the substitute
 * itself fell sick). Times always mirror the Stundenplan — see the facade.
 */
export function AssignVertretungDialog({
  target,
  schoolAssistantOptions,
  onResolved,
}: Props) {
  const isReassign = target.currentSubstituteUserId != null;
  const [open, setOpen] = useState(false);
  const [substituteUserId, setSubstituteUserId] = useState<string | null>(
    target.currentSubstituteUserId,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!substituteUserId) {
      setError("Bitte einen Schulbegleiter als Vertretung wählen.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (isReassign) {
        await updateVertretungAction(target.childId, target.date, {
          substituteUserId,
        });
      } else {
        await createVertretungAction({
          childId: target.childId,
          substituteUserId,
          date: target.date,
        });
      }
      toast.success("Vertretung gespeichert.");
      setOpen(false);
      onResolved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant={isReassign ? "outline" : "default"}
        className="w-full sm:w-auto"
        onClick={() => {
          setSubstituteUserId(target.currentSubstituteUserId);
          setError(null);
          setOpen(true);
        }}
      >
        <UserCog />
        {isReassign ? "Vertretung ändern" : "Vertretung zuweisen"}
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isReassign ? "Vertretung ändern" : "Vertretung zuweisen"}
            </DialogTitle>
            <DialogDescription>
              {target.childName} · {formatDate(target.date)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Vertreter</Label>
              <SchoolAssistantCombobox
                options={schoolAssistantOptions}
                value={substituteUserId}
                onChange={setSubstituteUserId}
                placeholder="Wer vertritt?"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Zeit: {target.scheduleLabel} (laut Stundenplan)
            </p>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={busy}
            >
              {busy ? "Speichert…" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
