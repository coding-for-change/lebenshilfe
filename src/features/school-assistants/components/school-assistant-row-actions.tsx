"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Send, Trash2 } from "lucide-react";
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
import { SchulbegleiterStatus } from "@/generated/prisma";
import {
  deleteSchoolAssistantAction,
  resendSchoolAssistantInvitationAction,
} from "../actions";

type Props = {
  profileId: string;
  name: string;
  status: SchulbegleiterStatus;
  onEdit: () => void;
};

export function SchoolAssistantRowActions({
  profileId,
  name,
  status,
  onEdit,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const canResend = status === SchulbegleiterStatus.INVITATION_PENDING;

  async function handleResend() {
    setResending(true);
    try {
      await resendSchoolAssistantInvitationAction(profileId);
      toast.success("Einladung erneut gesendet.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Einladung konnte nicht gesendet werden.",
      );
    } finally {
      setResending(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteSchoolAssistantAction(profileId);
      toast.success(`${name} wurde entfernt.`);
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
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil />
            Bearbeiten
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canResend || resending}
            onSelect={(e) => {
              e.preventDefault();
              handleResend();
            }}
          >
            <Send />
            Einladung erneut senden
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
        title="Schulbegleiter löschen?"
        description={
          <>
            <strong>{name}</strong> sowie alle zugehörigen Workshop-Teilnahmen
            werden unwiderruflich entfernt.
          </>
        }
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
