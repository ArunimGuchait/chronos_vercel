export interface TaskRecord {
  id: string;
  taskName: string;
  startTime: number;
  endTime: number | null;
  duration: number; // in seconds
  tags: string[];
  date: string; // YYYY-MM-DD
}

export interface WorkspaceData {
  activeTask: TaskRecord | null;
  history: TaskRecord[];
  lastExportedMonth: string | null;
}

export interface AppState {
  activeTask: TaskRecord | null;
  history: TaskRecord[];
  workspaceName: string | null;
}
