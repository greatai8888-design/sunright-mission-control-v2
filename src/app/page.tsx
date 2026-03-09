'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Agent, DashboardStats } from '@/types'
import { AgentTaskDrawer } from '@/components/AgentTaskDrawer'

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active:  { label: '運作中', color: 'text-green-600 border-green-200 bg-green-50',   dot: 'bg-green-500' },
  idle:    { label: '待命',   color: 'text-gray-500 border-gray-200 bg-gray-50',      dot: 'bg-gray-400' },
  working: { label: '執行中', color: 'text-blue-600 border-blue-200 bg-blue-50',      dot: 'bg-blue-500 animate-pulse' },
  offline: { label: '離線',   color: 'text-red-400 border-red-200 bg-red-50',         dot: 'bg-red-400' },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    tasks: { backlog: 0, todo: 0, pending: 0, inprogress: 0, review: 0, done: 0, total: 0 },
    agents: { total: 0, active: 0 },
  })
  const [agents,      setAgents]      = useState<Agent[]>([])
  const [loading,     setLoading]     = useState(true)
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null)

  const load = useCallback(async () => {
    const [{ data: tasks }, { data: agentsData }] = await Promise.all([
      supabase.from('tasks').select('status'),
      supabase.from('agents').select('*').order('created_at'),
    ])
    const t = tasks || []
    setStats({
      tasks: {
        backlog:    t.filter(x => x.status === 'backlog').length,
        todo:       t.filter(x => x.status === 'todo').length,
        pending:    t.filter(x => x.status === 'pending').length,
        inprogress: t.filter(x => x.status === 'inprogress').length,
        review:     t.filter(x => x.status === 'review').length,
        done:       t.filter(x => x.status === 'done').length,
        total:      t.length,
      },
      agents: {
        total:  (agentsData || []).length,
        active: (agentsData || []).filter(a => a.status !== 'offline').length,
      }
    })
    setAgents(agentsData || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    if (typeof window === 'undefined') return
    const channel = supabase
      .channel('agents-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agents' }, () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const statCards = [
    { label: '任務總數',  value: stats.tasks.total,      icon: '🗂', color: 'text-indigo-600' },
    { label: '進行中',    value: stats.tasks.inprogress, icon: '⚡', color: 'text-yellow-600' },
    { label: '已完成',    value: stats.tasks.done,       icon: '✅', color: 'text-green-600' },
    { label: 'AI 員工',   value: `${stats.agents.active}/${stats.agents.total}`, icon: '🤖', color: 'text-purple-600' },
  ]

  const donePct = stats.tasks.total
    ? Math.round((stats.tasks.done / stats.tasks.total) * 100)
    : 0

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">📊 Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Sunright AI 員工管理控制中心 · Realtime</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="text-2xl mb-1" style={{ fontFamily: 'initial' }}>{s.icon}</div>
              <div className={`text-3xl font-bold ${s.color}`}>
                {loading ? '—' : s.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress + breakdown */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">任務完成率</span>
            <span className="text-sm font-bold text-gray-900">{donePct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${donePct}%` }} />
          </div>
          <div className="flex gap-3 mt-2 text-xs text-gray-400 flex-wrap">
            <span>📋 Backlog {stats.tasks.backlog}</span>
            <span>📌 To Do {stats.tasks.todo}</span>
            <span>⏳ Pending {stats.tasks.pending}</span>
            <span>⚡ 進行中 {stats.tasks.inprogress}</span>
            <span>🔍 Review {stats.tasks.review}</span>
            <span>✅ 完成 {stats.tasks.done}</span>
          </div>
        </CardContent>
      </Card>

      {/* 12 Agents Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-gray-900">🤖 AI 員工</h2>
          <Badge variant="secondary" className="text-xs">Realtime</Badge>
          <span className="text-xs text-gray-400 ml-auto">{stats.agents.active} / {stats.agents.total} 上線</span>
        </div>
        <p className="text-xs text-gray-400 mb-3">點擊任意 Agent 查看其任務</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <Card key={i}><CardContent className="pt-4 pb-4 h-20 bg-gray-50 animate-pulse rounded-xl" /></Card>
              ))
            : agents.map((a) => {
                const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.idle
                return (
                  <Card
                    key={a.id}
                    className="hover:shadow-md transition-all cursor-pointer active:scale-[0.98] hover:border-gray-200"
                    onClick={() => setActiveAgent(a)}
                  >
                    <CardContent className="pt-4 pb-4 flex items-start gap-3">
                      {/* Emoji — reset font to avoid gray-box rendering */}
                      <span
                        className="text-2xl flex-shrink-0 leading-none mt-0.5"
                        style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}
                      >
                        {a.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 text-sm">{a.name}</div>
                        {/* role — allow 2 lines instead of truncate */}
                        <div className="text-xs text-gray-400 leading-tight mt-0.5 line-clamp-2">{a.role}</div>
                        <div className={`inline-flex items-center gap-1 mt-1.5 text-xs px-1.5 py-0.5 rounded-full border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                          {cfg.label}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
        </div>
      </div>

      {/* Agent Task Drawer */}
      <AgentTaskDrawer
        agent={activeAgent}
        onClose={() => setActiveAgent(null)}
      />
    </div>
  )
}
