"use client";

import { CredentialsSection } from "@/components/credentials-section";
import { JournalSection } from "@/components/journal-section";
import { ProjectFormModal } from "@/components/project-form";
import { TasksSection } from "@/components/tasks-section";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { VaultGate } from "@/components/vault-gate";
import { PRIORITY_META, STATUS_META, STATUS_ORDER } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [state, setState] = useState("");
  const [savingState, setSavingState] = useState(false);
  const [stateDirty, setStateDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("projects").select("*").eq("id", id).single();
      setProject(data);
      setState(data?.current_state ?? "");
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function patch(fields: Partial<Project>) {
    if (!project) return;
    setProject({ ...project, ...fields });
    await supabase
      .from("projects")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", project.id);
  }

  async function saveState() {
    setSavingState(true);
    await patch({ current_state: state });
    setSavingState(false);
    setStateDirty(false);
  }

  async function deleteProject() {
    if (!project) return;
    if (!confirm(`„${project.title}" und alle zugehörigen Daten löschen?`)) return;
    await supabase.from("projects").delete().eq("id", project.id);
    router.push("/projekte");
  }

  if (loading)
    return (
      <div className="grid h-[60vh] place-items-center text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!project)
    return (
      <div className="space-y-4">
        <p>Projekt nicht gefunden.</p>
        <Link href="/projekte" className="text-brand hover:underline">
          ← Zurück zur Übersicht
        </Link>
      </div>
    );

  return (
    <div className="animate-in space-y-6">
      <Link
        href="/projekte"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"
      >
        <ArrowLeft size={15} /> Alle Projekte
      </Link>

      {/* Kopfbereich */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className="mt-1.5 h-4 w-4 shrink-0 rounded-full"
              style={{ background: project.color }}
            />
            <div>
              <h1 className="text-2xl font-semibold">{project.title}</h1>
              {project.description && (
                <p className="mt-1 max-w-2xl text-muted">{project.description}</p>
              )}
              {project.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {project.tags.map((t) => (
                    <span key={t} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEdit(true)}>
              <Pencil size={14} /> Bearbeiten
            </Button>
            <Button variant="ghost" size="sm" onClick={deleteProject}>
              <Trash2 size={14} className="text-rose-400" />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <span>Fortschritt</span>
              <span>{project.progress}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ProgressBar value={project.progress} />
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={project.progress}
                onChange={(e) => patch({ progress: Number(e.target.value) })}
                className="!w-28 accent-indigo-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted">Status</span>
            <select
              value={project.status}
              onChange={(e) => patch({ status: e.target.value as ProjectStatus })}
              className="!py-1.5 text-sm"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted">Priorität</span>
            <Badge className={`${PRIORITY_META[project.priority].color} border-border bg-white/5`}>
              {PRIORITY_META[project.priority].label}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Aktueller Stand */}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <MapPin size={18} className="text-rose-400" />
          <h2 className="font-semibold">Wo ich gerade stehe</h2>
        </div>
        <textarea
          rows={3}
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setStateDirty(true);
          }}
          placeholder="Kurzer aktueller Stand: Was ist erledigt, was ist als Nächstes dran?"
        />
        {stateDirty && (
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={saveState} disabled={savingState}>
              {savingState ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Stand speichern
            </Button>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <TasksSection projectId={project.id} />
        <JournalSection projectId={project.id} />
      </div>

      <VaultGate>
        <CredentialsSection projectId={project.id} />
      </VaultGate>

      <p className="text-center text-xs text-muted">
        Erstellt am {formatDate(project.created_at)} · Zuletzt aktualisiert{" "}
        {formatDate(project.updated_at, true)}
      </p>

      <ProjectFormModal
        open={edit}
        onClose={() => setEdit(false)}
        project={project}
        onSaved={(p) => {
          setProject(p);
          setState(p.current_state);
        }}
      />
    </div>
  );
}
