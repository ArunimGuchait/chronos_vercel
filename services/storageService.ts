
import { TaskRecord } from '../types';

const STORAGE_PREFIX = 'chronos_ws_';
const WORKSPACES_KEY = 'chronos_workspaces';
const LEGACY_KEY = 'chronos_app_state';

// Initialize and migrate legacy data if necessary
export const getStoredWorkspaces = (): string[] => {
  const workspacesJson = localStorage.getItem(WORKSPACES_KEY);
  
  // Check for legacy data if no new structure exists
  if (!workspacesJson) {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        const name = parsed.workspaceName || 'Main Workspace';
        
        // Migrate data
        const newData = {
          activeTask: parsed.activeTask,
          history: parsed.history,
          lastExportedMonth: parsed.lastExportedMonth
        };
        localStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(newData));
        localStorage.setItem(WORKSPACES_KEY, JSON.stringify([name]));
        
        // Optional: Remove legacy key after successful migration
        // localStorage.removeItem(LEGACY_KEY); 
        
        return [name];
      } catch (e) {
        console.error("Migration failed", e);
        return [];
      }
    }
    return [];
  }

  try {
    return JSON.parse(workspacesJson);
  } catch {
    return [];
  }
};

export const saveWorkspaceList = (list: string[]) => {
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(list));
};

export const saveWorkspaceData = (workspaceName: string, data: any) => {
  localStorage.setItem(`${STORAGE_PREFIX}${workspaceName}`, JSON.stringify(data));
};

export const loadWorkspaceData = (workspaceName: string) => {
  const data = localStorage.getItem(`${STORAGE_PREFIX}${workspaceName}`);
  return data ? JSON.parse(data) : null;
};

export const deleteWorkspaceData = (workspaceName: string) => {
  localStorage.removeItem(`${STORAGE_PREFIX}${workspaceName}`);
};

// Legacy exports kept for CSV compatibility, updated to accept data directly
export const convertToCSV = (records: TaskRecord[]): string => {
  if (records.length === 0) return '';
  
  const headers = ['ID', 'Task Name', 'Start Time', 'End Time', 'Duration (s)', 'Tags', 'Date'];
  const rows = records.map(r => [
    r.id,
    `"${r.taskName.replace(/"/g, '""')}"`,
    new Date(r.startTime).toISOString(),
    r.endTime ? new Date(r.endTime).toISOString() : 'N/A',
    r.duration,
    `"${r.tags.join(',')}"`,
    r.date
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getMonthKey = (date: Date = new Date()) => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};
