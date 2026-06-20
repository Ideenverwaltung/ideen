"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useVault } from "./vault-context";
import {
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  Lock,
  LockOpen,
  LogOut,
  KeyRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
  { href: "/ideen", label: "Ideen", icon: Lightbulb },
  { href: "/projekte", label: "Projekte", icon: FolderKanban },
  { href: "/todos", label: "To-Dos & Stand", icon: ListTodo },
  { href: "/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/tresor", label: "Login-Tresor", icon: KeyRound },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { status, lock } = useVault();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-panel/50 p-4">
      <Link href="/dashboard" className="mb-7 flex items-center gap-2.5 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <Lightbulb size={18} className="text-white" />
        </div>
        <span className="font-semibold">Ideen-Cockpit</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand/15 text-white"
                  : "text-muted hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border pt-3">
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted">
          {status === "unlocked" ? (
            <>
              <LockOpen size={14} className="text-emerald-400" />
              Tresor entsperrt
            </>
          ) : (
            <>
              <Lock size={14} className="text-amber-400" />
              Tresor gesperrt
            </>
          )}
        </div>
        {status === "unlocked" && (
          <button
            onClick={lock}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-white"
          >
            <Lock size={18} />
            Tresor sperren
          </button>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
