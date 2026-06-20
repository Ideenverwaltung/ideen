import type { ProjectStatus, Priority } from "./types";

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; color: string; dot: string }
> = {
  idee:      { label: "Idee",          color: "text-amber-300 bg-amber-500/10 border-amber-500/20",   dot: "bg-amber-400" },
  planung:   { label: "In Planung",    color: "text-sky-300 bg-sky-500/10 border-sky-500/20",         dot: "bg-sky-400" },
  aktiv:     { label: "In Arbeit",     color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  pausiert:  { label: "Pausiert",      color: "text-zinc-300 bg-zinc-500/10 border-zinc-500/20",       dot: "bg-zinc-400" },
  fertig:    { label: "Abgeschlossen", color: "text-violet-300 bg-violet-500/10 border-violet-500/20", dot: "bg-violet-400" },
  verworfen: { label: "Verworfen",     color: "text-rose-300 bg-rose-500/10 border-rose-500/20",       dot: "bg-rose-400" },
};

export const STATUS_ORDER: ProjectStatus[] = [
  "idee", "planung", "aktiv", "pausiert", "fertig", "verworfen",
];

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  niedrig: { label: "Niedrig", color: "text-zinc-400" },
  mittel:  { label: "Mittel",  color: "text-sky-400" },
  hoch:    { label: "Hoch",    color: "text-rose-400" },
};

// Vorlagen für häufige Dienste (Logins)
export const SERVICE_PRESETS = [
  "GitHub",
  "Supabase",
  "Cloudflare",
  "IONOS",
  "Vercel",
  "Netlify",
  "Stripe",
  "OpenAI",
  "Anthropic",
  "Google Cloud",
  "Domain / DNS",
  "Datenbank",
  "Sonstiges",
];
