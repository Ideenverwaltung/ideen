"use client";

import { Button, Card, Field, Modal } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent, Project } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { de } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function KalenderPage() {
  const supabase = createClient();
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [presetDate, setPresetDate] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const [e, p] = await Promise.all([
        supabase.from("events").select("*").order("start_at"),
        supabase.from("projects").select("*").order("title"),
      ]);
      setEvents(e.data ?? []);
      setProjects(p.data ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = format(new Date(ev.start_at), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), ev]);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => new Date(e.start_at) >= new Date(new Date().toDateString()))
        .slice(0, 8),
    [events],
  );

  function openNew(d?: Date) {
    setEditing(null);
    setPresetDate(d ?? new Date());
    setModal(true);
  }

  return (
    <div className="animate-in space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Kalender</h1>
          <p className="mt-1 text-muted">Termine & Deadlines im Blick.</p>
        </div>
        <Button onClick={() => openNew()}>
          <Plus size={16} /> Termin
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold capitalize">
              {format(cursor, "MMMM yyyy", { locale: de })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCursor(subMonths(cursor, 1))}
                className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCursor(new Date())}
                className="rounded-lg px-2.5 py-1 text-xs text-muted hover:bg-white/5 hover:text-white"
              >
                Heute
              </button>
              <button
                onClick={() => setCursor(addMonths(cursor, 1))}
                className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid h-72 place-items-center text-muted">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-1 grid grid-cols-7 text-center text-xs text-muted">
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayEvents = eventsByDay.get(key) ?? [];
                  const inMonth = isSameMonth(day, cursor);
                  return (
                    <button
                      key={key}
                      onClick={() => openNew(day)}
                      className={cn(
                        "flex min-h-[76px] flex-col gap-1 rounded-lg border border-transparent p-1.5 text-left transition-colors hover:border-border hover:bg-white/5",
                        !inMonth && "opacity-35",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-full text-xs",
                          isToday(day)
                            ? "bg-brand font-bold text-white"
                            : "text-muted",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 2).map((ev) => {
                          const proj = projects.find((p) => p.id === ev.project_id);
                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(ev);
                                setModal(true);
                              }}
                              className="truncate rounded px-1 py-0.5 text-[11px] leading-tight"
                              style={{
                                background: (proj?.color ?? "#6366f1") + "33",
                                color: "#e6e6ee",
                              }}
                            >
                              {ev.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <span className="px-1 text-[10px] text-muted">
                            +{dayEvents.length - 2} mehr
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* Anstehend */}
        <div className="space-y-3">
          <h2 className="font-semibold">Anstehend</h2>
          {upcoming.length === 0 ? (
            <Card className="p-5 text-center text-sm text-muted">
              <CalendarDays size={26} className="mx-auto mb-2 opacity-50" />
              Keine bevorstehenden Termine.
            </Card>
          ) : (
            upcoming.map((ev) => {
              const proj = projects.find((p) => p.id === ev.project_id);
              return (
                <Card
                  key={ev.id}
                  className="cursor-pointer p-3 transition-colors hover:border-brand/40"
                  onClick={() => {
                    setEditing(ev);
                    setModal(true);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: proj?.color ?? "#6366f1" }}
                    />
                    <p className="flex-1 truncate text-sm font-medium">{ev.title}</p>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <Clock size={12} />
                    {formatDate(ev.start_at, !ev.all_day)}
                  </p>
                  {proj && (
                    <p className="mt-0.5 text-xs text-muted">📁 {proj.title}</p>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      <EventModal
        open={modal}
        onClose={() => setModal(false)}
        editing={editing}
        presetDate={presetDate}
        projects={projects}
        onSaved={(ev, isNew) =>
          setEvents((prev) =>
            isNew ? [...prev, ev] : prev.map((x) => (x.id === ev.id ? ev : x)),
          )
        }
        onDeleted={(id) => setEvents((prev) => prev.filter((x) => x.id !== id))}
      />
    </div>
  );
}

function EventModal({
  open,
  onClose,
  editing,
  presetDate,
  projects,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  editing: CalendarEvent | null;
  presetDate: Date | null;
  projects: Project[];
  onSaved: (ev: CalendarEvent, isNew: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [pid, setPid] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const d = new Date(editing.start_at);
      setTitle(editing.title);
      setDescription(editing.description);
      setDate(format(d, "yyyy-MM-dd"));
      setTime(format(d, "HH:mm"));
      setAllDay(editing.all_day);
      setPid(editing.project_id ?? "");
    } else {
      setTitle("");
      setDescription("");
      setDate(format(presetDate ?? new Date(), "yyyy-MM-dd"));
      setTime("09:00");
      setAllDay(false);
      setPid("");
    }
  }, [open, editing, presetDate]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const start = new Date(`${date}T${allDay ? "00:00" : time}`);
    const payload = {
      title: title.trim(),
      description,
      start_at: start.toISOString(),
      all_day: allDay,
      project_id: pid || null,
    };
    if (editing) {
      const { data } = await supabase
        .from("events")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      if (data) onSaved(data as CalendarEvent, false);
    } else {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("events")
        .insert({ ...payload, user_id: u.user!.id })
        .select()
        .single();
      if (data) onSaved(data as CalendarEvent, true);
    }
    setSaving(false);
    onClose();
  }

  async function del() {
    if (!editing) return;
    await supabase.from("events").delete().eq("id", editing.id);
    onDeleted(editing.id);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Termin bearbeiten" : "Neuer Termin"}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Titel">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Investoren-Call"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Datum">
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Uhrzeit">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={allDay}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          Ganztägig
        </label>
        <Field label="Projekt (optional)">
          <select value={pid} onChange={(e) => setPid(e.target.value)}>
            <option value="">— Kein Projekt —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notiz (optional)">
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <div className="flex items-center justify-between pt-1">
          {editing ? (
            <Button type="button" variant="ghost" size="sm" onClick={del}>
              <Trash2 size={14} className="text-rose-400" /> Löschen
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              Speichern
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
