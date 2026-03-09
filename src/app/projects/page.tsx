'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  done:   'bg-gray-50 text-gray-500 border-gray-200',
}
const STATUS_ZH: Record<string, string> = { active: '進行中', paused: '暫停', done: '完成' }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', emoji: '🚀', owner: '', status: 'active' })

  async function load() {
    setLoading(true)
    const res = await fetch('/api/projects').then(r => r.json())
    setProjects(Array.isArray(res) ? res : [])
    setLoading(false)
  }

  async function add() {
    if (!form.name.trim()) return
    await fetch('/api/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null, emoji: form.emoji || '🚀', owner: form.owner.trim() || null, status: form.status }),
    })
    setOpen(false)
    setForm({ name: '', description: '', emoji: '🚀', owner: '', status: 'active' })
    load()
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/projects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    load()
  }

  useEffect(() => { load() }, [])

  const byStatus = (s: string) => projects.filter(p => p.status === s)

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">🗂 Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">項目管理 · Supabase</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ 新增項目</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🗂</div>
          <div>尚無項目，點「+ 新增項目」開始</div>
        </div>
      ) : (
        ['active', 'paused', 'done'].map(status => {
          const group = byStatus(status)
          if (!group.length) return null
          return (
            <div key={status}>
              <p className="text-sm font-semibold text-gray-500 mb-2">{STATUS_ZH[status]} ({group.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.map(p => (
                  <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm group">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{p.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{p.name}</span>
                          <Badge variant="outline" className={`text-xs border ${STATUS_COLOR[p.status]}`}>
                            {STATUS_ZH[p.status]}
                          </Badge>
                        </div>
                        {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                        {p.owner && <p className="text-xs text-gray-400 mt-1">👤 {p.owner}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {status !== 'active' && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(p.id, 'active')}>啟動</Button>}
                      {status !== 'paused' && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(p.id, 'paused')}>暫停</Button>}
                      {status !== 'done'   && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(p.id, 'done')}>完成</Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增項目</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="w-20">
                <Label>Emoji</Label>
                <Input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} />
              </div>
              <div className="flex-1">
                <Label>項目名稱 *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="項目名稱" />
              </div>
            </div>
            <div>
              <Label>描述</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="選填" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>負責人</Label>
                <Input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="Volt / Soma" />
              </div>
              <div>
                <Label>狀態</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v || 'active' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">進行中</SelectItem>
                    <SelectItem value="paused">暫停</SelectItem>
                    <SelectItem value="done">完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>取消</Button>
              <Button className="flex-1" onClick={add}>新增</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
