// Storage keys
export const STORAGE_PREFIX = 'chronos_ws_';
export const WORKSPACES_KEY = 'chronos_workspaces';
export const LEGACY_KEY = 'chronos_app_state';

// UI Constants
export const CHART_DAYS = 7;
export const RECENT_ACTIVITIES_LIMIT = 5;
export const MIN_CHART_SCALE_SECONDS = 3600; // 1 hour

// Time formatting
export const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit'
};

// Date formatting
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'short'
};

