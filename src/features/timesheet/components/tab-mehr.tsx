"use client";

import { Card } from "@/components/ui/card";
import { LogoutButton } from "@/components/logout-button";

type Props = {
  name: string;
  email: string;
};

export function TabMehr({ name, email }: Props) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mehr</h1>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center size-12 rounded-full bg-primary/10 text-primary font-semibold">
            {name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{name}</p>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
          </div>
        </div>
      </Card>
      <p className="text-sm text-muted-foreground">
        Einstellungen folgen in einem späteren Update.
      </p>
      <LogoutButton />
    </div>
  );
}
