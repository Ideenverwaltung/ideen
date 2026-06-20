"use client";

import { Button, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Loader2, MapPin, Save } from "lucide-react";
import { useEffect, useState } from "react";

export function CurrentStateCard({
  projectId,
  initial,
  onSaved,
}: {
  projectId: string;
  initial: string;
  onSaved?: (state: string) => void;
}) {
  const supabase = createClient();
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Bei Projektwechsel zurücksetzen
  useEffect(() => {
    setState(initial);
    setDirty(false);
  }, [projectId, initial]);

  async function save() {
    setSaving(true);
    await supabase
      .from("projects")
      .update({ current_state: state, updated_at: new Date().toISOString() })
      .eq("id", projectId);
    setSaving(false);
    setDirty(false);
    onSaved?.(state);
  }

  return (
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
          setDirty(true);
        }}
        placeholder="Kurzer aktueller Stand: Was ist erledigt, was ist als Nächstes dran?"
      />
      {dirty && (
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Stand speichern
          </Button>
        </div>
      )}
    </Card>
  );
}
