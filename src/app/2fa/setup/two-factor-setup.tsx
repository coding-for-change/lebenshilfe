"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

import { authClient } from "@/lib/auth-client";
import { prepareTwoFactorSetupAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Step = "password" | "verify" | "backup";

export function TwoFactorSetup() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleEnable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    // Clear any stale enrollment row from an interrupted setup before enabling,
    // so better-auth generates a fresh, unverified secret instead of inheriting
    // the old row's `verified` flag (which makes every code read as invalid).
    try {
      await prepareTwoFactorSetupAction();
    } catch {
      setErrorMsg("Die Einrichtung konnte nicht vorbereitet werden.");
      setStatus("error");
      return;
    }

    const result = await authClient.twoFactor.enable({ password });
    if (result.error || !result.data) {
      setErrorMsg(
        "Das Passwort ist falsch oder die Aktivierung ist fehlgeschlagen.",
      );
      setStatus("error");
      return;
    }

    const { totpURI, backupCodes: codes } = result.data;
    setManualKey(/[?&]secret=([^&]+)/.exec(totpURI)?.[1] ?? "");
    setBackupCodes(codes);
    try {
      setQrSvg(
        await QRCode.toString(totpURI, { type: "svg", margin: 1, width: 220 }),
      );
    } catch {
      setQrSvg("");
    }
    setStatus("idle");
    setStep("verify");
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const result = await authClient.twoFactor.verifyTotp({ code });
    if (result.error) {
      setErrorMsg(
        "Der Code ist ungültig. Prüfe die Uhrzeit deines Geräts und versuche es erneut.",
      );
      setStatus("error");
      return;
    }
    setStatus("idle");
    setStep("backup");
  }

  function downloadCodes() {
    const payload = JSON.stringify(
      {
        service: "Lebenshilfe München",
        type: "2fa-backup-codes",
        codes: backupCodes,
      },
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([payload], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "lebenshilfe-wiederherstellungscodes.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function finish() {
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader className="gap-2 text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Zwei-Faktor-Authentifizierung einrichten
        </CardTitle>
        <CardDescription className="text-sm">
          {step === "password" &&
            "Für Administrator-Konten ist ein zweiter Faktor erforderlich. Bestätige zunächst dein Passwort."}
          {step === "verify" &&
            "Scanne den QR-Code mit einer Authenticator-App (z. B. Google Authenticator, Aegis) und gib den angezeigten Code ein."}
          {step === "backup" &&
            "Bewahre diese Wiederherstellungscodes sicher auf. Jeder Code funktioniert genau einmal."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "password" && (
          <form onSubmit={handleEnable}>
            <FieldGroup className="gap-6">
              <Field>
                <FieldLabel htmlFor="password">Passwort</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === "loading"}
                  className="h-11"
                />
              </Field>
              {status === "error" && (
                <p className="-mt-2 text-center text-sm text-destructive">
                  {errorMsg}
                </p>
              )}
              <Field>
                <Button
                  type="submit"
                  className="h-11 w-full text-base font-medium"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Wird geprüft…" : "Weiter"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        )}

        {step === "verify" && (
          <div className="space-y-5">
            <div className="flex justify-center">
              {qrSvg ? (
                <div
                  className="rounded-lg bg-white p-3"
                  // Self-generated, script-free SVG from the qrcode library.
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  QR-Code konnte nicht erzeugt werden – nutze den Schlüssel
                  unten.
                </p>
              )}
            </div>
            {manualKey && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Oder Schlüssel manuell eingeben:
                </p>
                <code className="mt-1 inline-block break-all rounded bg-muted px-2 py-1 font-mono text-xs">
                  {manualKey}
                </code>
              </div>
            )}
            <form onSubmit={handleVerify}>
              <FieldGroup className="gap-6">
                <Field>
                  <FieldLabel htmlFor="code">Code aus der App</FieldLabel>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim())}
                    disabled={status === "loading"}
                    className="h-11 text-center tracking-widest"
                    placeholder="123456"
                    maxLength={6}
                  />
                </Field>
                {status === "error" && (
                  <p className="-mt-2 text-center text-sm text-destructive">
                    {errorMsg}
                  </p>
                )}
                <Field>
                  <Button
                    type="submit"
                    className="h-11 w-full text-base font-medium"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? "Wird geprüft…" : "Aktivieren"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </div>
        )}

        {step === "backup" && (
          <div className="space-y-5">
            <ul className="grid grid-cols-2 gap-2">
              {backupCodes.map((c) => (
                <li
                  key={c}
                  className="rounded bg-muted px-2 py-1 text-center font-mono text-sm"
                >
                  {c}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                className="w-full"
                onClick={downloadCodes}
              >
                Codes herunterladen
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  navigator.clipboard?.writeText(backupCodes.join("\n"))
                }
              >
                Codes kopieren
              </Button>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={saved}
                onCheckedChange={(v) => setSaved(v === true)}
                className="mt-0.5"
              />
              <span>
                Ich habe die Wiederherstellungscodes an einem sicheren Ort
                gespeichert.
              </span>
            </label>
            <Button
              type="button"
              className="h-11 w-full text-base font-medium"
              disabled={!saved}
              onClick={finish}
            >
              Fertig
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
