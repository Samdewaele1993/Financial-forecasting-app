import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Supabase row types (snake_case) ──────────────────────────────────
export interface EmployeeRow {
  id: string;
  name: string;
  title: string;
  monthly_cost: number;
  capacity_hours_per_month: number;
}

export interface ProjectRow {
  id: string;
  name: string;
  type: 'fixed' | 'tm';
  client_name: string | null;
  status: 'gepland' | 'actief' | 'afgerond';
}

export interface FixedConfigRow {
  project_id: string;
  price: number;
  start_month: string;
  duration_months: number;
  assigned_employee_ids: string[];
  estimated_hours: number | null;
}

export interface TMEntryRow {
  project_id: string;
  employee_id: string;
  month: string;
  hours: number;
  hourly_rate: number;
}
