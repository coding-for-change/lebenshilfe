"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  fetchEmailFromToken,
  consumeUsedToken,
} from "@/use-cases/onboard-invited-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function OnboardPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const router = useRouter();
  const params = use(searchParams);
  const token = params.token;

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "verifying"
  >("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (token) {
      fetchEmailFromToken(token)
        .then((resEmail) => {
          setEmail(resEmail);
          setStatus("idle");
        })
        .catch(() => {
          setStatus("error");
          setErrorMessage("Der Link ist ungültig oder abgelaufen.");
        });
    } else {
      setStatus("error");
      setErrorMessage("Kein Einladungstoken gefunden.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;

    setStatus("loading");
    try {
      const result = await authClient.signUp.email({ email, password, name });
      if (result.error) throw result.error;

      await consumeUsedToken(token as string);

      setStatus("success");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      console.error(err);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Fehler beim Registrieren.",
      );
    }
  }

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
        <p className="text-muted-foreground font-medium">Lade Einladung...</p>
      </div>
    );
  }

  if (
    (status === "error" && errorMessage.includes("abgelaufen")) ||
    errorMessage.includes("Kein")
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
        <p className="text-destructive font-bold text-xl">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-border p-8 space-y-6">
        {status === "success" ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Profil erstellt!
            </h1>
            <p className="text-muted-foreground text-sm">
              Du wirst ins Dashboard weitergeleitet...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-primary tracking-tight">
                Willkommen!
              </h1>
              <p className="text-sm text-muted-foreground">
                Schließe deine Registrierung ab.
              </p>
            </div>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  E-Mail (verifiziert)
                </label>
                <Input
                  disabled
                  value={email}
                  className="h-12 bg-muted opacity-60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Vollständiger Name
                </label>
                <Input
                  type="text"
                  placeholder="Max Mustermann"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                  disabled={status === "loading"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Passwort
                </label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  disabled={status === "loading"}
                />
              </div>
              {status === "error" && (
                <p className="text-sm text-destructive font-medium text-center">
                  {errorMessage}
                </p>
              )}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium transition-all"
                disabled={status === "loading"}
              >
                {status === "loading"
                  ? "Wird verarbeitet..."
                  : "Profil aktivieren"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
