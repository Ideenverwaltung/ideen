"use client";

import { Combobox } from "@/components/combobox";
import { Button, Card, EmptyState, Field, Modal } from "@/components/ui";
import { useVault } from "@/components/vault-context";
import { SERVICE_PRESETS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Credential, Project } from "@/lib/types";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

/** Gruppiert Logins nach Projekt; Einträge ohne Projekt kommen ans Ende. */
function groupByProject(creds: Credential[], projects: Project[]) {
  const groups: { project: Project | null; items: Credential[] }[] = [];
  const indexById = new Map<string, number>();

  for (const c of creds) {
    const key = c.project_id ?? "none";
    if (!indexById.has(key)) {
      const project = projects.find((p) => p.id === c.project_id) ?? null;
      indexById.set(key, groups.length);
      groups.push({ project, items: [] });
    }
    groups[indexById.get(key)!].items.push(c);
  }
  // "Ohne Projekt" ans Ende sortieren
  return groups.sort((a, b) => (a.project ? 0 : 1) - (b.project ? 0 : 1));
}

export function CredentialsSection({
  projectId,
  showProjectColumn,
}: {
  projectId?: string;
  showProjectColumn?: boolean;
}) {
  const supabase = createClient();
  const { encrypt } = useVault();
  const [creds, setCreds] = useState<Credential[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);

  useEffect(() => {
    (async () => {
      const q = supabase.from("credentials").select("*").order("created_at", { ascending: false });
      const { data } = projectId ? await q.eq("project_id", projectId) : await q;
      setCreds(data ?? []);
      if (showProjectColumn) {
        const { data: p } = await supabase.from("projects").select("*").order("title");
        setProjects(p ?? []);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function remove(id: string) {
    if (!confirm("Diesen Login wirklich löschen?")) return;
    setCreds((p) => p.filter((c) => c.id !== id));
    await supabase.from("credentials").delete().eq("id", id);
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-emerald-400" />
          <h2 className="font-semibold">Logins & Zugangsdaten</h2>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          <Plus size={15} /> Hinzufügen
        </Button>
      </div>

      {loading ? (
        <div className="grid h-24 place-items-center text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : creds.length === 0 ? (
        <EmptyState
          icon={<KeyRound size={26} />}
          title="Keine Logins gespeichert"
          hint="Speichere Zugangsdaten zu GitHub, Supabase, Cloudflare & Co. – verschlüsselt."
        />
      ) : showProjectColumn ? (
        // Tresor-Ansicht: nach Projekt gruppiert
        <div className="space-y-5">
          {groupByProject(creds, projects).map(({ project, items }) => (
            <div key={project?.id ?? "none"}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: project?.color ?? "#52525b" }}
                />
                <h3 className="text-sm font-semibold">
                  {project?.title ?? "Ohne Projekt"}
                </h3>
                <span className="text-xs text-muted">({items.length})</span>
              </div>
              <div className="space-y-2">
                {items.map((c) => (
                  <CredentialRow
                    key={c.id}
                    cred={c}
                    project={project ?? undefined}
                    showProject={false}
                    onEdit={() => {
                      setEditing(c);
                      setModal(true);
                    }}
                    onDelete={() => remove(c.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {creds.map((c) => (
            <CredentialRow
              key={c.id}
              cred={c}
              project={projects.find((p) => p.id === c.project_id)}
              showProject={false}
              onEdit={() => {
                setEditing(c);
                setModal(true);
              }}
              onDelete={() => remove(c.id)}
            />
          ))}
        </div>
      )}

      <CredentialFormModal
        open={modal}
        onClose={() => setModal(false)}
        projectId={projectId}
        projects={projects}
        showProjectSelect={showProjectColumn}
        editing={editing}
        encrypt={encrypt}
        onSaved={(c, isNew) =>
          setCreds((prev) =>
            isNew ? [c, ...prev] : prev.map((x) => (x.id === c.id ? c : x)),
          )
        }
      />
    </Card>
  );
}

function CredentialRow({
  cred,
  project,
  showProject,
  onEdit,
  onDelete,
}: {
  cred: Credential;
  project?: Project;
  showProject?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { decrypt } = useVault();
  const [secret, setSecret] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function reveal() {
    if (secret === null) {
      setBusy(true);
      setSecret(await decrypt({ ciphertext: cred.secret_ciphertext, iv: cred.secret_iv }));
      setBusy(false);
    }
    setShow((s) => !s);
  }

  async function copy() {
    const val = secret ?? (await decrypt({ ciphertext: cred.secret_ciphertext, iv: cred.secret_iv }));
    setSecret(val);
    await navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group rounded-xl border border-border bg-panel-2/50 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{cred.service}</span>
            {cred.label && <span className="text-sm text-muted">· {cred.label}</span>}
            {showProject && project && (
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-xs text-muted">
                {project.title}
              </span>
            )}
          </div>
          {cred.username && (
            <p className="mt-0.5 text-sm text-muted">👤 {cred.username}</p>
          )}
          {cred.url && (
            <a
              href={cred.url.startsWith("http") ? cred.url : `https://${cred.url}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand hover:underline"
            >
              {cred.url}
            </a>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit} className="rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-white" title="Bearbeiten">
            <Pencil size={15} />
          </button>
          <button onClick={onDelete} className="rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-rose-400" title="Löschen">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {cred.secret_ciphertext && (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 font-mono text-sm">
          <span className="flex-1 truncate">
            {busy ? "…" : show ? secret : "••••••••••••"}
          </span>
          <button onClick={reveal} className="text-muted hover:text-white" title="Anzeigen">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button onClick={copy} className="text-muted hover:text-white" title="Kopieren">
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          </button>
        </div>
      )}
    </div>
  );
}

function CredentialFormModal({
  open,
  onClose,
  projectId,
  projects,
  showProjectSelect,
  editing,
  encrypt,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  projects: Project[];
  showProjectSelect?: boolean;
  editing: Credential | null;
  encrypt: (t: string) => Promise<{ ciphertext: string; iv: string }>;
  onSaved: (c: Credential, isNew: boolean) => void;
}) {
  const supabase = createClient();
  const { decrypt } = useVault();
  const [service, setService] = useState("");
  const [label, setLabel] = useState("");
  const [username, setUsername] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [notes, setNotes] = useState("");
  const [pid, setPid] = useState<string>(projectId ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      if (editing) {
        setService(editing.service);
        setLabel(editing.label);
        setUsername(editing.username);
        setUrl(editing.url);
        setPid(editing.project_id ?? "");
        setSecret(
          editing.secret_ciphertext
            ? await decrypt({ ciphertext: editing.secret_ciphertext, iv: editing.secret_iv })
            : "",
        );
        setNotes(
          editing.notes_ciphertext
            ? await decrypt({ ciphertext: editing.notes_ciphertext, iv: editing.notes_iv })
            : "",
        );
      } else {
        setService("");
        setLabel("");
        setUsername("");
        setUrl("");
        setSecret("");
        setNotes("");
        setPid(projectId ?? "");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const sCipher = await encrypt(secret);
    const nCipher = await encrypt(notes);
    const payload = {
      service,
      label,
      username,
      url,
      project_id: pid || null,
      secret_ciphertext: sCipher.ciphertext,
      secret_iv: sCipher.iv,
      notes_ciphertext: nCipher.ciphertext,
      notes_iv: nCipher.iv,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      const { data } = await supabase
        .from("credentials")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      if (data) onSaved(data as Credential, false);
    } else {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("credentials")
        .insert({ ...payload, user_id: u.user!.id })
        .select()
        .single();
      if (data) onSaved(data as Credential, true);
    }
    setSaving(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      icon={<KeyRound size={20} />}
      title={editing ? "Login bearbeiten" : "Login hinzufügen"}
      subtitle="Verschlüsselt gespeichert – nur mit deinem Master-Passwort lesbar."
    >
      <form onSubmit={save} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Anwendung / Dienst">
            <Combobox
              value={service}
              onChange={setService}
              options={SERVICE_PRESETS.filter((s) => s !== "Sonstiges")}
              placeholder="z.B. GitHub, Supabase …"
              required
              autoFocus
            />
          </Field>
          <Field label="Bezeichnung (optional)">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="z.B. Prod-Account" />
          </Field>
        </div>

        {showProjectSelect && (
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
        )}

        <Field label="Benutzername / E-Mail">
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Passwort / API-Key / Token">
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoComplete="off"
            className="font-mono"
          />
        </Field>
        <Field label="URL (optional)">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Notizen (optional, verschlüsselt)">
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 size={16} className="animate-spin" />}
            Speichern
          </Button>
        </div>
      </form>
    </Modal>
  );
}
