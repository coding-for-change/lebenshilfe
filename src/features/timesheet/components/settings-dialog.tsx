"use client";

import { useState } from "react";
import { LogOut, User2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type Section = "profil" | "konto";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  email: string;
};

const SECTIONS: Array<{ id: Section; label: string; Icon: typeof User2 }> = [
  { id: "profil", label: "Profil", Icon: User2 },
  { id: "konto", label: "Konto", Icon: LogOut },
];

export function SettingsDialog({ open, onOpenChange, name, email }: Props) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("profil");
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="gap-0 p-0 overflow-hidden sm:max-w-4xl md:max-h-[34rem]">
        <DialogHeader className="sr-only">
          <DialogTitle>Einstellungen</DialogTitle>
          <DialogDescription>Profil und Konto verwalten.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col md:h-[34rem] md:flex-row">
          <aside className="flex shrink-0 flex-col gap-1 border-b border-border bg-muted/40 p-3 md:w-56 md:border-b-0 md:border-r">
            <div className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Einstellungen
            </div>
            <nav className="flex gap-1 md:flex-col">
              {SECTIONS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors md:flex-none",
                    section === id
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 overflow-y-auto p-6">
            {section === "profil" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">Profil</h2>
                  <p className="text-sm text-muted-foreground">
                    Angemeldet mit diesen Kontodaten.
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-amber-400/80 to-rose-500/60 text-lg font-semibold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium">{name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {email}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Weitere Profileinstellungen folgen in einem späteren Update.
                </p>
              </div>
            )}
            {section === "konto" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">Konto</h2>
                  <p className="text-sm text-muted-foreground">
                    Abmelden vom aktuellen Gerät.
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm">
                    Sie sind als{" "}
                    <span className="font-medium text-foreground">{name}</span>{" "}
                    angemeldet.
                  </p>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      disabled={signingOut}
                    >
                      <LogOut className="size-4" />
                      {signingOut ? "Abmelden…" : "Abmelden"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
