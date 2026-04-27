"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role } from "@/generated/prisma";
import { canInviteAsRole } from "@/lib/roles";
import { inviteAdminUserAction } from "../actions";
import { InviteAdminUserSchema, type InviteAdminUserInput } from "../schemas";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole: Role;
};

export function InviteAdminDialog({
  open,
  onOpenChange,
  currentUserRole,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(Role.ADMIN);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof InviteAdminUserInput, string>>
  >({});

  const canInviteOwner = canInviteAsRole(currentUserRole, Role.OWNER);

  function reset() {
    setName("");
    setEmail("");
    setRole(Role.ADMIN);
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = InviteAdminUserSchema.safeParse({ name, email, role });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof InviteAdminUserInput;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setBusy(true);
    try {
      await inviteAdminUserAction(parsed.data);
      toast.success(`Einladung an ${parsed.data.email} gesendet.`);
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Einladen fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Neuen Admin einladen
          </DialogTitle>
          <DialogDescription>
            Die eingeladene Person erhält per E-Mail einen Link, um ihr Konto
            einzurichten.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-name">Name</Label>
            <Input
              id="invite-name"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anna Beispiel"
              disabled={busy}
              aria-invalid={!!errors.name || undefined}
            />
            {errors.name ? (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">E-Mail</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anna@beispiel.de"
              disabled={busy}
              aria-invalid={!!errors.email || undefined}
            />
            {errors.email ? (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">Rolle</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as Role)}
              disabled={busy}
            >
              <SelectTrigger
                id="invite-role"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                {canInviteOwner ? (
                  <SelectItem value={Role.OWNER}>Owner</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === Role.OWNER
                ? "Owner können andere Owner ernennen oder entfernen."
                : "Admins verwalten den Bereich, können aber keine Owner ernennen."}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={busy}
            >
              {busy ? "Wird gesendet…" : "Einladung senden"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
