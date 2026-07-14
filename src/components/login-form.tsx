"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  initialError,
  ...props
}: React.ComponentProps<"div"> & { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [customError, setCustomError] = useState<string | undefined>(
    initialError,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setCustomError(undefined);

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        setStatus("error");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <Card className="border-border/60 shadow-xl">
        <CardHeader className="gap-2 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Anmelden
          </CardTitle>
          <CardDescription className="text-sm">
            Bitte logge dich mit deinem Passwort ein.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-6">
              <Field>
                <FieldLabel htmlFor="email">E-Mail</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@lebenshilfe.de"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading"}
                  className="h-11"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Passwort</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Passwort vergessen?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === "loading"}
                  className="h-11"
                />
              </Field>
              {(status === "error" || customError) && (
                <p className="-mt-2 text-center text-sm text-destructive">
                  {customError || "E-Mail oder Passwort falsch."}
                </p>
              )}
              <Field>
                <Button
                  type="submit"
                  className="h-11 w-full text-base font-medium"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Wird angemeldet…" : "Anmelden"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <p className="px-6 text-center text-xs text-white">
        Zugang nur für eingeladene Mitglieder der Lebenshilfe München.
      </p>
    </div>
  );
}
