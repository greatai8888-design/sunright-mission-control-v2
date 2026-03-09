'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
  logo_url?: string
}

// ─── Sunright own data (mock until IG API) ────────────────
const SUNRIGHT = {
  handle: 'sunright_tea',
  name: 'Sunright Tea Studio',
  followers: 24800,
  followerGrowth: 3.2, // % this week
  avg_likes: 780,
  avg_comments: 45,
  posts_per_week: 3.5,
  engagement_rate: 3.7,
  profile_pic_url: null as string | null,
  lastWeekRank: 8,
  thisWeekRank: 6,
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
      <div className="rounded-full overflow-hidden bg-gray-100 flex-shrink-0" style={{ width: size, height: size }}>
        <Image src={url} alt={name} width={size} height={size} className="object-cover w-full h-full" unoptimized />
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

// ─── Mock best posting times ──────────────────────────────
const POSTING_TIMES = [
  { hour: '9am', engagement: 2.1 },
  { hour: '12pm', engagement: 3.5 },
  { hour: '3pm', engagement: 2.8 },
  { hour: '6pm', engagement: 4.2 },
  { hour: '9pm', engagement: 3.9 },
]

// ─── Mock content type breakdown ──────────────────────────
const CONTENT_TYPES = [
  { type: 'Reels', pct: 45, engagement: 5.2 },
  { type: 'Photos', pct: 40, engagement: 2.8 },
  { type: 'Carousels', pct: 15, engagement: 3.4 },
]

// ─── Mock top posts ───────────────────────────────────────
const TOP_POSTS = [
  { handle: 'tigersugarusa',  brand: 'Tiger Sugar',   profile_pic_url: null, caption: 'New brown sugar series drop 🔥 Limited stock!', eng: '6.2%', likes: '4.1K' },
  { handle: 'gongchausa',     brand: 'Gong Cha USA',  profile_pic_url: null, caption: 'Spring menu is HERE 🌸 Sakura milk tea available now', eng: '4.8%', likes: '6.8K' },
  { handle: 'presotea_usa',   brand: 'Presotea',      profile_pic_url: null, caption: 'Authentic Preso tea press 🇹🇼 freshly brewed', eng: '4.5%', likes: '2.1K' },
  { handle: 'meetfresh_usa',  brand: 'Meet Fresh',    profile_pic_url: null, caption: 'Taro ball dessert series — every spoonful is a vibe', eng: '4.1%', likes: '2.5K' },
  { handle: 'yifangusa',      brand: 'Yi Fang',       profile_pic_url: null, caption: 'Fresh passion fruit lemonade just arrived 🍋', eng: '5.2%', likes: '1.8K' },
  { handle: 'coco_usa',       brand: 'Coco Fresh',    profile_pic_url: null, caption: 'Everyday boba at everyday prices 💛', eng: '3.1%', likes: '5.5K' },
]

const CHART_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6']

// ─── Main ─────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  const [selected, setSelected] = useState<string[]>([])

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
    ? Math.round(competitors.reduce((s, c) => s + c.followers, 0) / competitors.length) : 0
  const avgEngagement = competitors.length
    ? +(competitors.reduce((s, c) => s + c.engagement_rate, 0) / competitors.length).toFixed(2) : 0

  // ─── Trend chart data (7 days) ──────────────────────────
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const genTrend = (base: number) => {
    let v = base
    return Array.from({ length: 7 }, () => { v = v * (1 + (Math.random() - 0.48) * 0.02); return Math.round(v) })
  }

  const trendData = days.map((day, i) => {
    const row: Record<string, string | number> = { day }
    row[SUNRIGHT.handle] = genTrend(SUNRIGHT.followers)[i]
    competitors.filter(c => selected.includes(c.handle)).forEach(c => {
      row[c.handle] = genTrend(c.followers)[i]
    })
    return row
  })

  function toggleSelected(handle: string) {
    setSelected(prev => prev.includes(handle) ? prev.filter(h => h !== handle) : prev.length < 6 ? [...prev, handle] : prev)
  }

  // ─── Mock rank change for competitors ───────────────────
  const withRankChange = competitors.map((c, i) => ({
    ...c,
    thisWeekRank: i + 1,
    lastWeekRank: i + 1 + Math.floor(Math.random() * 3) - 1,
  }))

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">📊 Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">IG Competitive Analysis · {competitors.length} Competitors · Updated {lastUpdate || '...'}</p>
        </div>
        <button onClick={load} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">↻ Refresh</button>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <>
          {/* Sunright Stats (Hero Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="border-2 border-indigo-200 bg-indigo-50">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-indigo-600 mb-1">Followers</div>
                <div className="text-2xl font-bold text-indigo-700">{SUNRIGHT.followers.toLocaleString()}</div>
                <div className="text-xs text-green-600 mt-0.5">↑ {SUNRIGHT.followerGrowth}% this week</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-indigo-200 bg-indigo-50">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-indigo-600 mb-1">Engagement Rate</div>
                <div className="text-2xl font-bold text-indigo-700">{SUNRIGHT.engagement_rate}%</div>
                <div className="text-xs text-gray-500 mt-0.5">vs {avgEngagement}% avg</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-indigo-200 bg-indigo-50">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-indigo-600 mb-1">Posts / Week</div>
                <div className="text-2xl font-bold text-indigo-700">{SUNRIGHT.posts_per_week}</div>
                <div className="text-xs text-gray-500 mt-0.5">Consistent 📈</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-indigo-200 bg-indigo-50">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-indigo-600 mb-1">Avg Likes</div>
                <div className="text-2xl font-bold text-indigo-700">{SUNRIGHT.avg_likes}</div>
                <div className="text-xs text-gray-500 mt-0.5">{SUNRIGHT.avg_comments} comments</div>
              </CardContent>
            </Card>
            <Card className={`border-2 ${SUNRIGHT.thisWeekRank < SUNRIGHT.lastWeekRank ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}>
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-gray-600 mb-1">Rank</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">#{SUNRIGHT.thisWeekRank}</span>
                  {SUNRIGHT.thisWeekRank < SUNRIGHT.lastWeekRank && (
                    <span className="text-green-600 text-sm font-semibold">↑{SUNRIGHT.lastWeekRank - SUNRIGHT.thisWeekRank}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">of {competitors.length + 1}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Ranking Table + Content Types */}
            <div className="lg:col-span-2 space-y-4">
              {/* Competitor Ranking with Change */}
              <Card>
                <CardContent className="pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">🏆 Competitor Ranking</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 w-12">#</th>
                          <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500">Brand</th>
                          <th className="text-right px-2 py-2 text-xs font-semibold text-gray-500">Followers</th>
                          <th className="text-right px-2 py-2 text-xs font-semibold text-gray-500">Eng Rate</th>
                          <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500">Δ Rank</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Sunright row */}
                        <tr className="border-b border-indigo-100 bg-indigo-50/50">
                          <td className="px-2 py-2.5 text-xs text-indigo-500 font-bold">★</td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-2">
                              <Avatar name={SUNRIGHT.name} size={28} />
                              <div>
                                <div className="font-semibold text-indigo-700 text-sm">Sunright</div>
                                <div className="text-xs text-indigo-400">@{SUNRIGHT.handle}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-right font-semibold text-gray-900">{SUNRIGHT.followers.toLocaleString()}</td>
                          <td className="px-2 py-2.5 text-right text-green-600 font-semibold">{SUNRIGHT.engagement_rate}%</td>
                          <td className="px-2 py-2.5 text-center">
                            <span className="text-green-600 font-semibold">↑2</span>
                          </td>
                        </tr>
                        {withRankChange.slice(0, 10).map(c => {
                          const rankDiff = c.lastWeekRank - c.thisWeekRank
                          const engColor = c.engagement_rate >= 4 ? 'text-green-600' : c.engagement_rate >= 3 ? 'text-yellow-600' : 'text-red-400'
                          return (
                            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-2 py-2.5 text-xs text-gray-400">{c.thisWeekRank}</td>
                              <td className="px-2 py-2.5">
                                <div className="flex items-center gap-2">
                                  <Avatar name={c.name} url={c.logo_url || c.profile_pic_url} size={28} />
                                  <div>
                                    <div className="font-medium text-gray-900 text-sm">{c.name.split(' ').slice(0, 2).join(' ')}</div>
                                    <div className="text-xs text-gray-400">@{c.handle}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-2.5 text-right text-gray-700">{c.followers.toLocaleString()}</td>
                              <td className={`px-2 py-2.5 text-right font-medium ${engColor}`}>{c.engagement_rate}%</td>
                              <td className="px-2 py-2.5 text-center text-sm">
                                {rankDiff > 0 ? <span className="text-green-600">↑{rankDiff}</span>
                                  : rankDiff < 0 ? <span className="text-red-500">↓{Math.abs(rankDiff)}</span>
                                  : <span className="text-gray-300">—</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Follower Trend Chart */}
              <Card>
                <CardContent className="pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">📈 Follower Trend — Last 7 Days</h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[SUNRIGHT, ...competitors].slice(0, 8).map((c, i) => {
                      const isSun = c.handle === SUNRIGHT.handle
                      const color = isSun ? '#6366f1' : CHART_COLORS[i % CHART_COLORS.length]
                      const isOn = selected.includes(c.handle) || isSun
                      return (
                        <button key={c.handle} onClick={() => !isSun && toggleSelected(c.handle)}
                          className={`text-xs px-2 py-1 rounded-full border transition ${isOn ? 'text-white border-transparent' : 'text-gray-400 border-gray-200 hover:border-gray-400'} ${isSun ? 'cursor-default' : 'cursor-pointer'}`}
                          style={isOn ? { backgroundColor: color } : {}}>
                          {isSun ? '★ ' : ''}{c.name.split(' ')[0]}
                        </button>
                      )
                    })}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={0} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} width={40} />
                      <Tooltip formatter={(v: unknown) => [(v as number).toLocaleString()]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      <Line type="monotone" dataKey={SUNRIGHT.handle} stroke="#6366f1" strokeWidth={2.5} dot={false} name="Sunright ★" />
                      {competitors.filter(c => selected.includes(c.handle)).map((c, i) => (
                        <Line key={c.handle} type="monotone" dataKey={c.handle} stroke={CHART_COLORS[(i + 1) % CHART_COLORS.length]} strokeWidth={1.5} dot={false} name={c.name.split(' ')[0]} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Best Times + Content Types + Top Posts */}
            <div className="space-y-4">
              {/* Best Posting Time */}
              <Card>
                <CardContent className="pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">⏰ Best Posting Time</h2>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={POSTING_TIMES}>
                      <Bar dataKey="engagement" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-500 mt-2 text-center">Peak: <span className="font-semibold text-indigo-600">6pm</span> (4.2% engagement)</p>
                </CardContent>
              </Card>

              {/* Content Type Breakdown */}
              <Card>
                <CardContent className="pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">🎬 Content Performance</h2>
                  <div className="space-y-2">
                    {CONTENT_TYPES.map(ct => (
                      <div key={ct.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{ct.type}</span>
                          <span className="text-xs text-gray-400">{ct.pct}%</span>
                        </div>
                        <div className="text-sm font-semibold text-green-600">{ct.engagement}% eng</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">💡 Reels outperform photos by 85%</p>
                </CardContent>
              </Card>

              {/* This Week's Top Posts (compact) */}
              <Card>
                <CardContent className="pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">📈 This Week's Top Posts</h2>
                  <div className="space-y-2">
                    {TOP_POSTS.slice(0, 4).map(post => (
                      <div key={post.handle} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                        <Avatar name={post.brand} url={post.profile_pic_url} size={28} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{post.brand}</div>
                          <div className="text-xs text-gray-400 truncate">{post.caption.slice(0, 30)}...</div>
                        </div>
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">{post.eng}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
