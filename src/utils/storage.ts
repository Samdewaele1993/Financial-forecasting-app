import type { AppState } from '../types';

const STORAGE_KEY = 'forecast_app_v1';

function defaultState(): AppState {
  return { employees: [], projects: [], fixedConfigs: [], tmEntries: [] };
}

export function loadFromStorage(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw) as AppState;
  } catch {
    return defaultState();
  }
}

export function saveToStorage(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
