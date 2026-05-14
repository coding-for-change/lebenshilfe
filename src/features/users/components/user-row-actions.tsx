"use client";

import { useState } from "react";
import { ArrowUpCircle, MoreVertical, Send, Trash2, X } from "lucide-react";
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
import { canPromoteToOwner, canRemoveTarget } from "@/lib/roles";
import {
  cancelAdminInvitationAction,
  promoteUserToOwnerAction,
  removeAdminUserAction,
  resendAdminInvitationAction,
} from "../actions";

export type UserRowSubject =
  | { kind: "user"; id: string; name: string; email: string; role: Role }
  | { kind: "invitation"; id: string; email: string; role: Role };

type Props = {
  subject: UserRowSubject;
  currentUser: { id: string; role: Role };
  ownerCount: number;
};

export function UserRowActions({ subject, currentUser, ownerCount }: Props) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmPromote, setConfirmPromote] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSelf = subject.kind === "user" && subject.id === currentUser.id;
  const isLastOwner =
    subject.kind === "user" && subject.role === Role.OWNER && ownerCount <= 1;

  // ---------- USER row ----------
  if (subject.kind === "user") {
    const showPromote =
      canPromoteToOwner(currentUser.role) &&
      subject.role === Role.ADMIN &&
      !isSelf;
    const showRemove =
      canRemoveTarget(currentUser.role, subject.role) && !isSelf;

    if (!showPromote && !showRemove) {
      return null;
    }

    async function handlePromote() {
      setBusy(true);
      try {
        if (subject.kind !== "user") return;
        await promoteUserToOwnerAction(subject.id);
        toast.success(`${subject.name} ist jetzt Owner.`);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Beförderung fehlgeschlagen.",
        );
        throw error;
      } finally {
        setBusy(false);
      }
    }

    async function handleRemove() {
      try {
        if (subject.kind !== "user") return;
        await removeAdminUserAction(subject.id);
        toast.success(`${subject.name} wurde entfernt.`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Entfernen fehlgeschlagen.",
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
            {showPromote ? (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmPromote(true);
                }}
              >
                <ArrowUpCircle />
                Zum Owner befördern
              </DropdownMenuItem>
            ) : null}
            {showPromote && showRemove ? <DropdownMenuSeparator /> : null}
            {showRemove ? (
              <DropdownMenuItem
                variant="destructive"
                disabled={isLastOwner}
                onSelect={(e) => {
                  e.preventDefault();
                  if (isLastOwner) return;
                  setConfirmRemove(true);
                }}
              >
                <Trash2 />
                {isLastOwner ? "Entfernen (letzter Owner)" : "Entfernen"}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <ConfirmDialog
          open={confirmPromote}
          onOpenChange={setConfirmPromote}
          title="Zum Owner befördern?"
          description={
            <>
              <strong>{subject.name}</strong> erhält volle Owner-Rechte und kann
              andere Owner ernennen oder entfernen.
            </>
          }
          confirmLabel="Befördern"
          onConfirm={handlePromote}
        />

        <ConfirmDialog
          open={confirmRemove}
          onOpenChange={setConfirmRemove}
          title="Benutzer entfernen?"
          description={
            <>
              <strong>{subject.name}</strong> verliert sofort den Zugriff auf
              die Verwaltung. Diese Aktion kann nicht rückgängig gemacht werden.
            </>
          }
          confirmLabel="Entfernen"
          variant="destructive"
          onConfirm={handleRemove}
        />
      </>
    );
  }

  // ---------- INVITATION row ----------
  const canCancelOwnerInvite =
    subject.role !== Role.OWNER || currentUser.role === Role.OWNER;

  async function handleResend() {
    setBusy(true);
    try {
      if (subject.kind !== "invitation") return;
      await resendAdminInvitationAction(subject.id);
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
      if (subject.kind !== "invitation") return;
      await cancelAdminInvitationAction(subject.id);
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
            Die Einladung an <strong>{subject.email}</strong> wird ungültig.
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
