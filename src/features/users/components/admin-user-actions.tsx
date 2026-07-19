"use client";

import { useState } from "react";
import {
  ArrowUpCircle,
  LockOpen,
  MoreVertical,
  ShieldOff,
  Trash2,
} from "lucide-react";
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
  canPromoteToOwner,
  canRemoveTarget,
  canResetTwoFactor,
  canUnlockTwoFactor,
} from "@/lib/roles";
import {
  promoteUserToOwnerAction,
  removeAdminUserAction,
  resetUserTwoFactorAction,
  unlockUserTwoFactorAction,
} from "../actions";

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    twoFactorEnabled: boolean;
  };
  currentUser: { id: string; role: Role };
  ownerCount: number;
};

export function AdminUserActions({ user, currentUser, ownerCount }: Props) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmPromote, setConfirmPromote] = useState(false);
  const [confirmResetTwoFactor, setConfirmResetTwoFactor] = useState(false);
  const [confirmUnlockTwoFactor, setConfirmUnlockTwoFactor] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSelf = user.id === currentUser.id;
  const isLastOwner = user.role === Role.OWNER && ownerCount <= 1;

  const showPromote =
    canPromoteToOwner(currentUser.role) && user.role === Role.ADMIN && !isSelf;
  const showRemove = canRemoveTarget(currentUser.role, user.role) && !isSelf;
  const showResetTwoFactor =
    canResetTwoFactor(currentUser.role, user.role) &&
    user.twoFactorEnabled &&
    !isSelf;
  const showUnlockTwoFactor =
    canUnlockTwoFactor(currentUser.role, user.role) &&
    user.twoFactorEnabled &&
    !isSelf;

  if (
    !showPromote &&
    !showRemove &&
    !showResetTwoFactor &&
    !showUnlockTwoFactor
  ) {
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

  async function handleResetTwoFactor() {
    try {
      await resetUserTwoFactorAction(user.id);
      toast.success(
        `2FA für ${user.name} zurückgesetzt. Beim nächsten Login wird eine neue Einrichtung verlangt.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Zurücksetzen fehlgeschlagen.",
      );
      throw error;
    }
  }

  async function handleUnlockTwoFactor() {
    try {
      await unlockUserTwoFactorAction(user.id);
      toast.success(`2FA-Sperre für ${user.name} aufgehoben.`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Aufheben der Sperre fehlgeschlagen.",
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
          {showPromote && (showUnlockTwoFactor || showResetTwoFactor) ? (
            <DropdownMenuSeparator />
          ) : null}
          {showUnlockTwoFactor ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setConfirmUnlockTwoFactor(true);
              }}
            >
              <LockOpen />
              2FA-Sperre aufheben
            </DropdownMenuItem>
          ) : null}
          {showResetTwoFactor ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setConfirmResetTwoFactor(true);
              }}
            >
              <ShieldOff />
              2FA zurücksetzen
            </DropdownMenuItem>
          ) : null}
          {(showPromote || showUnlockTwoFactor || showResetTwoFactor) &&
          showRemove ? (
            <DropdownMenuSeparator />
          ) : null}
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

      <ConfirmDialog
        open={confirmResetTwoFactor}
        onOpenChange={setConfirmResetTwoFactor}
        title="2FA zurücksetzen?"
        description={
          <>
            Die Zwei-Faktor-Einrichtung von <strong>{user.name}</strong> wird
            gelöscht. Beim nächsten Login genügt das Passwort und es muss eine
            neue Authenticator-App eingerichtet werden. Nutze dies nur, wenn die
            Person keinen Zugriff mehr auf App und Wiederherstellungscodes hat.
          </>
        }
        confirmLabel="Zurücksetzen"
        onConfirm={handleResetTwoFactor}
      />

      <ConfirmDialog
        open={confirmUnlockTwoFactor}
        onOpenChange={setConfirmUnlockTwoFactor}
        title="2FA-Sperre aufheben?"
        description={
          <>
            Nach zu vielen falschen Codes wird die Zwei-Faktor-Anmeldung von{" "}
            <strong>{user.name}</strong> vorübergehend gesperrt. Das Aufheben
            setzt die Sperre sofort zurück, damit die Person wieder einen
            gültigen Code eingeben kann. Die bestehende
            Authenticator-Einrichtung bleibt erhalten.
          </>
        }
        confirmLabel="Sperre aufheben"
        onConfirm={handleUnlockTwoFactor}
      />
    </>
  );
}
