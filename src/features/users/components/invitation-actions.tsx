"use client";

import { useState } from "react";
import { MoreVertical, Send, X } from "lucide-react";
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
import { Role } from "@/generated/prisma";
import {
  cancelAdminInvitationAction,
  resendAdminInvitationAction,
} from "../actions";

type Props = {
  invitation: { id: string; email: string; role: Role };
  currentUser: { role: Role };
};

export function InvitationActions({ invitation, currentUser }: Props) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);

  const canCancelOwnerInvite =
    invitation.role !== Role.OWNER || currentUser.role === Role.OWNER;

  async function handleResend() {
    setBusy(true);
    try {
      await resendAdminInvitationAction(invitation.id);
      toast.success("Einladung erneut gesendet.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Einladung konnte nicht gesendet werden.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    try {
      await cancelAdminInvitationAction(invitation.id);
      toast.success("Einladung widerrufen.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Widerruf fehlgeschlagen.",
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
            disabled={busy}
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
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
            disabled={!canCancelOwnerInvite}
            onSelect={(e) => {
              e.preventDefault();
              if (!canCancelOwnerInvite) return;
              setConfirmCancel(true);
            }}
          >
            <X />
            Einladung widerrufen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Einladung widerrufen?"
        description={
          <>
            Die Einladung an <strong>{invitation.email}</strong> wird ungültig.
            Eine neue Einladung kann jederzeit verschickt werden.
          </>
        }
        confirmLabel="Widerrufen"
        variant="destructive"
        onConfirm={handleCancel}
      />
    </>
  );
}
