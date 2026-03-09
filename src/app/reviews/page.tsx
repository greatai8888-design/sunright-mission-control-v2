'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Review } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'text-lg' : 'text-sm'
  return (
    <span className={cls}>
      {'★'.repeat(rating)}<span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

// ─── Keyword extraction (simple) ──────────────────────────
function extractKeywords(reviews: Review[]): { word: string; count: number }[] {
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'them', 'us', 'not', 'no', 'so', 'just', 'very', 'too', 'also', 'only', 'even', 'more', 'most', 'some', 'any', 'all', 'each', 'every', 'both', 'few', 'many', 'much', 'other', 'another', 'such', 'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'if', 'then', 'than', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'but', 'get', 'got', 'like', 'really', 'tea', 'place', 'time', 'one', 'go', 'went', 'come', 'came', 'back'])
  const counts: Record<string, number> = {}
  reviews.forEach(r => {
    const words = (r.content || '').toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/)
    words.forEach(w => {
      if (w.length > 3 && !stopwords.has(w)) {
        counts[w] = (counts[w] || 0) + 1
      }
    })
  })
  return Object.entries(counts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(200)
    setReviews(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ─── Derived stats ──────────────────────────────────────
  const gmaps = reviews.filter(r => r.platform === 'google_maps')
  const yelp = reviews.filter(r => r.platform === 'yelp')
  const allReviews = reviews
  const negReviews = reviews.filter(r => r.is_negative)
  
  const avgRating = allReviews.length
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : '—'
  
  const negPct = allReviews.length
    ? ((negReviews.length / allReviews.length) * 100).toFixed(0)
    : '0'

  // ─── Location rankings ──────────────────────────────────
  const locationStats = useMemo(() => {
    const locs: Record<string, { total: number; sum: number; neg: number }> = {}
    allReviews.forEach(r => {
      const loc = r.location || 'Unknown'
      if (!locs[loc]) locs[loc] = { total: 0, sum: 0, neg: 0 }
      locs[loc].total++
      locs[loc].sum += r.rating
      if (r.is_negative) locs[loc].neg++
    })
    return Object.entries(locs)
      .map(([location, s]) => ({ location, avg: s.sum / s.total, count: s.total, negCount: s.neg }))
      .sort((a, b) => b.avg - a.avg)
  }, [allReviews])

  // ─── Sentiment keywords ─────────────────────────────────
  const negKeywords = useMemo(() => extractKeywords(negReviews), [negReviews])

  // ─── 7-day trend ────────────────────────────────────────
  const recent7d = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return allReviews.filter(r => new Date(r.scraped_at).getTime() > cutoff)
  }, [allReviews])
  const recent7dAvg = recent7d.length
    ? (recent7d.reduce((s, r) => s + r.rating, 0) / recent7d.length).toFixed(1)
    : '—'
  const trendUp = recent7dAvg !== '—' && avgRating !== '—' && parseFloat(recent7dAvg) >= parseFloat(avgRating)

  function ReviewCard({ r }: { r: Review }) {
    const dateStr = r.review_date || new Date(r.scraped_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return (
      <div className={`bg-white border rounded-xl p-4 shadow-sm ${r.is_negative ? 'border-red-100' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900">{r.author || 'Anonymous'}</span>
          <Stars rating={r.rating} />
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{dateStr}</span>
          {r.location && (
            <>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">📍 {r.location}</span>
            </>
          )}
          {r.is_negative && <Badge variant="destructive" className="text-xs">Negative</Badge>}
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{r.content?.slice(0, 300)}</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">⭐ Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">Google Maps + Yelp Review Monitoring</p>
        </div>
        <Button variant="outline" onClick={load}>↻ Refresh</Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border border-gray-100">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-gray-500 mb-1">Average Rating</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">{avgRating}</span>
                  <Stars rating={Math.round(parseFloat(avgRating) || 0)} size="lg" />
                </div>
                <div className={`text-xs mt-1 ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
                  {trendUp ? '↑' : '↓'} 7d avg: {recent7dAvg}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-100">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-gray-500 mb-1">Total Reviews</div>
                <div className="text-2xl font-bold text-gray-900">{allReviews.length}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {gmaps.length} GMaps · {yelp.length} Yelp
                </div>
              </CardContent>
            </Card>
            <Card className={`border ${negReviews.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-gray-500 mb-1">Negative Reviews</div>
                <div className={`text-2xl font-bold ${negReviews.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {negReviews.length}
                </div>
                <div className="text-xs text-gray-400 mt-1">{negPct}% of total</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-100">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-gray-500 mb-1">Last 7 Days</div>
                <div className="text-2xl font-bold text-gray-900">{recent7d.length}</div>
                <div className="text-xs text-gray-400 mt-1">new reviews</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Location Rankings + Keywords */}
            <div className="space-y-4">
              {/* Location Rankings */}
              <Card>
                <CardContent className="pt-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">📍 Location Rankings</h2>
                  <div className="space-y-2">
                    {locationStats.slice(0, 8).map((loc, i) => (
                      <div key={loc.location} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {i + 1}
                          </span>
                          <span className="text-sm text-gray-700 truncate max-w-[140px]">{loc.location.replace('Sunright Tea Studio - ', '')}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">{loc.avg.toFixed(1)} ★</div>
                          <div className="text-xs text-gray-400">{loc.count} reviews</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Negative Keywords */}
              {negKeywords.length > 0 && (
                <Card className="border-red-100">
                  <CardContent className="pt-4">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">🚨 Negative Sentiment Keywords</h2>
                    <div className="flex flex-wrap gap-2">
                      {negKeywords.map(k => (
                        <Badge key={k.word} variant="outline" className="text-xs border-red-200 text-red-600">
                          {k.word} ({k.count})
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Review List */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="negative">
                <TabsList className="mb-4">
                  <TabsTrigger value="negative">
                    🚨 Negative
                    {negReviews.length > 0 && <Badge variant="destructive" className="ml-2 text-xs">{negReviews.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="gmaps">
                    🗺️ Google ({gmaps.length})
                  </TabsTrigger>
                  <TabsTrigger value="yelp">
                    ⭐ Yelp ({yelp.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="negative">
                  {negReviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-3xl mb-2">✅</div>
                      <div className="font-medium">No negative reviews</div>
                      <p className="text-sm mt-1">All reviews are positive!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 mb-2">Showing {negReviews.length} negative reviews — respond promptly</p>
                      {negReviews.map(r => <ReviewCard key={r.id} r={r} />)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="gmaps">
                  {gmaps.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-3xl mb-2">🗺️</div>
                      <div className="font-medium">No Google Maps reviews yet</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {gmaps.slice(0, 15).map(r => <ReviewCard key={r.id} r={r} />)}
                      {gmaps.length > 15 && <p className="text-xs text-gray-400 text-center">+ {gmaps.length - 15} more</p>}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="yelp">
                  {yelp.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-3xl mb-2">⭐</div>
                      <div className="font-medium">No Yelp reviews yet</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {yelp.slice(0, 15).map(r => <ReviewCard key={r.id} r={r} />)}
                      {yelp.length > 15 && <p className="text-xs text-gray-400 text-center">+ {yelp.length - 15} more</p>}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
