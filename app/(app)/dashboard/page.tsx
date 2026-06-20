"use client";

import { Badge, Card, EmptyState, ProgressBar } from "@/components/ui";
import { IDEA_STATUSES, STATUS_META } from "@/lib/constants";
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
        supabase
          .from("tasks")
          .select("*")
          .eq("done", false)
          .order("due_date", { ascending: true, nullsFirst: false }),
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

  const ideen = projects.filter((p) => IDEA_STATUSES.includes(p.status));
  const aktiv = projects.filter((p) => p.status === "aktiv");
  const fertig = projects.filter((p) => p.status === "fertig");
  const projById = new Map(projects.map((p) => [p.id, p]));

  const greeting =
    new Date().getHours() < 11 ? "Guten Morgen" : new Date().getHours() < 18 ? "Hallo" : "Guten Abend";

  const stats = [
    { label: "Ideen", value: ideen.length, icon: Lightbulb, c: "text-amber-400", href: "/ideen" },
    { label: "In Arbeit", value: aktiv.length, icon: Sparkles, c: "text-emerald-400", href: "/projekte" },
    { label: "Offene To-dos", value: tasks.length, icon: ListTodo, c: "text-sky-400", href: "/todos" },
    { label: "Abgeschlossen", value: fertig.length, icon: CheckCircle2, c: "text-violet-400", href: "/projekte" },
  ];

  return (
    <div className="animate-in space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">
          {greeting}
          {name ? `, ${name}` : ""} 👋
        </h1>
        <p className="mt-1 text-muted">Dein Überblick über Ideen, Projekte, Aufgaben und Termine.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-4 transition-colors hover:border-brand/40">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{s.label}</span>
                <s.icon size={18} className={s.c} />
              </div>
              <p className="mt-2 text-3xl font-semibold">{s.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Linke Spalte: Projekte + To-dos */}
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Aktive Projekte</h2>
              <Link href="/projekte" className="text-sm text-brand hover:underline">
                Alle anzeigen
              </Link>
            </div>
            {aktiv.length === 0 ? (
              <EmptyState
                icon={<Sparkles size={26} />}
                title="Keine aktiven Projekte"
                hint={'Setze eine Idee auf „In Arbeit", dann erscheint sie hier.'}
              />
            ) : (
              <div className="space-y-3">
                {aktiv.slice(0, 4).map((p) => (
                  <Link key={p.id} href={`/projekte/${p.id}`}>
                    <Card className="p-4 transition-colors hover:border-brand/40">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                          <span className="font-medium">{p.title}</span>
                        </div>
                        <Badge className={STATUS_META[p.status].color}>
                          {STATUS_META[p.status].label}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar value={p.progress} />
                        <span className="w-9 text-right text-xs text-muted">{p.progress}%</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Offene To-dos</h2>
              <Link href="/todos" className="text-sm text-brand hover:underline">
                Zu den To-Dos
              </Link>
            </div>
            {tasks.length === 0 ? (
              <EmptyState
                icon={<ListTodo size={26} />}
                title="Alles erledigt 🎉"
                hint="Keine offenen Aufgaben."
              />
            ) : (
              <Card className="divide-y divide-border">
                {tasks.slice(0, 7).map((t) => {
                  const proj = t.project_id ? projById.get(t.project_id) : undefined;
                  return (
                    <Link
                      key={t.id}
                      href="/todos"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5"
                    >
                      <span className="h-4 w-4 shrink-0 rounded-md border border-border" />
                      <span className="flex-1 truncate text-sm">{t.title}</span>
                      {proj && (
                        <span className="flex items-center gap-1.5 text-xs text-muted">
                          <span className="h-2 w-2 rounded-full" style={{ background: proj.color }} />
                          {proj.title}
                        </span>
                      )}
                      {t.due_date && (
                        <span className="text-xs text-muted">{formatDate(t.due_date)}</span>
                      )}
                    </Link>
                  );
                })}
                {tasks.length > 7 && (
                  <div className="px-4 py-2 text-center text-xs text-muted">
                    +{tasks.length - 7} weitere
                  </div>
                )}
              </Card>
            )}
          </section>
        </div>

        {/* Rechte Spalte: Ideen + Termine */}
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Ideen-Pipeline</h2>
              <Link href="/ideen" className="text-sm text-brand hover:underline">
                Alle
              </Link>
            </div>
            {ideen.length === 0 ? (
              <Card className="p-5 text-center text-sm text-muted">
                <Lightbulb size={24} className="mx-auto mb-2 opacity-50" />
                Noch keine Ideen.
              </Card>
            ) : (
              <Card className="p-4">
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
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Anstehende Termine</h2>
              <Link href="/kalender" className="text-sm text-brand hover:underline">
                Kalender
              </Link>
            </div>
            {events.length === 0 ? (
              <Card className="p-5 text-center text-sm text-muted">
                <CalendarClock size={24} className="mx-auto mb-2 opacity-50" />
                Keine Termine.
              </Card>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => (
                  <Card key={ev.id} className="flex items-center gap-3 p-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand/15">
                      <span className="text-xs font-bold text-brand">
                        {new Date(ev.start_at)
                          .toLocaleDateString("de-DE", { month: "short" })
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{ev.title}</p>
                      <p className="text-xs text-muted">{formatDate(ev.start_at, !ev.all_day)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
