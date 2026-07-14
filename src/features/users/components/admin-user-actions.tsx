"use client";

import { useState } from "react";
import { ArrowUpCircle, MoreVertical, Trash2 } from "lucide-react";
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
import { promoteUserToOwnerAction, removeAdminUserAction } from "../actions";

type Props = {
  user: { id: string; name: string; email: string; role: Role };
  currentUser: { id: string; role: Role };
  ownerCount: number;
};

export function AdminUserActions({ user, currentUser, ownerCount }: Props) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmPromote, setConfirmPromote] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSelf = user.id === currentUser.id;
  const isLastOwner = user.role === Role.OWNER && ownerCount <= 1;

  const showPromote =
    canPromoteToOwner(currentUser.role) && user.role === Role.ADMIN && !isSelf;
  const showRemove = canRemoveTarget(currentUser.role, user.role) && !isSelf;

  if (!showPromote && !showRemove) {
    return null;
  }

  async function handlePromote() {
    setBusy(true);
    try {
      await promoteUserToOwnerAction(user.id);
      toast.success(`${user.name} ist jetzt Owner.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Beförderung fehlgeschlagen.",
      );
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    try {
      await removeAdminUserAction(user.id);
      toast.success(`${user.name} wurde entfernt.`);
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
            <strong>{user.name}</strong> erhält volle Owner-Rechte und kann
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
            <strong>{user.name}</strong> verliert sofort den Zugriff auf die
            Verwaltung. Diese Aktion kann nicht rückgängig gemacht werden.
          </>
        }
        confirmLabel="Entfernen"
        variant="destructive"
        onConfirm={handleRemove}
      />
    </>
  );
}
