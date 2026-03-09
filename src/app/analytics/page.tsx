'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface CompetitorLatest {
  id: string
  competitor_id: string
  handle: string
  name: string
  notes: string
  platform: string
  followers: number
  avg_likes: number
  avg_comments: number
  posts_per_week: number
  engagement_rate: number
  last_post_date: string
  scraped_at: string
}

function engColor(rate: number) {
  if (rate >= 3.5) return 'text-green-600'
  if (rate >= 2.5) return 'text-yellow-600'
  return 'text-red-500'
}

function fmtNum(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n ?? '—')
}

export default function AnalyticsPage() {
  const [data, setData] = useState<CompetitorLatest[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data: rows } = await supabase
      .from('competitor_latest')
      .select('*')
      .order('followers', { ascending: false })
    setData(rows || [])
    if (rows?.length) setLastUpdate(rows[0].scraped_at)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const maxFollowers = data[0]?.followers || 1
  const avgEng = data.length
    ? (data.reduce((s, c) => s + (c.engagement_rate || 0), 0) / data.length).toFixed(1)
    : '—'

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">📈 Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">IG 競品追蹤 · Supabase</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && <span className="text-xs text-gray-400">更新：{new Date(lastUpdate).toLocaleDateString('zh-TW')}</span>}
          <Button variant="outline" onClick={load}>↻</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: '追蹤競品', value: data.length, color: 'text-blue-600' },
          { label: '平均互動率', value: avgEng + '%', color: 'text-green-600' },
          { label: '最多粉絲', value: data[0]?.handle || '—', color: 'text-purple-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{loading ? '—' : s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Competitor List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📊</div>
          <div className="font-medium">尚無競品數據</div>
          <p className="text-sm mt-1">IG Scraper 執行後自動 push 至 Supabase</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((c, idx) => {
            const pct = Math.round((c.followers / maxFollowers) * 100)
            return (
              <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <div className="text-sm font-semibold text-blue-600">{c.handle}</div>
                    <div className="text-xs text-gray-500">{c.name} · <span className="text-gray-400">{c.notes}</span></div>
                  </div>
                  <div className="flex gap-5 flex-wrap">
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900">{fmtNum(c.followers)}</div>
                      <div className="text-xs text-gray-400">粉絲</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900">{fmtNum(c.avg_likes)}</div>
                      <div className="text-xs text-gray-400">均讚</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-base font-bold ${engColor(c.engagement_rate)}`}>{c.engagement_rate ?? '—'}%</div>
                      <div className="text-xs text-gray-400">互動率</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900">{c.posts_per_week ?? '—'}</div>
                      <div className="text-xs text-gray-400">貼/週</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
