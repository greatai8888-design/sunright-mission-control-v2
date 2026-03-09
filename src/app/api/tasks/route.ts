import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side only — uses service_role key, never exposed to browser
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await admin
    .from('tasks')
    .select('*')
    .order('position')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Known task columns — strip unknown fields gracefully (e.g. when schema migration is pending)
// Valid status values include 'archived'
const TASK_BASE_COLS = ['title', 'description', 'status', 'priority', 'assignee', 'tag',
                        'position', 'project_id', 'created_at', 'updated_at']
const TASK_EXTRA_COLS = ['assignees', 'deadline']

function safeTaskBody(body: Record<string, unknown>, includeExtras = true) {
  const allowed = includeExtras ? [...TASK_BASE_COLS, ...TASK_EXTRA_COLS] : TASK_BASE_COLS
  return Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Try with all columns first; fallback to base cols if schema not yet migrated
  let { data, error } = await admin.from('tasks').insert(safeTaskBody(body)).select().single()
  if (error?.code === 'PGRST204') {
    ;({ data, error } = await admin.from('tasks').insert(safeTaskBody(body, false)).select().single())
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const patchBody = { ...safeTaskBody(updates), updated_at: new Date().toISOString() }
  let { data, error } = await admin.from('tasks').update(patchBody).eq('id', id).select().single()
  if (error?.code === 'PGRST204') {
    const fallback = { ...safeTaskBody(updates, false), updated_at: new Date().toISOString() }
    ;({ data, error } = await admin.from('tasks').update(fallback).eq('id', id).select().single())
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await admin.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
