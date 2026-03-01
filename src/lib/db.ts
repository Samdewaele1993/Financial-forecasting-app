import type { Employee, FixedProjectConfig, Project, TMEntry, AppState } from '../types';
import type { Action } from '../context/AppContext';
import { supabase } from './supabase';
import type { EmployeeRow, FixedConfigRow, ProjectRow, TMEntryRow } from './supabase';

// ── Supabase row → TypeScript ────────────────────────────────────────

function rowToEmployee(r: EmployeeRow): Employee {
  return {
    id: r.id,
    name: r.name,
    title: r.title,
    monthlyCost: r.monthly_cost,
    capacityHoursPerMonth: r.capacity_hours_per_month,
  };
}

function rowToProject(r: ProjectRow): Project {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    status: r.status,
    ...(r.client_name ? { clientName: r.client_name } : {}),
  };
}

function rowToFixedConfig(r: FixedConfigRow): FixedProjectConfig {
  return {
    projectId: r.project_id,
    price: r.price,
    startMonth: r.start_month,
    durationMonths: r.duration_months,
    assignedEmployeeIds: r.assigned_employee_ids ?? [],
    ...(r.estimated_hours != null ? { estimatedHours: r.estimated_hours } : {}),
  };
}

function rowToTMEntry(r: TMEntryRow): TMEntry {
  return {
    projectId: r.project_id,
    employeeId: r.employee_id,
    month: r.month,
    hours: r.hours,
    hourlyRate: r.hourly_rate,
  };
}

// ── TypeScript → Supabase row ────────────────────────────────────────

function employeeToRow(e: Employee): EmployeeRow {
  return {
    id: e.id,
    name: e.name,
    title: e.title,
    monthly_cost: e.monthlyCost,
    capacity_hours_per_month: e.capacityHoursPerMonth,
  };
}

function projectToRow(p: Project): ProjectRow {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    client_name: p.clientName ?? null,
    status: p.status,
  };
}

function fixedConfigToRow(c: FixedProjectConfig): FixedConfigRow {
  return {
    project_id: c.projectId,
    price: c.price,
    start_month: c.startMonth,
    duration_months: c.durationMonths,
    assigned_employee_ids: c.assignedEmployeeIds,
    estimated_hours: c.estimatedHours ?? null,
  };
}

function tmEntryToRow(e: TMEntry): TMEntryRow {
  return {
    project_id: e.projectId,
    employee_id: e.employeeId,
    month: e.month,
    hours: e.hours,
    hourly_rate: e.hourlyRate,
  };
}

// ── Fetch all ────────────────────────────────────────────────────────

export async function fetchAll(): Promise<AppState> {
  const [
    { data: employees, error: e1 },
    { data: projects, error: e2 },
    { data: fixedConfigs, error: e3 },
    { data: tmEntries, error: e4 },
  ] = await Promise.all([
    supabase.from('employees').select('*').order('name'),
    supabase.from('projects').select('*').order('name'),
    supabase.from('fixed_project_configs').select('*'),
    supabase.from('tm_entries').select('*'),
  ]);

  const err = e1 ?? e2 ?? e3 ?? e4;
  if (err) throw new Error(err.message);

  return {
    employees: ((employees ?? []) as EmployeeRow[]).map(rowToEmployee),
    projects: ((projects ?? []) as ProjectRow[]).map(rowToProject),
    fixedConfigs: ((fixedConfigs ?? []) as FixedConfigRow[]).map(rowToFixedConfig),
    tmEntries: ((tmEntries ?? []) as TMEntryRow[]).map(rowToTMEntry),
  };
}

// ── Apply action to Supabase ─────────────────────────────────────────

function throwIfError(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`[${context}] ${error.message}`);
}

export async function applyToSupabase(action: Action): Promise<void> {
  switch (action.type) {

    case 'ADD_EMPLOYEE': {
      const { error } = await supabase.from('employees').insert(employeeToRow(action.payload));
      throwIfError(error, 'ADD_EMPLOYEE');
      break;
    }

    case 'UPDATE_EMPLOYEE': {
      const { error } = await supabase.from('employees')
        .update(employeeToRow(action.payload))
        .eq('id', action.payload.id);
      throwIfError(error, 'UPDATE_EMPLOYEE');
      break;
    }

    case 'DELETE_EMPLOYEE': {
      const id = action.payload;
      const { error: e1 } = await supabase.from('tm_entries').delete().eq('employee_id', id);
      throwIfError(e1, 'DELETE_EMPLOYEE:tm_entries');
      const { data: configs, error: e2 } = await supabase
        .from('fixed_project_configs')
        .select('project_id, assigned_employee_ids');
      throwIfError(e2, 'DELETE_EMPLOYEE:fetch_configs');
      if (configs) {
        for (const cfg of configs as FixedConfigRow[]) {
          const updated = cfg.assigned_employee_ids.filter(eid => eid !== id);
          if (updated.length !== cfg.assigned_employee_ids.length) {
            const { error: e3 } = await supabase.from('fixed_project_configs')
              .update({ assigned_employee_ids: updated })
              .eq('project_id', cfg.project_id);
            throwIfError(e3, 'DELETE_EMPLOYEE:update_config');
          }
        }
      }
      const { error: e4 } = await supabase.from('employees').delete().eq('id', id);
      throwIfError(e4, 'DELETE_EMPLOYEE:employees');
      break;
    }

    case 'ADD_PROJECT': {
      const { error } = await supabase.from('projects').insert(projectToRow(action.payload));
      throwIfError(error, 'ADD_PROJECT');
      break;
    }

    case 'UPDATE_PROJECT': {
      const { error } = await supabase.from('projects')
        .update(projectToRow(action.payload))
        .eq('id', action.payload.id);
      throwIfError(error, 'UPDATE_PROJECT');
      break;
    }

    case 'DELETE_PROJECT': {
      // fixed_project_configs and tm_entries cascade via FK
      const { error } = await supabase.from('projects').delete().eq('id', action.payload);
      throwIfError(error, 'DELETE_PROJECT');
      break;
    }

    case 'SET_FIXED_CONFIG': {
      const { error } = await supabase.from('fixed_project_configs')
        .upsert(fixedConfigToRow(action.payload), { onConflict: 'project_id' });
      throwIfError(error, 'SET_FIXED_CONFIG');
      break;
    }

    case 'UPSERT_TM_ENTRY': {
      const { error } = await supabase.from('tm_entries')
        .upsert(tmEntryToRow(action.payload), { onConflict: 'project_id,employee_id,month' });
      throwIfError(error, 'UPSERT_TM_ENTRY');
      break;
    }

    case 'DELETE_TM_ENTRY': {
      const { projectId, employeeId, month } = action.payload;
      const { error } = await supabase.from('tm_entries').delete()
        .eq('project_id', projectId)
        .eq('employee_id', employeeId)
        .eq('month', month);
      throwIfError(error, 'DELETE_TM_ENTRY');
      break;
    }

    case 'SET_ALL':
      // Internal action — no Supabase call needed
      break;
  }
}
