-- Migration 002: Add assignees and deadline columns to tasks table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/jmjfwvjfzwscrkxualgo/sql/new

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assignees text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deadline  date;

-- Comment for documentation
COMMENT ON COLUMN public.tasks.assignees IS 'Array of agent names assigned to this task';
COMMENT ON COLUMN public.tasks.deadline IS 'Optional task deadline date';
