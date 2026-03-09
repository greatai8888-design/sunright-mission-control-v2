-- Mission Control V2 — RLS Security Fix
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jmjfwvjfzwscrkxualgo/sql/new

-- Enable RLS on all tables (idempotent)
ALTER TABLE agents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_jobs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_snapshots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_status     ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive existing policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- READ: allow anon (frontend dashboard display)
CREATE POLICY "anon_read_agents"               ON agents               FOR SELECT USING (true);
CREATE POLICY "anon_read_tasks"                ON tasks                FOR SELECT USING (true);
CREATE POLICY "anon_read_cron_jobs"            ON cron_jobs            FOR SELECT USING (true);
CREATE POLICY "anon_read_knowledge"            ON knowledge_entries    FOR SELECT USING (true);
CREATE POLICY "anon_read_reviews"              ON reviews              FOR SELECT USING (true);
CREATE POLICY "anon_read_market"               ON market_snapshots     FOR SELECT USING (true);
CREATE POLICY "anon_read_competitor_snapshots" ON competitor_snapshots FOR SELECT USING (true);
CREATE POLICY "anon_read_competitors"          ON competitors          FOR SELECT USING (true);
CREATE POLICY "anon_read_projects"             ON projects             FOR SELECT USING (true);
CREATE POLICY "anon_read_monitoring"           ON monitoring_status    FOR SELECT USING (true);

-- WRITE: service_role only
-- Frontend uses /api/* routes (server-side, service_role key) — anon key cannot write
CREATE POLICY "service_write_agents"               ON agents               FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_agents"              ON agents               FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_agents"              ON agents               FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "service_write_tasks"                ON tasks                FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_tasks"               ON tasks                FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_tasks"               ON tasks                FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "service_write_cron_jobs"            ON cron_jobs            FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_cron_jobs"           ON cron_jobs            FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_cron_jobs"           ON cron_jobs            FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "service_write_knowledge"            ON knowledge_entries    FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_knowledge"           ON knowledge_entries    FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_knowledge"           ON knowledge_entries    FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "service_write_reviews"              ON reviews              FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_reviews"             ON reviews              FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_reviews"             ON reviews              FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "service_write_market"               ON market_snapshots     FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_market"              ON market_snapshots     FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_market"              ON market_snapshots     FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "service_write_competitor_snapshots" ON competitor_snapshots FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_competitor_snapshots"ON competitor_snapshots FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_competitor_snapshots"ON competitor_snapshots FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "service_write_competitors"          ON competitors          FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_competitors"         ON competitors          FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_competitors"         ON competitors          FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "service_write_projects"             ON projects             FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_projects"            ON projects             FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_projects"            ON projects             FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "service_write_monitoring"           ON monitoring_status    FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_monitoring"          ON monitoring_status    FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_monitoring"          ON monitoring_status    FOR DELETE USING (auth.role() = 'service_role');
