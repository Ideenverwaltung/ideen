"use client";

import { Button, Field, Modal } from "@/components/ui";
import { PRIORITY_META, STATUS_META, STATUS_ORDER } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Priority, Project, ProjectStatus } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444"];

export function ProjectFormModal({
  open,
  onClose,
  onSaved,
  project,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (p: Project) => void;
  project?: Project | null;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "idee");
  const [priority, setPriority] = useState<Priority>(project?.priority ?? "mittel");
  const [progress, setProgress] = useState(project?.progress ?? 0);
  const [color, setColor] = useState(project?.color ?? COLORS[0]);
  const [tags, setTags] = useState((project?.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const payload = {
      title: title.trim(),
      description,
      status,
      priority,
      progress,
      color,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    };
    try {
      if (project) {
        const { data, error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", project.id)
          .select()
          .single();
        if (error) throw error;
        onSaved(data as Project);
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("projects")
          .insert({ ...payload, user_id: u.user!.id })
          .select()
          .single();
        if (error) throw error;
        onSaved(data as Project);
      }
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={project ? "Projekt bearbeiten" : "Neue Idee / neues Projekt"}
    >
      <form onSubmit={save} className="space-y-4">
        <Field label="Titel">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Lieferservice-App für Almira"
            autoFocus
          />
        </Field>

        <Field label="Beschreibung / Idee">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Worum geht es? Was ist die Vision?"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priorität">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={`Fortschritt: ${progress}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="accent-indigo-500"
          />
        </Field>

        <Field label="Tags (mit Komma getrennt)">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="SaaS, Mobile, B2C"
          />
        </Field>

        <div>
          <span className="text-xs font-medium text-muted">Farbe</span>
          <div className="mt-2 flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-full ring-offset-2 ring-offset-panel transition-transform hover:scale-110"
                style={{
                  background: c,
                  boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                }}
              />
            ))}
          </div>
        </div>

        {err && <p className="text-sm text-rose-300">{err}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={saving || !title.trim()}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            {project ? "Speichern" : "Anlegen"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
