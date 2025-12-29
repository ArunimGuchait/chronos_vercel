
import { TaskRecord, WorkspaceData } from '../types';
import { STORAGE_PREFIX, WORKSPACES_KEY, LEGACY_KEY } from '../constants';

// Error handling wrapper for localStorage operations
const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read from localStorage (${key}):`, error);
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to write to localStorage (${key}):`, error);
    return false;
  }
};

const safeLocalStorageRemove = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove from localStorage (${key}):`, error);
    return false;
  }
};

// Initialize and migrate legacy data if necessary
export const getStoredWorkspaces = (): string[] => {
  const workspacesJson = safeLocalStorageGet(WORKSPACES_KEY);
  
  // Check for legacy data if no new structure exists
  if (!workspacesJson) {
    const legacy = safeLocalStorageGet(LEGACY_KEY);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        const name = parsed.workspaceName || 'Main Workspace';
        
        // Migrate data
        const newData: WorkspaceData = {
          activeTask: parsed.activeTask || null,
          history: parsed.history || [],
          lastExportedMonth: parsed.lastExportedMonth || null
        };
        
        const dataJson = JSON.stringify(newData);
        if (safeLocalStorageSet(`${STORAGE_PREFIX}${name}`, dataJson)) {
          safeLocalStorageSet(WORKSPACES_KEY, JSON.stringify([name]));
          return [name];
        }
      } catch (e) {
        console.error("Migration failed", e);
        return [];
      }
    }
    return [];
  }

  try {
    const parsed = JSON.parse(workspacesJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse workspaces:", error);
    return [];
  }
};

export const saveWorkspaceList = (list: string[]): boolean => {
  try {
    const json = JSON.stringify(list);
    return safeLocalStorageSet(WORKSPACES_KEY, json);
  } catch (error) {
    console.error("Failed to save workspace list:", error);
    return false;
  }
};

export const saveWorkspaceData = (workspaceName: string, data: WorkspaceData): boolean => {
  try {
    const json = JSON.stringify(data);
    return safeLocalStorageSet(`${STORAGE_PREFIX}${workspaceName}`, json);
  } catch (error) {
    console.error(`Failed to save workspace data (${workspaceName}):`, error);
    return false;
  }
};

export const loadWorkspaceData = (workspaceName: string): WorkspaceData | null => {
  const data = safeLocalStorageGet(`${STORAGE_PREFIX}${workspaceName}`);
  if (!data) return null;
  
  try {
    const parsed = JSON.parse(data);
    // Validate structure
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        activeTask: parsed.activeTask || null,
        history: Array.isArray(parsed.history) ? parsed.history : [],
        lastExportedMonth: parsed.lastExportedMonth || null
      };
    }
    return null;
  } catch (error) {
    console.error(`Failed to parse workspace data (${workspaceName}):`, error);
    return null;
  }
};

export const deleteWorkspaceData = (workspaceName: string): boolean => {
  return safeLocalStorageRemove(`${STORAGE_PREFIX}${workspaceName}`);
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
