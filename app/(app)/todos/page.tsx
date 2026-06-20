"use client";

import { CurrentStateCard } from "@/components/current-state-card";
import { JournalSection } from "@/components/journal-section";
import { TasksSection } from "@/components/tasks-section";
import { Badge, Card, EmptyState } from "@/components/ui";
import { isIdea, STATUS_META } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Project, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowRight, ListTodo, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function TodosPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: t }] = await Promise.all([
        supabase.from("projects").select("*").order("updated_at", { ascending: false }),
        supabase.from("tasks").select("project_id, done").eq("done", false),
      ]);
      const projs = p ?? [];
      setProjects(projs);
      const counts: Record<string, number> = {};
      for (const task of (t ?? []) as Pick<Task, "project_id" | "done">[]) {
        if (task.project_id) counts[task.project_id] = (counts[task.project_id] ?? 0) + 1;
      }
      setOpenCounts(counts);
      setSelectedId((cur) => cur ?? projs[0]?.id ?? null);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId],
  );

  const totalOpen = Object.values(openCounts).reduce((a, b) => a + b, 0);

  if (loading)
    return (
      <div className="grid h-[60vh] place-items-center text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="animate-in space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">To-Dos & Stand</h1>
        <p className="mt-1 text-muted">
          Wähle ein Projekt oder eine Idee – notiere den aktuellen Stand und arbeite die
          Aufgaben ab. {totalOpen > 0 && `Insgesamt ${totalOpen} offen.`}
        </p>
      </header>

      {projects.length === 0 ? (
        <EmptyState
          icon={<ListTodo size={28} />}
          title="Noch keine Projekte oder Ideen"
          hint="Lege zuerst eine Idee oder ein Projekt an."
          action={
            <Link href="/ideen" className="text-brand hover:underline">
              Zu den Ideen →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Auswahl-Liste */}
          <div className="space-y-1.5">
            {projects.map((p) => {
              const count = openCounts[p.id] ?? 0;
              const active = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-brand bg-brand/10"
                      : "border-border hover:bg-white/5",
                  )}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.title}</span>
                    <span className="text-xs text-muted">
                      {isIdea(p.status) ? "💡 Idee" : "📁 Projekt"} · {STATUS_META[p.status].label}
                    </span>
                  </span>
                  {count > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500/20 px-1.5 text-xs font-medium text-amber-300">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detailbereich des ausgewählten Eintrags */}
          {selected && (
            <div className="space-y-6">
              <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ background: selected.color }} />
                  <div>
                    <h2 className="font-semibold">{selected.title}</h2>
                    <Badge className={cn("mt-1", STATUS_META[selected.status].color)}>
                      {STATUS_META[selected.status].label}
                    </Badge>
                  </div>
                </div>
                <Link
                  href={`/projekte/${selected.id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
                >
                  Vollständige Detailseite <ArrowRight size={14} />
                </Link>
              </Card>

              <CurrentStateCard
                key={selected.id}
                projectId={selected.id}
                initial={selected.current_state}
                onSaved={(s) =>
                  setProjects((prev) =>
                    prev.map((x) => (x.id === selected.id ? { ...x, current_state: s } : x)),
                  )
                }
              />

              <TasksSection key={`tasks-${selected.id}`} projectId={selected.id} />
              <JournalSection key={`journal-${selected.id}`} projectId={selected.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
