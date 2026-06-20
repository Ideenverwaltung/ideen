"use client";

import { ProjectListView } from "@/components/project-list-view";
import { IDEA_STATUSES } from "@/lib/constants";

export default function IdeenPage() {
  return (
    <ProjectListView
      allowedStatuses={IDEA_STATUSES}
      title="Ideen"
      subtitle="Was du noch nicht umgesetzt hast – deine Ideen-Sammlung."
      newLabel="Neue Idee"
      defaultStatus="idee"
      emptyTitle="Noch keine Ideen"
      emptyHint={'Halte hier jeden Geistesblitz fest. Sobald du loslegst, setzt du den Status auf „In Arbeit" – dann wandert sie zu den Projekten.'}
    />
  );
}
