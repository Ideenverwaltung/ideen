"use client";

import { Button, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { ProjectUpdate } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { History, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function JournalSection({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("updates")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      setUpdates(data ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("updates")
      .insert({
        project_id: projectId,
        user_id: u.user!.id,
        content: text.trim(),
      })
      .select()
      .single();
    if (data) setUpdates((p) => [data as ProjectUpdate, ...p]);
    setText("");
    setSaving(false);
  }

  async function remove(id: string) {
    setUpdates((p) => p.filter((x) => x.id !== id));
    await supabase.from("updates").delete().eq("id", id);
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <History size={18} className="text-sky-400" />
        <h2 className="font-semibold">Verlauf / Stand festhalten</h2>
      </div>

      <form onSubmit={post} className="mb-5 space-y-2">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Was hast du heute geschafft? Wo stehst du gerade?"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving || !text.trim()}>
            <Send size={14} /> Eintrag speichern
          </Button>
        </div>
      </form>

      {updates.length === 0 ? (
        <p className="py-3 text-center text-sm text-muted">
          Noch keine Einträge. Halte hier deinen Fortschritt fest.
        </p>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-5">
          {updates.map((u) => (
            <li key={u.id} className="group relative">
              <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-400 ring-4 ring-panel" />
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap text-sm">{u.content}</p>
                <button
                  onClick={() => remove(u.id)}
                  className="shrink-0 text-muted opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <span className="text-xs text-muted">{relativeTime(u.created_at)}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
