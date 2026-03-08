'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Agent, DashboardStats } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    tasks: { todo: 0, inprogress: 0, review: 0, done: 0, total: 0 },
    agents: { total: 0, active: 0 },
  })
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: tasks }, { data: agentsData }] = await Promise.all([
        supabase.from('tasks').select('status'),
        supabase.from('agents').select('*'),
      ])
      const t = tasks || []
      setStats({
        tasks: {
          todo:        t.filter(x => x.status === 'todo').length,
          inprogress:  t.filter(x => x.status === 'inprogress').length,
          review:      t.filter(x => x.status === 'review').length,
          done:        t.filter(x => x.status === 'done').length,
          total:       t.length,
        },
        agents: {
          total:  (agentsData || []).length,
          active: (agentsData || []).filter(a => a.status === 'active').length,
        }
      })
      setAgents(agentsData || [])
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: '任務總數',  value: stats.tasks.total,       icon: '🗂', color: 'text-indigo-600' },
    { label: '進行中',    value: stats.tasks.inprogress,  icon: '⚡', color: 'text-yellow-600' },
    { label: '已完成',    value: stats.tasks.done,        icon: '✅', color: 'text-green-600' },
    { label: 'AI 員工',   value: `${stats.agents.active}/${stats.agents.total}`, icon: '🤖', color: 'text-purple-600' },
  ]

  const donePct = stats.tasks.total
    ? Math.round((stats.tasks.done / stats.tasks.total) * 100)
    : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Sunright AI 員工管理控制中心</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-3xl font-bold ${s.color}`}>
                {loading ? '—' : s.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">任務完成率</span>
            <span className="text-sm font-bold text-gray-900">{donePct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${donePct}%` }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span>待辦 {stats.tasks.todo}</span>
            <span>進行中 {stats.tasks.inprogress}</span>
            <span>Review {stats.tasks.review}</span>
            <span>完成 {stats.tasks.done}</span>
          </div>
        </CardContent>
      </Card>

      {/* Agents */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">🤖 AI 員工</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading
            ? [1,2,3].map(i => <Card key={i}><CardContent className="pt-5 h-20 bg-gray-50 animate-pulse rounded-xl" /></Card>)
            : agents.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-5 flex items-center gap-4">
                  <span className="text-3xl">{a.emoji}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{a.name}</div>
                    <div className="text-sm text-gray-500">{a.role}</div>
                    <Badge variant="outline" className="mt-1.5 text-green-600 border-green-200 bg-green-50 text-xs">
                      ● 運作中
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}
