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

export async function applyToSupabase(action: Action): Promise<void> {
  switch (action.type) {

    case 'ADD_EMPLOYEE':
      await supabase.from('employees').insert(employeeToRow(action.payload));
      break;

    case 'UPDATE_EMPLOYEE':
      await supabase.from('employees')
        .update(employeeToRow(action.payload))
        .eq('id', action.payload.id);
      break;

    case 'DELETE_EMPLOYEE': {
      const id = action.payload;
      // Delete T&M entries for this employee
      await supabase.from('tm_entries').delete().eq('employee_id', id);
      // Remove from fixed config arrays
      const { data: configs } = await supabase
        .from('fixed_project_configs')
        .select('project_id, assigned_employee_ids');
      if (configs) {
        for (const cfg of configs as FixedConfigRow[]) {
          const updated = cfg.assigned_employee_ids.filter(eid => eid !== id);
          if (updated.length !== cfg.assigned_employee_ids.length) {
            await supabase.from('fixed_project_configs')
              .update({ assigned_employee_ids: updated })
              .eq('project_id', cfg.project_id);
          }
        }
      }
      await supabase.from('employees').delete().eq('id', id);
      break;
    }

    case 'ADD_PROJECT':
      await supabase.from('projects').insert(projectToRow(action.payload));
      break;

    case 'UPDATE_PROJECT':
      await supabase.from('projects')
        .update(projectToRow(action.payload))
        .eq('id', action.payload.id);
      break;

    case 'DELETE_PROJECT':
      // fixed_project_configs and tm_entries cascade via FK
      await supabase.from('projects').delete().eq('id', action.payload);
      break;

    case 'SET_FIXED_CONFIG':
      await supabase.from('fixed_project_configs')
        .upsert(fixedConfigToRow(action.payload), { onConflict: 'project_id' });
      break;

    case 'UPSERT_TM_ENTRY':
      await supabase.from('tm_entries')
        .upsert(tmEntryToRow(action.payload), { onConflict: 'project_id,employee_id,month' });
      break;

    case 'DELETE_TM_ENTRY': {
      const { projectId, employeeId, month } = action.payload;
      await supabase.from('tm_entries').delete()
        .eq('project_id', projectId)
        .eq('employee_id', employeeId)
        .eq('month', month);
      break;
    }

    case 'SET_ALL':
      // Internal action — no Supabase call needed
      break;
  }
}
