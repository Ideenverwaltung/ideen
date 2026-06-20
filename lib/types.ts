export type ProjectStatus =
  | "idee"
  | "planung"
  | "aktiv"
  | "pausiert"
  | "fertig"
  | "verworfen";

export type Priority = "niedrig" | "mittel" | "hoch";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  current_state: string;
  tags: string[];
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  user_id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  position: number;
  created_at: string;
}

export interface Credential {
  id: string;
  project_id: string | null;
  user_id: string;
  service: string;
  label: string;
  username: string;
  url: string;
  secret_ciphertext: string;
  secret_iv: string;
  notes_ciphertext: string;
  notes_iv: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  created_at: string;
}
