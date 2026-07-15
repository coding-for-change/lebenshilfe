"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import {
  isServerActionNotFoundError,
  reloadForNewDeployment,
} from "@/lib/deployment-skew";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // A stale Server Action (tab built by a previous deployment) cannot be
  // recovered by reset() — that re-renders the same client tree, which still
  // references the missing action ID. Only a full reload fetches the new build.
  const isStaleDeployment = isServerActionNotFoundError(error);

  useEffect(() => {
    if (isStaleDeployment) reloadForNewDeployment();
  }, [isStaleDeployment]);

  if (isStaleDeployment) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md border-border/60 shadow-xl">
          <CardHeader className="gap-2 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RefreshCw className="size-6 animate-spin" />
            </div>
            <CardTitle className="text-xl font-semibold">
              Neue Version verfügbar
            </CardTitle>
            <CardDescription>
              Die Seite wird neu geladen, um die neueste Version zu laden…
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={() => window.location.reload()}
              variant="default"
            >
              Jetzt neu laden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-md border-border/60 shadow-xl">
        <CardHeader className="gap-2 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Ein Fehler ist aufgetreten
          </CardTitle>
          <CardDescription>
            Das hätte nicht passieren sollen. Der Fehler wurde protokolliert und
            wird von uns untersucht.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={() => reset()}
            variant="default"
          >
            Nochmal versuchen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
