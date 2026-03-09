'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { KnowledgeEntry } from '@/types'
import { Badge } from '@/components/ui/badge'

const TABS = [
  { key: 'all',       label: '📋 全部',     filter: null },
  { key: 'ops',       label: '🏢 營運',     filter: 'ops' },
  { key: 'dev',       label: '💻 技術',     filter: 'dev' },
  { key: 'marketing', label: '📣 行銷',     filter: 'marketing' },
  { key: 'finance',   label: '💰 財務',     filter: 'finance' },
] as const

type TabKey = typeof TABS[number]['key']

const CAT_COLOR: Record<string, string> = {
  ops:        'bg-amber-50 text-amber-700 border-amber-200',
  dev:        'bg-blue-50 text-blue-700 border-blue-200',
  marketing:  'bg-green-50 text-green-700 border-green-200',
  finance:    'bg-purple-50 text-purple-700 border-purple-200',
  monitoring: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  general:    'bg-gray-50 text-gray-600 border-gray-200',
}

const CATEGORIES = ['general', 'ops', 'dev', 'marketing', 'finance', 'monitoring']

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
}

export default function BrainPage() {
  const [entries,   setEntries]   = useState<KnowledgeEntry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<TabKey>('all')
  const [query,     setQuery]     = useState('')
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [addOpen,   setAddOpen]   = useState(false)
  const [form,      setForm]      = useState({ title: '', content: '', category: 'ops', tags: '', source: '' })
  const [saving,    setSaving]    = useState(false)

  const load = useCallback(async (q = '', cat: string | null = null) => {
    setLoading(true)
    let qb = supabase.from('knowledge_entries').select('*').order('created_at', { ascending: false })
    if (cat) qb = qb.eq('category', cat)
    if (q.trim()) qb = qb.or(`title.ilike.%${q}%,content.ilike.%${q}%`)
    const { data } = await qb.limit(100)
    setEntries(data || [])
    setLoading(false)
  }, [])

  const currentFilter = TABS.find(t => t.key === tab)?.filter ?? null

  useEffect(() => { load(query, currentFilter) }, [tab])

  useEffect(() => {
    const t = setTimeout(() => load(query, currentFilter), 300)
    return () => clearTimeout(t)
  }, [query])

  async function handleAdd() {
    if (!form.title.trim()) return
    setSaving(true)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const res = await fetch('/api/brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        tags,
        source: form.source.trim() || 'manual',
      }),
    })
    setSaving(false)
    if (res.ok) {
      setAddOpen(false)
      setForm({ title: '', content: '', category: 'ops', tags: '', source: '' })
      load(query, currentFilter)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('刪除此條目？')) return
    await fetch('/api/brain', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load(query, currentFilter)
  }

  const counts = {
    all:       entries.length,
    ops:       entries.filter(e => e.category === 'ops').length,
    dev:       entries.filter(e => e.category === 'dev').length,
    marketing: entries.filter(e => e.category === 'marketing').length,
    finance:   entries.filter(e => e.category === 'finance').length,
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧠 Second Brain</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sunright AI 知識庫 · {entries.length} 條目</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="text-sm px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition"
        >
          + 新增條目
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="🔍 搜尋知識庫..."
        className="w-full max-w-md px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${
              tab === t.key
                ? 'bg-white text-gray-900 border border-b-white border-gray-100 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-gray-100 text-gray-600' : 'text-gray-400'}`}>
              {counts[t.key as keyof typeof counts] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <div className="text-4xl mb-3">🧠</div>
          <div className="font-medium text-gray-600">尚無條目</div>
          <p className="text-sm mt-1">點擊「新增條目」開始建立知識庫</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {entries.map(e => (
            <div
              key={e.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => setExpanded(expanded === e.id ? null : e.id)}
            >
              {/* Title row */}
              <div className="flex items-start gap-2 justify-between">
                <div className="font-semibold text-gray-900 text-sm leading-snug">{e.title}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${CAT_COLOR[e.category] || CAT_COLOR.general}`}>
                  {e.category}
                </span>
              </div>

              {/* Content preview / full */}
              <p className={`text-sm text-gray-500 mt-2 leading-relaxed whitespace-pre-wrap ${
                expanded === e.id ? '' : 'line-clamp-2'
              }`}>
                {e.content}
              </p>

              {/* Tags + meta */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {(e.tags || []).slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                    #{tag}
                  </span>
                ))}
                {(e.tags || []).length > 3 && (
                  <span className="text-xs text-gray-300">+{e.tags.length - 3}</span>
                )}
                <span className="text-xs text-gray-300 ml-auto">{fmtDate(e.created_at)}</span>
                <button
                  onClick={ev => { ev.stopPropagation(); handleDelete(e.id) }}
                  className="text-xs text-red-400 hover:text-red-600 ml-1"
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">新增知識條目</h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">標題 *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="條目標題"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">內容</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  rows={5}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="詳細內容..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">分類</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">來源</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    placeholder="manual / doc / orion"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">標籤（逗號分隔）</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="strategy, sop, brand"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !form.title.trim()}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {saving ? '儲存中…' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
