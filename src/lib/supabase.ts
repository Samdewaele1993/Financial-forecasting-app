import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wsjpghovrauushhixzqn.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzanBnaG92cmF1dXNoaGl4enFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNjY1NDgsImV4cCI6MjA4Nzg0MjU0OH0.1PX6uTLAYcGcKnicSA-WUhcpt4FoHzRhXgrTpJ7y0U8';

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
