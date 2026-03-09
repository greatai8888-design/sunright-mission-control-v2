'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'

// ────────────────────────────────────────────────────────
// Color palette per category
// ────────────────────────────────────────────────────────
const COLORS = {
  system:    'bg-slate-100 text-slate-700 border-slate-200',
  monitor:   'bg-blue-100 text-blue-700 border-blue-200',
  report:    'bg-green-100 text-green-700 border-green-200',
  marketing: 'bg-amber-100 text-amber-700 border-amber-200',
  trading:   'bg-purple-100 text-purple-700 border-purple-200',
  security:  'bg-red-100 text-red-700 border-red-200',
  weekly:    'bg-orange-100 text-orange-700 border-orange-200',
} as const

type Color = keyof typeof COLORS

interface JobDef {
  id: string
  name: string
  emoji: string
  color: Color
  hour: number
  minute: number
  days: number[] | 'all'   // 0=Sun 1=Mon … 6=Sat
  highFreq?: boolean
  enabled: boolean
}

// ────────────────────────────────────────────────────────
// Cron job schedule data (parsed from OpenClaw Gateway)
// Updated: 2026-03-09
// ────────────────────────────────────────────────────────
const JOBS: JobDef[] = [
  // ── 2 AM ──────────────────────────────────────────────
  { id: 'sys-review',  name: '系統回顧',       emoji: '🌙', color: 'system',    hour: 2,  minute: 0,  days: 'all',      enabled: true },
  { id: 'mc-test',     name: 'MC 用戶測試',    emoji: '🧪', color: 'system',    hour: 2,  minute: 0,  days: 'all',      enabled: true },
  // ── 6:30 AM Mon–Fri ───────────────────────────────────
  { id: 'kai-pre',     name: 'Kai 開盤情報',   emoji: '📉', color: 'trading',   hour: 6,  minute: 30, days: [1,2,3,4,5], enabled: true },
  // ── 7 AM daily ────────────────────────────────────────
  { id: 'gmaps-scan',  name: 'Google Maps 掃描', emoji: '🗺️', color: 'monitor', hour: 7,  minute: 0,  days: 'all',      enabled: true },
  // ── 7:30 AM daily ─────────────────────────────────────
  { id: 'yelp-scan',   name: 'Yelp 掃描',      emoji: '⭐', color: 'monitor',   hour: 7,  minute: 30, days: 'all',      enabled: true },
  // ── 8 AM daily ────────────────────────────────────────
  { id: 'rex-health',  name: 'Rex 健康檢查',   emoji: '🔍', color: 'system',    hour: 8,  minute: 0,  days: 'all',      enabled: true },
  { id: 'morning-rpt', name: '每日晨報',        emoji: '☀️', color: 'report',    hour: 8,  minute: 0,  days: 'all',      enabled: true },
  { id: 'notion-sync', name: 'Notion 同步',    emoji: '📋', color: 'system',    hour: 8,  minute: 0,  days: 'all',      enabled: true },
  // ── 8:30 AM daily ─────────────────────────────────────
  { id: 'surprise',    name: 'Soma 驚喜禮包',  emoji: '🎁', color: 'marketing', hour: 8,  minute: 30, days: 'all',      enabled: true },
  // ── 9 AM daily ────────────────────────────────────────
  { id: 'cleo-mon',    name: 'Cleo 評論監控',  emoji: '🛎', color: 'monitor',   hour: 9,  minute: 0,  days: 'all',      enabled: true },
  { id: 'mc-sync',     name: 'MC 資料同步',    emoji: '📤', color: 'system',    hour: 9,  minute: 0,  days: 'all',      enabled: true },
  // ── 9 AM Mon ──────────────────────────────────────────
  { id: 'yelp-weekly', name: 'Yelp 週報',      emoji: '📊', color: 'report',    hour: 9,  minute: 0,  days: [1],        enabled: true },
  { id: 'sample-rpt',  name: 'Sample Check 週報', emoji: '📋', color: 'report', hour: 9,  minute: 0, days: [1],        enabled: true },
  { id: 'ig-scraper',  name: 'IG 競品爬蟲',   emoji: '📱', color: 'marketing', hour: 9,  minute: 0,  days: [1],        enabled: true },
  // ── 9:30 AM Mon ───────────────────────────────────────
  { id: 'gmaps-rpt',   name: 'Google Maps 週報', emoji: '🗺️', color: 'report', hour: 9,  minute: 30, days: [1],        enabled: true },
  // ── 10 AM daily ───────────────────────────────────────
  { id: 'review-mon',  name: '評論監控',        emoji: '🌐', color: 'monitor',   hour: 10, minute: 0,  days: 'all',      enabled: true },
  // ── 10 AM Sat ─────────────────────────────────────────
  { id: 'kai-study',   name: 'Kai 週末學習',   emoji: '📚', color: 'trading',   hour: 10, minute: 0,  days: [6],        enabled: true },
  // ── 6 PM Fri ──────────────────────────────────────────
  { id: 'iris-rpt',    name: 'Iris 業務週報',  emoji: '📊', color: 'report',    hour: 18, minute: 0,  days: [5],        enabled: true },
  // ── 8 PM Sun ──────────────────────────────────────────
  { id: 'mira-plan',   name: 'Mira 週內容規劃', emoji: '📣', color: 'marketing', hour: 20, minute: 0, days: [0],        enabled: true },
  // ── 9 PM Sun ──────────────────────────────────────────
  { id: 'sec-audit',   name: '安全審計',        emoji: '🔐', color: 'security',  hour: 21, minute: 0,  days: [0],        enabled: true },
  { id: 'weekly-mtg',  name: '全團隊週會',      emoji: '🧭', color: 'weekly',    hour: 21, minute: 0,  days: [0],        enabled: true },
  // ── 11 PM daily ───────────────────────────────────────
  { id: 'goodnight',   name: '晚安任務提醒',   emoji: '🌙', color: 'system',    hour: 23, minute: 0,  days: 'all',      enabled: true },
  // ── High-freq ─────────────────────────────────────────
  { id: 'mc-push',     name: 'MC 資料推送',    emoji: '🔄', color: 'system',    hour: 0,  minute: 30, days: 'all',      highFreq: true, enabled: true },
  { id: 'ginza-stock', name: 'Ginza 庫存監控', emoji: '🍞', color: 'monitor',   hour: 12, minute: 20, days: 'all',      highFreq: true, enabled: true },
]

// Only show these hours (hours that have scheduled jobs)
const HOURS_SHOWN = [2, 6, 7, 8, 9, 10, 18, 20, 21, 23]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_ZH     = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────
function getWeekDates(offset: number): Date[] {
  const today = new Date()
  const dow = today.getDay()          // 0=Sun
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - dow + offset * 7)
  sunday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function isToday(d: Date) {
  const n = new Date()
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

function jobsForCell(jobs: JobDef[], hour: number, dayIdx: number): JobDef[] {
  return jobs.filter(j => j.enabled && !j.highFreq && j.hour === hour &&
    (j.days === 'all' || (j.days as number[]).includes(dayIdx)))
}

// ────────────────────────────────────────────────────────
// Legend
// ────────────────────────────────────────────────────────
const LEGEND: { label: string; color: Color }[] = [
  { label: '系統', color: 'system' },
  { label: '監控', color: 'monitor' },
  { label: '報告', color: 'report' },
  { label: '行銷', color: 'marketing' },
  { label: '交易', color: 'trading' },
  { label: '安全', color: 'security' },
  { label: '週會', color: 'weekly' },
]

// ────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [weekOffset, setWeekOffset]     = useState(0)
  const [hideHighFreq, setHideHighFreq] = useState(true)

  const weekDates  = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const highFreqJobs = JOBS.filter(j => j.highFreq && j.enabled)

  const fmtDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  const fmtWeek = () =>
    `${fmtDate(weekDates[0])} – ${fmtDate(weekDates[6])} ${weekDates[6].getFullYear()}`

  return (
    <div className="p-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📅 Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Weekly schedule generated from cron jobs · {fmtWeek()}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* High-freq toggle */}
          <button
            onClick={() => setHideHighFreq(h => !h)}
            className={`text-xs px-3 py-1.5 border rounded-lg font-medium transition ${
              hideHighFreq
                ? 'border-gray-200 text-gray-400 hover:bg-gray-50'
                : 'border-amber-300 text-amber-600 bg-amber-50'
            }`}
          >
            {hideHighFreq ? '⚡ High-freq Hidden' : '⚡ High-freq Shown'}
          </button>

          {/* Week nav */}
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-600"
          >
            ← Prev Week
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
          >
            Current Week
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-600"
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-1.5">
        {LEGEND.map(({ label, color }) => (
          <span key={label} className={`text-xs px-2 py-0.5 rounded-full border ${COLORS[color]}`}>
            {label}
          </span>
        ))}
      </div>

      {/* ── High-freq banner ── */}
      {!hideHighFreq && highFreqJobs.length > 0 && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2 flex-wrap items-center">
          <span className="text-xs text-amber-600 font-semibold">⚡ 高頻 Jobs（隱藏中以保持日曆清晰）：</span>
          {highFreqJobs.map(j => (
            <span key={j.id} className={`text-xs px-2 py-0.5 rounded-full border ${COLORS[j.color]}`}>
              {j.emoji} {j.name}
            </span>
          ))}
        </div>
      )}

      {/* ── Calendar grid ── */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="min-w-[720px]">
          {/* Day headers */}
          <div
            className="grid border-b border-gray-100"
            style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}
          >
            <div className="p-2 border-r border-gray-50" />
            {weekDates.map((d, i) => (
              <div
                key={i}
                className={`p-2.5 text-center border-r border-gray-50 last:border-r-0 ${
                  isToday(d) ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`text-[11px] font-semibold ${isToday(d) ? 'text-blue-500' : 'text-gray-400'}`}>
                  {DAY_LABELS[i]}
                </div>
                <div
                  className={`text-lg font-bold leading-tight ${
                    isToday(d) ? 'text-blue-600' : 'text-gray-800'
                  }`}
                >
                  {d.getDate()}
                </div>
                <div className={`text-[11px] ${isToday(d) ? 'text-blue-400' : 'text-gray-400'}`}>
                  {DAY_ZH[i]}
                </div>
              </div>
            ))}
          </div>

          {/* Hour rows */}
          {HOURS_SHOWN.map(hour => {
            const rowHasJobs = weekDates.some((_, di) => jobsForCell(JOBS, hour, di).length > 0)
            if (!rowHasJobs) return null

            return (
              <div
                key={hour}
                className="grid border-b border-gray-50 last:border-b-0"
                style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}
              >
                {/* Hour label */}
                <div className="text-[11px] font-mono text-gray-400 border-r border-gray-50 flex items-start justify-center pt-2.5">
                  {String(hour).padStart(2, '0')}:00
                </div>

                {/* Day cells */}
                {weekDates.map((_, dayIdx) => {
                  const cellJobs = jobsForCell(JOBS, hour, dayIdx)
                  return (
                    <div
                      key={dayIdx}
                      className={`p-1 border-r border-gray-50 last:border-r-0 min-h-[44px] ${
                        isToday(weekDates[dayIdx]) ? 'bg-blue-50/25' : ''
                      }`}
                    >
                      {cellJobs.map(j => (
                        <div
                          key={j.id}
                          title={j.name}
                          className={`text-[11px] px-1.5 py-1 rounded-lg border mb-1 leading-tight ${COLORS[j.color]}`}
                        >
                          <span>{j.emoji}</span>{' '}
                          <span className="font-medium">{j.name}</span>
                          {j.minute > 0 && (
                            <span className="opacity-50 ml-0.5">
                              :{String(j.minute).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        共 {JOBS.filter(j => j.enabled && !j.highFreq).length} 個 scheduled jobs
        {hideHighFreq ? `（另有 ${highFreqJobs.length} 個高頻 jobs 已隱藏）` : ''}
        · 時區：America/Los_Angeles
      </p>
    </div>
  )
}
