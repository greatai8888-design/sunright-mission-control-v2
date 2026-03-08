'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { KnowledgeEntry } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CAT_COLOR: Record<string, string> = {
  monitoring: 'bg-purple-50 text-purple-700 border-purple-200',
  dev:        'bg-blue-50 text-blue-700 border-blue-200',
  marketing:  'bg-green-50 text-green-700 border-green-200',
  ops:        'bg-yellow-50 text-yellow-700 border-yellow-200',
  finance:    'bg-red-50 text-red-700 border-red-200',
  general:    'bg-gray-50 text-gray-600 border-gray-200',
}

const CATEGORIES = ['general', 'ops', 'dev', 'monitoring', 'marketing', 'finance']

export default function BrainPage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: 'general', tags: '' })

  const load = useCallback(async (q = '') => {
    setLoading(true)
    let qb = supabase.from('knowledge_entries').select('*').order('created_at', { ascending: false })
    if (q.trim()) {
      qb = qb.or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    }
    const { data } = await qb.limit(50)
    setEntries(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(query), 300)
    return () => clearTimeout(t)
  }, [query, load])

  async function addEntry() {
    if (!form.title.trim()) return
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    await supabase.from('knowledge_entries').insert({
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      tags,
      source: 'manual',
    })
    setOpen(false)
    setForm({ title: '', content: '', category: 'general', tags: '' })
    load(query)
  }

  async function deleteEntry(id: string) {
    if (!confirm('刪除此條目？')) return
    await supabase.from('knowledge_entries').delete().eq('id', id)
    load(query)
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧠 Second Brain</h1>
          <p className="text-sm text-gray-500 mt-0.5">知識庫 · Supabase PostgreSQL + 全文搜尋</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ 新增知識</Button>
      </div>

      {/* Search */}
      <Input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="🔍 搜尋知識庫（標題、內容）..."
        className="max-w-xl"
      />

      {/* Count */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">知識條目</span>
        <Badge variant="secondary">{entries.length}</Badge>
        {query && <span className="text-xs text-gray-400">搜尋：「{query}」</span>}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🧠</div>
          <div>{query ? '找不到相關條目' : '暫無知識條目，點「+ 新增知識」開始建立'}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(e => (
            <div key={e.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">{e.title}</div>
                  <div className="text-sm text-gray-600 leading-relaxed">{e.content}</div>
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${CAT_COLOR[e.category] || CAT_COLOR.general}`}>
                      {e.category}
                    </span>
                    {(e.tags || []).map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500">
                        #{t}
                      </span>
                    ))}
                    <span className="text-xs text-gray-300 ml-auto">{fmtDate(e.created_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteEntry(e.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none flex-shrink-0"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>新增知識條目</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>標題 *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="知識標題" />
            </div>
            <div>
              <Label>內容（SOP、筆記、規則...）</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="詳細說明..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>分類</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v || 'general' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>標籤（逗號分隔）</Label>
                <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="sop, monitoring" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>取消</Button>
              <Button className="flex-1" onClick={addEntry}>新增</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
