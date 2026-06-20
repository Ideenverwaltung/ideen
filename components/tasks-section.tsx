"use client";

import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Check, ListTodo, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function TasksSection({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("done", { ascending: true })
        .order("created_at", { ascending: false });
      setTasks(data ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("tasks")
      .insert({
        project_id: projectId,
        user_id: u.user!.id,
        title: title.trim(),
        due_date: due || null,
      })
      .select()
      .single();
    if (data) setTasks((p) => [data as Task, ...p]);
    setTitle("");
    setDue("");
  }

  async function toggle(t: Task) {
    setTasks((p) =>
      p.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
    );
    await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id);
  }

  async function remove(id: string) {
    setTasks((p) => p.filter((x) => x.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  }

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <ListTodo size={18} className="text-amber-400" />
        <h2 className="font-semibold">To-dos</h2>
        <span className="text-sm text-muted">
          {open.length} offen
          {done.length > 0 ? ` · ${done.length} erledigt` : ""}
        </span>
      </div>

      <form onSubmit={add} className="mb-4 flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Neues To-do…"
          className="flex-1 min-w-[160px]"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="!w-auto"
        />
        <button
          type="submit"
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-lg bg-brand text-white hover:bg-indigo-500"
        >
          <Plus size={18} />
        </button>
      </form>

      <ul className="space-y-1.5">
        {[...open, ...done].map((t) => (
          <li
            key={t.id}
            className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5"
          >
            <button
              onClick={() => toggle(t)}
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                t.done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-border hover:border-emerald-500"
              }`}
            >
              {t.done && <Check size={13} />}
            </button>
            <span
              className={`flex-1 text-sm ${t.done ? "text-muted line-through" : ""}`}
            >
              {t.title}
            </span>
            {t.due_date && (
              <span className="text-xs text-muted">{formatDate(t.due_date)}</span>
            )}
            <button
              onClick={() => remove(t.id)}
              className="text-muted opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {tasks.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">
            Noch keine Aufgaben – leg los! 🚀
          </p>
        )}
      </ul>
    </Card>
  );
}
