"use client";

import { Button, Card, Field } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Lightbulb, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const { error: e2 } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (e2) {
          setMsg(
            "Konto erstellt! Bitte bestätige ggf. deine E-Mail und melde dich dann an.",
          );
          setMode("login");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="animate-in w-full max-w-sm p-7">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Lightbulb size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Ideen-Cockpit</h1>
            <p className="text-sm text-muted">
              {mode === "login"
                ? "Willkommen zurück"
                : "Erstelle dein Konto"}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="E-Mail">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
              autoComplete="email"
            />
          </Field>
          <Field label="Passwort">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </Field>

          {err && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {err}
            </p>
          )}
          {msg && (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {msg}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "login" ? "Anmelden" : "Konto erstellen"}
          </Button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setErr(null);
            setMsg(null);
          }}
          className="mt-5 w-full text-center text-sm text-muted hover:text-white"
        >
          {mode === "login"
            ? "Noch kein Konto? Jetzt registrieren"
            : "Schon ein Konto? Anmelden"}
        </button>
      </Card>
    </div>
  );
}
