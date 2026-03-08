'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CronJob } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_ZH = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

const CAT_COLOR: Record<string, string> = {
  monitoring: 'bg-purple-100 text-purple-700 border-purple-200',
  reporting:  'bg-blue-100 text-blue-700 border-blue-200',
  system:     'bg-red-100 text-red-700 border-red-200',
  social:     'bg-yellow-100 text-yellow-700 border-yellow-200',
  dev:        'bg-green-100 text-green-700 border-green-200',
}

function weekDates(offset: number): Date[] {
  const now = new Date()
  const dow = now.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const mon = new Date(now)
  mon.setDate(now.getDate() + diff + offset * 7)
  mon.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

function isToday(d: Date): boolean {
  const n = new Date()
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

function dayIdx(day: string): number {
  return { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[day] ?? -1
}

function jobsForCell(jobs: CronJob[], hour: number, colIdx: number): CronJob[] {
  return jobs.filter(j => {
    if (!j.enabled) return false
    const s = j.schedule_type
    if (s === 'daily')    return j.schedule_hour === hour
    if (s === 'weekly')   return dayIdx(j.schedule_day || '') === colIdx && j.schedule_hour === hour
    if (s === 'interval') return hour >= (j.start_hour ?? 0) && hour <= (j.end_hour ?? 23)
    if (s === 'frequent') return true
    return false
  })
}

export default function CalendarPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOff, setWeekOff] = useState(0)
  const [hideHF, setHideHF] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('cron_jobs').select('*').order('schedule_hour')
      setJobs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const days = weekDates(weekOff)
  const fmt = (d: Date) => d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
  const visibleJobs = hideHF ? jobs.filter(j => !j.high_freq) : jobs
  const highFreqJobs = jobs.filter(j => j.high_freq && j.enabled)

  // Show hours 0-23, highlight hours with jobs
  const activeHours = new Set<number>()
  visibleJobs.forEach(j => {
    if (j.schedule_hour !== null && j.schedule_hour !== undefined) activeHours.add(j.schedule_hour)
    if (j.schedule_type === 'interval') {
      for (let h = (j.start_hour ?? 0); h <= (j.end_hour ?? 23); h++) activeHours.add(h)
    }
  })

  if (loading) return <div className="p-6 text-center text-gray-400 py-20">載入中...</div>

  if (!jobs.length) return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📅 Calendar</h1>
      <Card>
        <CardContent className="pt-10 pb-10 text-center">
          <div className="text-4xl mb-3">🗓️</div>
          <div className="font-medium text-gray-700">尚無 Cron Jobs</div>
          <p className="text-sm text-gray-400 mt-1">從 Supabase 新增 cron_jobs 資料後顯示於此</p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📅 Calendar</h1>
          <p className="text-sm text-gray-500">{fmt(days[0])} – {fmt(days[6])} {days[6].getFullYear()}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex gap-1">
            {Object.entries(CAT_COLOR).map(([cat, cls]) => (
              <span key={cat} className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{cat}</span>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setHideHF(h => !h)}>
            {hideHF ? '顯示高頻' : '隱藏高頻'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOff(w => w - 1)}>← 上週</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOff(0)}>今天</Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOff(w => w + 1)}>下週 →</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <div className="grid min-w-[780px]" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
          {/* Header */}
          <div className="text-xs text-gray-400 font-medium px-2 py-2 border-b border-gray-100">TIME</div>
          {days.map((d, i) => (
            <div key={i} className={`text-center py-2 border-b border-gray-100 border-l text-xs font-medium ${isToday(d) ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>
              <div className={`text-lg font-bold ${isToday(d) ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto' : ''}`}>
                {d.getDate()}
              </div>
              <div>{DAY_ZH[i]}</div>
            </div>
          ))}

          {/* High freq row */}
          {!hideHF && highFreqJobs.length > 0 && (
            <>
              <div className="text-xs text-gray-300 px-2 py-1 border-b border-gray-50 flex items-center">∞</div>
              {days.map((_, ci) => (
                <div key={ci} className={`border-l border-b border-gray-50 p-1 ${isToday(days[ci]) ? 'bg-blue-50/30' : ''}`}>
                  {highFreqJobs.map(j => (
                    <div key={j.id} className={`text-xs px-1.5 py-0.5 rounded border mb-0.5 truncate ${CAT_COLOR[j.category] || 'bg-gray-100 text-gray-600'}`}>
                      {j.emoji} {j.name}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* Hour rows — only active hours */}
          {Array.from({ length: 24 }, (_, h) => {
            const hasJobs = Array.from({ length: 7 }, (_, ci) => jobsForCell(visibleJobs, h, ci).length > 0).some(Boolean)
            if (!hasJobs) return null
            return (
              <>
                <div key={`t-${h}`} className="text-xs text-gray-400 px-2 py-1 border-b border-gray-50 font-mono">
                  {String(h).padStart(2, '0')}:00
                </div>
                {days.map((_, ci) => {
                  const cellJobs = jobsForCell(visibleJobs, h, ci)
                  return (
                    <div key={`c-${h}-${ci}`} className={`border-l border-b border-gray-50 p-1 min-h-[32px] ${isToday(days[ci]) ? 'bg-blue-50/30' : ''}`}>
                      {cellJobs.map(j => (
                        <div key={j.id} className={`text-xs px-1.5 py-0.5 rounded border mb-0.5 truncate ${CAT_COLOR[j.category] || 'bg-gray-100 text-gray-600'}`}
                          title={j.description || j.name}>
                          {j.emoji} {j.name}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">只顯示有排程的時段 · 共 {jobs.length} 個 jobs</p>
    </div>
  )
}
