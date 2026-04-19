"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setStatus("error");
      } else {
        router.push("/");
        router.refresh(); // Important to instantly hydrate the session component checks
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-border p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Anmelden
          </h1>
          <p className="text-sm text-muted-foreground">
            Bitte logge dich mit deinem Passwort ein.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="E-Mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              disabled={status === "loading"}
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Passwort"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
              disabled={status === "loading"}
            />
          </div>
          {status === "error" && (
            <p className="text-xs text-destructive text-center">
              E-Mail oder Passwort falsch.
            </p>
          )}
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              Passwort vergessen?
            </Link>
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium shadow-md transition-all hover:scale-[1.02]"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Wird angemeldet..." : "Anmelden"}
          </Button>
        </form>
      </div>
    </div>
  );
}
