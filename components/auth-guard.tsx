"use client";

import { createClient } from "@/lib/supabase/client";
import { Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Clientseitiger Schutz der App-Routen. Ohne gültige Session geht es zurück
 * zum Login. Die eigentliche Daten-Absicherung passiert über Row Level
 * Security in Supabase – diese Komponente steuert nur die Navigation/UX.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) router.replace("/login");
      else setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready)
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <div className="grid h-12 w-12 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <Lightbulb size={24} className="text-white" />
          </div>
          <span className="text-sm">Lädt…</span>
        </div>
      </div>
    );

  return <>{children}</>;
}
