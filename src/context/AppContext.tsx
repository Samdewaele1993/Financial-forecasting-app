import { createContext, useCallback, useEffect, useReducer, useState, type ReactNode } from 'react';
import type { AppState, Employee, FixedProjectConfig, Project, TMEntry } from '../types';
import { supabase } from '../lib/supabase';
import { applyToSupabase, fetchAll } from '../lib/db';

// ── Action types (exported so db.ts can import them) ─────────────────
export type Action =
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_FIXED_CONFIG'; payload: FixedProjectConfig }
  | { type: 'UPSERT_TM_ENTRY'; payload: TMEntry }
  | { type: 'DELETE_TM_ENTRY'; payload: { projectId: string; employeeId: string; month: string } }
  | { type: 'SET_ALL'; payload: AppState };

// ── Reducer ──────────────────────────────────────────────────────────
const emptyState: AppState = { employees: [], projects: [], fixedConfigs: [], tmEntries: [] };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ALL':
      return action.payload;
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e),
      };
    case 'DELETE_EMPLOYEE': {
      const id = action.payload;
      return {
        ...state,
        employees: state.employees.filter(e => e.id !== id),
        fixedConfigs: state.fixedConfigs.map(c => ({
          ...c,
          assignedEmployeeIds: c.assignedEmployeeIds.filter(eid => eid !== id),
        })),
        tmEntries: state.tmEntries.filter(e => e.employeeId !== id),
      };
    }
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'DELETE_PROJECT': {
      const id = action.payload;
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== id),
        fixedConfigs: state.fixedConfigs.filter(c => c.projectId !== id),
        tmEntries: state.tmEntries.filter(e => e.projectId !== id),
      };
    }
    case 'SET_FIXED_CONFIG':
      return {
        ...state,
        fixedConfigs: [
          ...state.fixedConfigs.filter(c => c.projectId !== action.payload.projectId),
          action.payload,
        ],
      };
    case 'UPSERT_TM_ENTRY': {
      const { projectId, employeeId, month } = action.payload;
      const filtered = state.tmEntries.filter(
        e => !(e.projectId === projectId && e.employeeId === employeeId && e.month === month)
      );
      return { ...state, tmEntries: [...filtered, action.payload] };
    }
    case 'DELETE_TM_ENTRY': {
      const { projectId, employeeId, month } = action.payload;
      return {
        ...state,
        tmEntries: state.tmEntries.filter(
          e => !(e.projectId === projectId && e.employeeId === employeeId && e.month === month)
        ),
      };
    }
  }
}

// ── Context ──────────────────────────────────────────────────────────
export interface AppContextValue {
  state: AppState;
  dispatch: (action: Action) => void;
  loading: boolean;
  error: string | null;
}

export const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, internalDispatch] = useReducer(reducer, emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load from Supabase
  useEffect(() => {
    fetchAll()
      .then(data => {
        internalDispatch({ type: 'SET_ALL', payload: data });
        setLoading(false);
      })
      .catch(err => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, []);

  // Realtime: any change in Supabase → refetch all
  useEffect(() => {
    const channel = supabase
      .channel('app-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        fetchAll().then(data => internalDispatch({ type: 'SET_ALL', payload: data }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchAll().then(data => internalDispatch({ type: 'SET_ALL', payload: data }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixed_project_configs' }, () => {
        fetchAll().then(data => internalDispatch({ type: 'SET_ALL', payload: data }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tm_entries' }, () => {
        fetchAll().then(data => internalDispatch({ type: 'SET_ALL', payload: data }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Dispatch: optimistic local update + async Supabase mutation
  const dispatch = useCallback((action: Action) => {
    if (action.type === 'SET_ALL') {
      internalDispatch(action);
      return;
    }
    // Optimistic update — UI reacts instantly
    internalDispatch(action);
    // Persist to Supabase in background
    applyToSupabase(action).catch(err => {
      console.error('Supabase mutation failed:', err);
      // Revert to server state on failure
      fetchAll().then(data => internalDispatch({ type: 'SET_ALL', payload: data }));
    });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, loading, error }}>
      {children}
    </AppContext.Provider>
  );
}
