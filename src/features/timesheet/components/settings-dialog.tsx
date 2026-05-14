"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  email: string;
};

export function SettingsDialog({ open, onOpenChange, name, email }: Props) {
  const initials = getInitials(name);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
          <DialogDescription>Angemeldet mit diesen Kontodaten.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-amber-400/80 to-rose-500/60 text-lg font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-medium">{name}</p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Weitere Profileinstellungen folgen in einem späteren Update.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
