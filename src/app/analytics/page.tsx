'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────
interface Competitor {
  id: string
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
  profile_pic_url?: string
}

// ─── Sunright own data (mock until IG API) ────────────────
const SUNRIGHT = {
  handle: 'sunright_tea',
  name: 'Sunright Tea Studio',
  followers: 24800,
  avg_likes: 780,
  avg_comments: 45,
  posts_per_week: 3.5,
  engagement_rate: 3.7,
  profile_pic_url: null as string | null,
}

// ─── Avatar Component ─────────────────────────────────────
function Avatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = [
    'from-pink-400 to-rose-500',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-500',
    'from-blue-400 to-indigo-500',
    'from-purple-400 to-violet-500',
    'from-cyan-400 to-sky-500',
  ]
  const colorIdx = name.charCodeAt(0) % colors.length

  if (url) {
    return (
      <div
        className="rounded-full overflow-hidden bg-gray-100 flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={url}
          alt={name}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
    )
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  )
}

// ─── Mock 30-day trend data ───────────────────────────────
function genTrend(base: number, variance = 0.02): number[] {
  let v = base
  return Array.from({ length: 30 }, () => {
    v = v * (1 + (Math.random() - 0.48) * variance)
    return Math.round(v)
  })
}

const CHART_COLORS = [
  '#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6',
  '#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6',
]

// ─── Mock top posts (with profile pic URLs) ───────────────
const TOP_POSTS = [
  { handle: 'tigersugarusa',  brand: 'Tiger Sugar',   profile_pic_url: null, caption: 'New brown sugar series drop 🔥 Limited stock!', eng: '6.2%', likes: '4.1K' },
  { handle: 'gongchausa',     brand: 'Gong Cha USA',  profile_pic_url: null, caption: 'Spring menu is HERE 🌸 Sakura milk tea available now', eng: '4.8%', likes: '6.8K' },
  { handle: 'presotea_usa',   brand: 'Presotea',      profile_pic_url: null, caption: 'Authentic Preso tea press 🇹🇼 freshly brewed', eng: '4.5%', likes: '2.1K' },
  { handle: 'meetfresh_usa',  brand: 'Meet Fresh',    profile_pic_url: null, caption: 'Taro ball dessert series — every spoonful is a vibe', eng: '4.1%', likes: '2.5K' },
  { handle: 'yifangusa',      brand: 'Yi Fang',       profile_pic_url: null, caption: 'Fresh passion fruit lemonade just arrived 🍋', eng: '5.2%', likes: '1.8K' },
  { handle: 'coco_usa',       brand: 'Coco Fresh',    profile_pic_url: null, caption: 'Everyday boba at everyday prices 💛', eng: '3.1%', likes: '5.5K' },
]

// ─── Helper ────────────────────────────────────────────────
function Arrow({ val, base }: { val: number; base: number }) {
  const pct = ((val - base) / base) * 100
  if (Math.abs(pct) < 1) return <span className="text-gray-400">—</span>
  return pct > 0
    ? <span className="text-green-500">↑ {pct.toFixed(1)}%</span>
    : <span className="text-red-400">↓ {Math.abs(pct).toFixed(1)}%</span>
}

// ─── Main ─────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading,     setLoading]     = useState(true)
  const [lastUpdate,  setLastUpdate]  = useState('')
  const [selected,    setSelected]    = useState<string[]>([])   // for trend chart

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('competitor_latest')
      .select('*')
      .order('followers', { ascending: false })
    const comps = (data || []) as Competitor[]
    setCompetitors(comps)
    setSelected(comps.slice(0, 4).map(c => c.handle))
    setLastUpdate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ─── Derived stats ──────────────────────────────────────
  const avgFollowers = competitors.length
    ? Math.round(competitors.reduce((s, c) => s + c.followers, 0) / competitors.length)
    : 0
  const avgEngagement = competitors.length
    ? +(competitors.reduce((s, c) => s + c.engagement_rate, 0) / competitors.length).toFixed(2)
    : 0
  const avgPosts = competitors.length
    ? +(competitors.reduce((s, c) => s + c.posts_per_week, 0) / competitors.length).toFixed(1)
    : 0

  // ─── Trend chart data ───────────────────────────────────
  const trendComps = [
    { ...SUNRIGHT, isSunright: true },
    ...competitors.map(c => ({ ...c, isSunright: false })),
  ]

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const trendData = days.map((day, i) => {
    const row: Record<string, string | number> = { day }
    trendComps.forEach(c => {
      if (!selected.includes(c.handle) && !c.isSunright) return
      const trend = genTrend(c.followers)
      row[c.handle] = trend[i]
    })
    return row
  })

  function toggleSelected(handle: string) {
    setSelected(prev =>
      prev.includes(handle)
        ? prev.filter(h => h !== handle)
        : prev.length < 6 ? [...prev, handle] : prev
    )
  }

  const allForChart = [SUNRIGHT, ...competitors]

  return (
    <div className="p-4 md:p-6 space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">📊 Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">IG Competitive Analysis · {competitors.length} Competitors · Updated {lastUpdate || '...'}</p>
        </div>
        <button onClick={load} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* ① Comparison Cards */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sunright vs Competitor Average</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Followers */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">Followers</p>
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{SUNRIGHT.followers.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Sunright</div>
                  </div>
                  <div className="text-gray-300 text-lg mb-4">vs</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-400">{avgFollowers.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Avg</div>
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <Arrow val={SUNRIGHT.followers} base={avgFollowers} />
                </div>
              </div>

              {/* Engagement */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">Engagement Rate</p>
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{SUNRIGHT.engagement_rate}%</div>
                    <div className="text-xs text-gray-400 mt-0.5">Sunright</div>
                  </div>
                  <div className="text-gray-300 text-lg mb-4">vs</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-400">{avgEngagement}%</div>
                    <div className="text-xs text-gray-400 mt-0.5">Avg</div>
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <Arrow val={SUNRIGHT.engagement_rate} base={avgEngagement} />
                </div>
              </div>

              {/* Posts/week */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">Posts / Week</p>
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{SUNRIGHT.posts_per_week}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Sunright</div>
                  </div>
                  <div className="text-gray-300 text-lg mb-4">vs</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-400">{avgPosts}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Avg</div>
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <Arrow val={SUNRIGHT.posts_per_week} base={avgPosts} />
                </div>
              </div>
            </div>
          </section>

          {/* ② Ranking Table */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Competitor Ranking</h2>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-10">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Brand</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Followers</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Eng Rate</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Posts/Wk</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sunright row — highlighted */}
                    <tr className="border-b border-blue-100 bg-blue-50/60">
                      <td className="px-4 py-3 text-xs text-blue-400 font-bold">★</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={SUNRIGHT.name} url={SUNRIGHT.profile_pic_url} size={32} />
                          <div>
                            <div className="font-semibold text-blue-700 text-sm">Sunright Tea Studio</div>
                            <div className="text-xs text-blue-400">@{SUNRIGHT.handle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{SUNRIGHT.followers.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{SUNRIGHT.engagement_rate}%</td>
                      <td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">{SUNRIGHT.posts_per_week}</td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell"><span className="text-green-500 text-xs">↑ 2.1%</span></td>
                    </tr>
                    {competitors.map((c, i) => {
                      const engColor = c.engagement_rate >= 4 ? 'text-green-600' : c.engagement_rate >= 3 ? 'text-yellow-600' : 'text-red-400'
                      const trend = c.engagement_rate > avgEngagement ? 'up' : 'down'
                      return (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={c.name} url={c.profile_pic_url} size={32} />
                              <div>
                                <div className="font-medium text-gray-900">{c.name}</div>
                                <div className="text-xs text-gray-400">@{c.handle}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">{c.followers.toLocaleString()}</td>
                          <td className={`px-4 py-3 text-right font-medium ${engColor}`}>{c.engagement_rate}%</td>
                          <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">{c.posts_per_week}</td>
                          <td className="px-4 py-3 text-right text-xs hidden sm:table-cell">
                            {trend === 'up'
                              ? <span className="text-green-500">↑</span>
                              : <span className="text-red-400">↓</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ③ Follower Trend Chart */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Follower Trend — Last 7 Days</h2>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm">
              {/* Brand selector */}
              <div className="flex flex-wrap gap-2 mb-5">
                {allForChart.map((c, i) => {
                  const isSun = c.handle === SUNRIGHT.handle
                  const color = isSun ? '#6366f1' : CHART_COLORS[i % CHART_COLORS.length]
                  const isOn  = selected.includes(c.handle) || isSun
                  return (
                    <button
                      key={c.handle}
                      onClick={() => !isSun && toggleSelected(c.handle)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${
                        isOn
                          ? 'text-white border-transparent'
                          : 'text-gray-400 border-gray-200 hover:border-gray-400'
                      } ${isSun ? 'cursor-default' : 'cursor-pointer'}`}
                      style={isOn ? { backgroundColor: color, borderColor: color } : {}}
                    >
                      {isSun ? '★ ' : ''}{c.name.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mb-3">Select up to 6 competitors (Sunright always shown)</p>

              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    interval={0}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                    width={40}
                  />
                  <Tooltip
                    formatter={(v: unknown) => [(v as number).toLocaleString()]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  {/* Sunright always shown */}
                  <Line
                    key="sunright"
                    type="monotone"
                    dataKey={SUNRIGHT.handle}
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={false}
                    name="Sunright ★"
                  />
                  {competitors
                    .filter(c => selected.includes(c.handle))
                    .map((c, i) => (
                      <Line
                        key={c.handle}
                        type="monotone"
                        dataKey={c.handle}
                        stroke={CHART_COLORS[(i + 1) % CHART_COLORS.length]}
                        strokeWidth={1.5}
                        dot={false}
                        name={c.name.split(' ').slice(0, 2).join(' ')}
                      />
                    ))
                  }
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ④ This Week's Top Posts */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">📈 This Week's Top Posts</h2>
            <p className="text-xs text-gray-400 -mt-2 mb-3">Highest engagement posts from each competitor (last 7 days) · Mock data (Iris will connect IG API)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TOP_POSTS.map(post => (
                <div key={post.handle} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                  {/* Header */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <Avatar name={post.brand} url={post.profile_pic_url} size={36} />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{post.brand}</div>
                      <div className="text-xs text-gray-400">@{post.handle}</div>
                    </div>
                  </div>

                  {/* Post thumbnail mock */}
                  <div className="h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center text-gray-300 mb-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>

                  {/* Caption */}
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">{post.caption}</p>

                  {/* Metrics */}
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-600 font-semibold">{post.eng} Eng</span>
                    <span className="text-gray-400">❤️ {post.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
