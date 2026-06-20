"use client";

import { Button, Card, Field } from "@/components/ui";
import { useVault } from "@/components/vault-context";
import { KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function VaultGate({ children }: { children: React.ReactNode }) {
  const { status, setup, unlock } = useVault();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (status === "loading")
    return (
      <div className="grid h-40 place-items-center text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (status === "unlocked") return <>{children}</>;

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) return setErr("Mindestens 8 Zeichen.");
    if (pw !== pw2) return setErr("Die Passwörter stimmen nicht überein.");
    setBusy(true);
    try {
      await setup(pw);
    } catch {
      setErr("Einrichtung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const ok = await unlock(pw);
    setBusy(false);
    if (!ok) setErr("Falsches Master-Passwort.");
    else setPw("");
  }

  return (
    <Card className="mx-auto max-w-md p-7">
      <div className="mb-5 flex flex-col items-center gap-3 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600">
          {status === "needs-setup" ? (
            <ShieldCheck size={24} className="text-white" />
          ) : (
            <Lock size={24} className="text-white" />
          )}
        </div>
        <div>
          <h2 className="font-semibold">
            {status === "needs-setup"
              ? "Tresor einrichten"
              : "Tresor entsperren"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {status === "needs-setup"
              ? "Lege ein Master-Passwort fest. Damit werden deine Logins verschlüsselt – es verlässt nie deinen Browser."
              : "Gib dein Master-Passwort ein, um deine Logins zu sehen."}
          </p>
        </div>
      </div>

      {status === "needs-setup" ? (
        <form onSubmit={handleSetup} className="space-y-4">
          <Field label="Master-Passwort">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              placeholder="Mind. 8 Zeichen"
            />
          </Field>
          <Field label="Wiederholen">
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
          </Field>
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            ⚠️ Wichtig: Dieses Passwort kann nicht zurückgesetzt werden. Ohne
            es sind deine gespeicherten Logins nicht mehr lesbar.
          </p>
          {err && <p className="text-sm text-rose-300">{err}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            <KeyRound size={16} /> Tresor einrichten
          </Button>
        </form>
      ) : (
        <form onSubmit={handleUnlock} className="space-y-4">
          <Field label="Master-Passwort">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
            />
          </Field>
          {err && <p className="text-sm text-rose-300">{err}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            <Lock size={16} /> Entsperren
          </Button>
        </form>
      )}
    </Card>
  );
}
