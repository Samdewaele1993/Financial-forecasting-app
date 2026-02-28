import type { AppState } from '../types';

const STORAGE_KEY = 'forecast_app_v1';

function defaultState(): AppState {
  return { employees: [], projects: [], fixedConfigs: [], tmEntries: [] };
}

function migrate(state: AppState): AppState {
  return {
    ...state,
    // Bestaande projecten zonder status krijgen default 'actief'
    projects: state.projects.map(p => ({
      ...p,
      status: p.status ?? ('actief' as const),
    })),
    // Bestaande medewerkers zonder capaciteit krijgen default 160
    employees: state.employees.map(e => ({
      ...e,
      capacityHoursPerMonth: e.capacityHoursPerMonth ?? 160,
    })),
  };
}

export function loadFromStorage(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return migrate(JSON.parse(raw) as AppState);
  } catch {
    return defaultState();
  }
}

export function saveToStorage(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
