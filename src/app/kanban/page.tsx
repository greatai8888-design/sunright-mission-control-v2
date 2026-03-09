'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, TaskStatus, Agent } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const COLUMNS: { id: TaskStatus; label: string; color: string; emoji: string }[] = [
  { id: 'backlog',    label: 'Backlog',   color: 'border-t-gray-300',   emoji: '📋' },
  { id: 'todo',       label: 'To Do',     color: 'border-t-slate-400',  emoji: '📌' },
  { id: 'pending',    label: 'Pending',   color: 'border-t-orange-400', emoji: '⏳' },
  { id: 'inprogress', label: 'Ongoing',   color: 'border-t-blue-500',   emoji: '⚡' },
  { id: 'review',     label: 'Review',    color: 'border-t-yellow-500', emoji: '🔍' },
  { id: 'done',       label: 'Done',      color: 'border-t-green-500',  emoji: '✅' },
]

const TAGS = ['dev', 'marketing', 'trading', 'rnd', 'qa', 'service', 'hr', 'design']

const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-red-50 text-red-600 border-red-200',
  medium: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  low:    'bg-green-50 text-green-600 border-green-200',
}

const EMPTY_FORM = {
  title: '', description: '', tag: 'dev', priority: 'medium',
  assignees: [] as string[], status: 'todo' as TaskStatus, deadline: '',
}

type FormState = typeof EMPTY_FORM

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [expandedDesc, setExpandedDesc] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [tasksRes, agentsRes] = await Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      supabase.from('agents').select('*').order('created_at').then(r => r.data),
    ])
    setTasks(Array.isArray(tasksRes) ? tasksRes : [])
    setAgents(agentsRes || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openNew(status: TaskStatus = 'todo') {
    setEditing(null)
    setForm({ ...EMPTY_FORM, status })
    setExpandedDesc(false)
    setOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setForm({
      title: task.title,
      description: task.description || '',
      tag: task.tag || 'dev',
      priority: task.priority || 'medium',
      assignees: task.assignees || (task.assignee ? [task.assignee] : []),
      status: task.status,
      deadline: task.deadline ? task.deadline.slice(0, 10) : '',
    })
    setExpandedDesc(!!task.description)
    setOpen(true)
  }

  async function save() {
    if (!form.title.trim()) return
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      tag: form.tag,
      priority: form.priority,
      assignee: form.assignees[0] || null,
      assignees: form.assignees.length ? form.assignees : null,
      status: form.status,
      deadline: form.deadline || null,
    }
    if (editing) {
      await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...payload }) })
    } else {
      await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setOpen(false)
    load()
  }

  async function moveTask(id: string, status: TaskStatus) {
    await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    load()
  }

  async function deleteTask(id: string) {
    if (!confirm('刪除此任務？')) return
    await fetch('/api/tasks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  function toggleAssignee(name: string) {
    setForm(f => ({
      ...f,
      assignees: f.assignees.includes(name)
        ? f.assignees.filter(a => a !== name)
        : [...f.assignees, name],
    }))
  }

  const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
    backlog: 'todo', todo: 'pending', pending: 'inprogress', inprogress: 'review', review: 'done', done: 'backlog'
  }
  const NEXT_LABEL: Record<TaskStatus, string> = {
    backlog: '→ To Do', todo: '→ Pending', pending: '→ Ongoing', inprogress: '→ Review', review: '→ Done', done: '↺ Backlog'
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🗂 Kanban</h1>
          <p className="text-sm text-gray-500 mt-0.5">6 欄看板 · 12 Agents · Supabase</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openNew()}>+ 新增任務</Button>
          <Button variant="outline" onClick={load}>↻</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">載入中...</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minWidth: 0 }}>
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id)
            return (
              <div key={col.id} className={`flex-shrink-0 w-60 bg-gray-50 rounded-xl border-t-2 ${col.color} p-3`}>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-sm">{col.emoji}</span>
                  <span className="font-semibold text-gray-700 text-sm">{col.label}</span>
                  <span className="ml-auto text-xs bg-white border rounded-full px-2 py-0.5 text-gray-400">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map(t => {
                    const taskAssignees: string[] = t.assignees || (t.assignee ? [t.assignee] : [])
                    return (
                      <div key={t.id} className="bg-white rounded-lg border border-gray-100 p-2.5 shadow-sm group cursor-pointer"
                        onClick={() => openEdit(t)}>
                        <div className="text-sm font-medium text-gray-900 mb-1.5">{t.title}</div>
                        {t.description && !t.description && <p className="text-xs text-gray-400 mb-1.5 line-clamp-2">{t.description}</p>}
                        <div className="flex items-center gap-1 flex-wrap">
                          {t.priority && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full border ${PRIORITY_BADGE[t.priority]}`}>
                              {t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低'}
                            </span>
                          )}
                          {t.tag && <Badge variant="secondary" className="text-xs px-1.5">{t.tag}</Badge>}
                        </div>
                        {taskAssignees.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {taskAssignees.slice(0, 3).map(a => {
                              const ag = agents.find(x => x.name === a)
                              return <span key={a} className="text-xs bg-gray-100 rounded px-1">{ag?.emoji || '👤'} {a}</span>
                            })}
                            {taskAssignees.length > 3 && <span className="text-xs text-gray-400">+{taskAssignees.length - 3}</span>}
                          </div>
                        )}
                        {t.deadline && (
                          <div className="text-xs text-gray-400 mt-1">📅 {new Date(t.deadline).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}</div>
                        )}
                        <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); moveTask(t.id, NEXT_STATUS[t.status]) }}
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >{NEXT_LABEL[t.status]}</button>
                          <button
                            onClick={e => { e.stopPropagation(); deleteTask(t.id) }}
                            className="text-xs text-gray-300 hover:text-red-500"
                          >✕</button>
                        </div>
                      </div>
                    )
                  })}
                  <button
                    onClick={() => openNew(col.id)}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 rounded-lg border border-dashed border-gray-200 hover:border-gray-300 transition-colors"
                  >+ 新增</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Task Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? '編輯任務' : '新增任務'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Title */}
            <div>
              <Label>標題 *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="任務名稱" />
            </div>

            {/* Description expandable */}
            <div>
              <button className="text-xs text-blue-500 mb-1" onClick={() => setExpandedDesc(x => !x)}>
                {expandedDesc ? '▲ 收起描述' : '▼ 展開描述'}
              </button>
              {expandedDesc && (
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="詳細說明、SOP..." rows={4} />
              )}
            </div>

            {/* Tag + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tag</Label>
                <Select value={form.tag || 'dev'} onValueChange={v => setForm(f => ({ ...f, tag: v || 'dev' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TAGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>優先度</Label>
                <Select value={form.priority || 'medium'} onValueChange={v => setForm(f => ({ ...f, priority: v || 'medium' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 高</SelectItem>
                    <SelectItem value="medium">🟡 中</SelectItem>
                    <SelectItem value="low">🟢 低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status + Deadline */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>欄位</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: (v || 'todo') as TaskStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>

            {/* Assignees — 12 agent chips */}
            <div>
              <Label>指派人（多選）</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
                {agents.map(a => {
                  const selected = form.assignees.includes(a.name)
                  return (
                    <button key={a.id} onClick={() => toggleAssignee(a.name)}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        selected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}>
                      {a.emoji} {a.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {editing && (
                <Button variant="destructive" className="flex-shrink-0" onClick={async () => { await deleteTask(editing.id); setOpen(false) }}>刪除</Button>
              )}
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>取消</Button>
              <Button className="flex-1" onClick={save}>{editing ? '儲存' : '新增'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
