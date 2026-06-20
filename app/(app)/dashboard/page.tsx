"use client";

import { Badge, Card, EmptyState, ProgressBar } from "@/components/ui";
import { STATUS_META } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent, Project, Task } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Lightbulb,
  ListTodo,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setName(u.user?.email?.split("@")[0] ?? "");
      const [p, t, e] = await Promise.all([
        supabase.from("projects").select("*").order("updated_at", { ascending: false }),
        supabase.from("tasks").select("*").eq("done", false),
        supabase
          .from("events")
          .select("*")
          .gte("start_at", new Date().toISOString())
          .order("start_at", { ascending: true })
          .limit(5),
      ]);
      setProjects(p.data ?? []);
      setTasks(t.data ?? []);
      setEvents(e.data ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <div className="grid h-[60vh] place-items-center text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );

  const aktiv = projects.filter((p) => p.status === "aktiv");
  const ideen = projects.filter((p) => p.status === "idee");
  const fertig = projects.filter((p) => p.status === "fertig");
  const greeting =
    new Date().getHours() < 11
      ? "Guten Morgen"
      : new Date().getHours() < 18
        ? "Hallo"
        : "Guten Abend";

  const stats = [
    { label: "Projekte gesamt", value: projects.length, icon: FolderKanban, c: "text-indigo-400" },
    { label: "In Arbeit", value: aktiv.length, icon: Sparkles, c: "text-emerald-400" },
    { label: "Offene To-dos", value: tasks.length, icon: ListTodo, c: "text-amber-400" },
    { label: "Abgeschlossen", value: fertig.length, icon: CheckCircle2, c: "text-violet-400" },
  ];

  return (
    <div className="animate-in space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">
          {greeting}
          {name ? `, ${name}` : ""} 👋
        </h1>
        <p className="mt-1 text-muted">
          Dein Überblick über alle Ideen, Projekte und Termine.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{s.label}</span>
              <s.icon size={18} className={s.c} />
            </div>
            <p className="mt-2 text-3xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Aktive Projekte */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Aktive Projekte</h2>
            <Link href="/projekte" className="text-sm text-brand hover:underline">
              Alle anzeigen
            </Link>
          </div>
          {aktiv.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={28} />}
              title="Noch keine aktiven Projekte"
              hint={'Markiere ein Projekt als „In Arbeit", damit es hier erscheint.'}
            />
          ) : (
            <div className="space-y-3">
              {aktiv.slice(0, 5).map((p) => (
                <Link key={p.id} href={`/projekte/${p.id}`}>
                  <Card className="p-4 transition-colors hover:border-brand/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: p.color }}
                        />
                        <span className="font-medium">{p.title}</span>
                      </div>
                      <Badge className={STATUS_META[p.status].color}>
                        {STATUS_META[p.status].label}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar value={p.progress} />
                      <span className="w-9 text-right text-xs text-muted">
                        {p.progress}%
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {ideen.length > 0 && (
            <Card className="mt-4 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-300">
                <Lightbulb size={16} /> Ideen in der Pipeline ({ideen.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {ideen.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projekte/${p.id}`}
                    className="rounded-full border border-border bg-panel-2 px-3 py-1 text-sm hover:border-brand/40"
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Anstehende Termine */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Anstehende Termine</h2>
            <Link href="/kalender" className="text-sm text-brand hover:underline">
              Kalender
            </Link>
          </div>
          {events.length === 0 ? (
            <EmptyState
              icon={<CalendarClock size={28} />}
              title="Keine Termine"
              hint="Lege im Kalender deinen ersten Termin an."
            />
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <Card key={ev.id} className="flex items-center gap-3 p-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand/15 text-center">
                    <span className="text-xs font-bold text-brand">
                      {new Date(ev.start_at)
                        .toLocaleDateString("de-DE", { month: "short" })
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted">
                      {formatDate(ev.start_at, !ev.all_day)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
