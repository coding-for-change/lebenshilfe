"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
