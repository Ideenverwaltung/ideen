"use client";

import { ProjectListView } from "@/components/project-list-view";
import { PROJECT_STATUSES } from "@/lib/constants";

export default function ProjektePage() {
  return (
    <ProjectListView
      allowedStatuses={PROJECT_STATUSES}
      title="Projekte"
      subtitle="Woran du gerade arbeitest."
      newLabel="Neues Projekt"
      defaultStatus="aktiv"
      emptyTitle="Noch keine Projekte"
      emptyHint={'Sobald du eine Idee umsetzt, lege sie hier als Projekt an – oder verschiebe eine Idee per Status auf „In Arbeit".'}
    />
  );
}
