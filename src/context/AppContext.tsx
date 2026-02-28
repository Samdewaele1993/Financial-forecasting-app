import { createContext, useEffect, useReducer, type ReactNode } from 'react';
import type { AppState, Employee, FixedProjectConfig, Project, TMEntry } from '../types';
import { loadFromStorage, saveToStorage } from '../utils/storage';

type Action =
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_FIXED_CONFIG'; payload: FixedProjectConfig }
  | { type: 'UPSERT_TM_ENTRY'; payload: TMEntry }
  | { type: 'DELETE_TM_ENTRY'; payload: { projectId: string; employeeId: string; month: string } };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
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

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadFromStorage);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}
