"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "done" | "error" | "invalid"
  >(token ? "idle" : "invalid");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirm) {
      setErrorMsg("Die Passwörter stimmen nicht überein.");
      setStatus("error");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Das Passwort muss mindestens 8 Zeichen lang sein.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    const result = await resetPassword({
      newPassword: password,
      token: token!,
    });

    if (result.error) {
      setErrorMsg(
        "Der Reset-Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.",
      );
      setStatus("error");
    } else {
      setStatus("done");
      setTimeout(() => router.push("/login"), 2500);
    }
  }

  if (status === "invalid") {
    return (
      <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-center">
        <p className="text-sm text-destructive font-medium">
          Kein gültiger Reset-Link gefunden. Bitte fordere einen neuen an.
        </p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 text-center">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            Passwort erfolgreich geändert! Du wirst weitergeleitet…
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Input
        type="password"
        placeholder="Neues Passwort"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-12"
        disabled={status === "loading"}
        minLength={8}
      />
      <Input
        type="password"
        placeholder="Passwort bestätigen"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="h-12"
        disabled={status === "loading"}
      />
      {status === "error" && (
        <p className="text-xs text-destructive text-center">{errorMsg}</p>
      )}
      <Button
        type="submit"
        className="w-full h-12 text-base font-medium shadow-md transition-all hover:scale-[1.02]"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Wird gespeichert…" : "Passwort speichern"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-border p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Neues Passwort
          </h1>
          <p className="text-sm text-muted-foreground">
            Wähle ein sicheres neues Passwort für dein Konto.
          </p>
        </div>
        {/* Suspense required because useSearchParams needs it in Next.js App Router */}
        <Suspense
          fallback={
            <p className="text-sm text-center text-muted-foreground">
              Wird geladen…
            </p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
