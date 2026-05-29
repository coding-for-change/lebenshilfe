"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteChildAction } from "../actions";

type Props = {
  childId: string;
  childName: string;
  onOpenDetails: () => void;
};

export function ChildRowActions({ childId, childName, onOpenDetails }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteChildAction(childId);
      toast.success(`${childName} wurde entfernt.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Löschen fehlgeschlagen.",
      );
      throw error;
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Aktionen"
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onOpenDetails}>
            <Pencil />
            Details bearbeiten
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <Trash2 />
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Kind löschen?"
        description={
          <>
            <strong>{childName}</strong> sowie alle zugehörigen Zuweisungen,
            Stundenpläne und Krankheitstage werden unwiderruflich entfernt.
          </>
        }
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
