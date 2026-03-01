-- ============================================================
-- Row Level Security — Financial Forecast
-- Run this in the Supabase SQL editor (once).
--
-- Policy: only authenticated users can read and write data.
-- All authenticated users share the same data (single-tenant).
-- ============================================================


-- ── 1. Enable RLS on every table ────────────────────────────

ALTER TABLE employees              ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects               ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_project_configs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tm_entries             ENABLE ROW LEVEL SECURITY;


-- ── 2. Drop any existing policies (idempotent re-run) ───────

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('employees','projects','fixed_project_configs','tm_entries')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END;
$$;


-- ── 3. employees ─────────────────────────────────────────────

CREATE POLICY "employees: authenticated read"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "employees: authenticated insert"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "employees: authenticated update"
  ON employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "employees: authenticated delete"
  ON employees FOR DELETE
  TO authenticated
  USING (true);


-- ── 4. projects ───────────────────────────────────────────────

CREATE POLICY "projects: authenticated read"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "projects: authenticated insert"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "projects: authenticated update"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "projects: authenticated delete"
  ON projects FOR DELETE
  TO authenticated
  USING (true);


-- ── 5. fixed_project_configs ──────────────────────────────────

CREATE POLICY "fixed_project_configs: authenticated read"
  ON fixed_project_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "fixed_project_configs: authenticated insert"
  ON fixed_project_configs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "fixed_project_configs: authenticated update"
  ON fixed_project_configs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "fixed_project_configs: authenticated delete"
  ON fixed_project_configs FOR DELETE
  TO authenticated
  USING (true);


-- ── 6. tm_entries ─────────────────────────────────────────────

CREATE POLICY "tm_entries: authenticated read"
  ON tm_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tm_entries: authenticated insert"
  ON tm_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "tm_entries: authenticated update"
  ON tm_entries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "tm_entries: authenticated delete"
  ON tm_entries FOR DELETE
  TO authenticated
  USING (true);


-- ── 7. Verify ─────────────────────────────────────────────────
-- Run this SELECT after applying to confirm all policies exist.

SELECT
  tablename,
  policyname,
  cmd         AS operation,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('employees','projects','fixed_project_configs','tm_entries')
ORDER BY tablename, cmd;
