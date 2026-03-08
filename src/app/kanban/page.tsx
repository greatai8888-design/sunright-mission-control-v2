'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, TaskStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo',       label: 'To Do',     color: 'border-t-gray-400' },
  { id: 'inprogress', label: '進行中',    color: 'border-t-blue-500' },
  { id: 'review',     label: '🔍 Review', color: 'border-t-yellow-500' },
  { id: 'done',       label: '✅ 完成',   color: 'border-t-green-500' },
]

const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-red-50 text-red-600 border-red-200',
  medium: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  low:    'bg-green-50 text-green-600 border-green-200',
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ title: string; description: string; tag: string; priority: string; assignee: string }>({ title: '', description: '', tag: 'dev', priority: 'medium', assignee: '' })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  async function addTask() {
    if (!form.title.trim()) return
    await supabase.from('tasks').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      tag: form.tag,
      priority: form.priority,
      assignee: form.assignee.trim() || null,
      status: 'todo',
    })
    setOpen(false)
    setForm({ title: '', description: '', tag: 'dev', priority: 'medium', assignee: '' })
    load()
  }

  async function moveTask(id: string, status: TaskStatus) {
    await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  async function deleteTask(id: string) {
    if (!confirm('刪除此任務？')) return
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  useEffect(() => { load() }, [])

  const NEXT: Record<TaskStatus, TaskStatus> = { todo: 'inprogress', inprogress: 'review', review: 'done', done: 'todo' }
  const NEXT_LABEL: Record<TaskStatus, string> = { todo: '→ 進行中', inprogress: '→ Review', review: '→ 完成', done: '↺ 重開' }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🗂 Kanban</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI 員工任務看板 · Supabase</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setOpen(true)}>+ 新增任務</Button>
          <Button variant="outline" onClick={load}>↻</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">載入中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id)
            return (
              <div key={col.id} className={`bg-gray-50 rounded-xl border-t-2 ${col.color} p-4 min-h-64`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-semibold text-gray-700 text-sm">{col.label}</span>
                  <span className="ml-auto text-xs bg-white border rounded-full px-2 py-0.5 text-gray-500">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map(t => (
                    <div key={t.id} className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm group">
                      <div className="text-sm font-medium text-gray-900 mb-2">{t.title}</div>
                      {t.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{t.description}</p>}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.priority && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_BADGE[t.priority]}`}>
                            {t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低'}
                          </span>
                        )}
                        {t.tag && <Badge variant="secondary" className="text-xs">{t.tag}</Badge>}
                        {t.assignee && <span className="text-xs text-gray-400">👤 {t.assignee}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveTask(t.id, NEXT[t.status])}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          {NEXT_LABEL[t.status]}
                        </button>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="text-xs text-gray-300 hover:text-red-500"
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增任務</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>標題 *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="任務名稱" onKeyDown={e => e.key === 'Enter' && addTask()} />
            </div>
            <div>
              <Label>描述</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="選填" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>標籤</Label>
                <Select value={form.tag || 'dev'} onValueChange={(v) => setForm(f => ({ ...f, tag: v || 'dev' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['dev','monitoring','reports','social','analytics','ops','system'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>優先度</Label>
                <Select value={form.priority || 'medium'} onValueChange={(v) => setForm(f => ({ ...f, priority: v || 'medium' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 高</SelectItem>
                    <SelectItem value="medium">🟡 中</SelectItem>
                    <SelectItem value="low">🟢 低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>負責人</Label>
              <Input value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
                placeholder="Volt / Orion / Luma" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>取消</Button>
              <Button className="flex-1" onClick={addTask}>新增</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
