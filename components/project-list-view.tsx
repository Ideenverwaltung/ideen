"use client";

import { ProjectFormModal } from "@/components/project-form";
import { Badge, Button, Card, EmptyState, ProgressBar } from "@/components/ui";
import { PRIORITY_META, STATUS_META } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Lightbulb, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function ProjectListView({
  allowedStatuses,
  title,
  subtitle,
  newLabel,
  defaultStatus,
  emptyTitle,
  emptyHint,
}: {
  allowedStatuses: ProjectStatus[];
  title: string;
  subtitle: string;
  newLabel: string;
  defaultStatus: ProjectStatus;
  emptyTitle: string;
  emptyHint: string;
}) {
  const supabase = createClient();
  const [all, setAll] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState<ProjectStatus | "alle">("alle");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      setAll(data ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nur Einträge dieser Kategorie (Ideen ODER Projekte)
  const scoped = useMemo(
    () => all.filter((p) => allowedStatuses.includes(p.status)),
    [all, allowedStatuses],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { alle: scoped.length };
    for (const s of allowedStatuses) c[s] = scoped.filter((p) => p.status === s).length;
    return c;
  }, [scoped, allowedStatuses]);

  const visible = scoped.filter((p) => {
    const okStatus = filter === "alle" || p.status === filter;
    const okQ =
      !q ||
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(q.toLowerCase()));
    return okStatus && okQ;
  });

  return (
    <div className="animate-in space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-muted">{subtitle}</p>
        </div>
        <Button onClick={() => setModal(true)}>
          <Plus size={16} /> {newLabel}
        </Button>
      </header>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suchen…"
          className="!pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["alle", ...allowedStatuses] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              filter === s
                ? "border-brand bg-brand/15 text-white"
                : "border-border text-muted hover:text-white",
            )}
          >
            {s === "alle" ? "Alle" : STATUS_META[s].label}
            <span className="ml-1.5 text-xs opacity-60">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid h-[40vh] place-items-center text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Lightbulb size={28} />}
          title={scoped.length === 0 ? emptyTitle : "Nichts gefunden"}
          hint={scoped.length === 0 ? emptyHint : "Passe Filter oder Suche an."}
          action={
            scoped.length === 0 ? (
              <Button onClick={() => setModal(true)}>
                <Plus size={16} /> {newLabel}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <Link key={p.id} href={`/projekte/${p.id}`}>
              <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{ background: p.color }}
                  />
                  <Badge className={STATUS_META[p.status].color}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[p.status].dot)} />
                    {STATUS_META[p.status].label}
                  </Badge>
                </div>
                <h3 className="mt-2 font-semibold leading-snug">{p.title}</h3>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>
                )}
                <div className="mt-auto pt-4">
                  {p.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <ProgressBar value={p.progress} />
                    <span className="w-9 text-right text-xs text-muted">{p.progress}%</span>
                  </div>
                  <p className={cn("mt-2 text-xs", PRIORITY_META[p.priority].color)}>
                    Priorität: {PRIORITY_META[p.priority].label}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ProjectFormModal
        open={modal}
        onClose={() => setModal(false)}
        defaultStatus={defaultStatus}
        onSaved={(p) => setAll((prev) => [p, ...prev])}
      />
    </div>
  );
}
