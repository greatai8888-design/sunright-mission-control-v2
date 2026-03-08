'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Review } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm">
      {'★'.repeat(rating)}<span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

export default function ReviewsPage() {
  const [gmaps, setGmaps] = useState<Review[]>([])
  const [yelp, setYelp] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(100)
    const all = data || []
    setGmaps(all.filter(r => r.platform === 'google_maps'))
    setYelp(all.filter(r => r.platform === 'yelp'))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const negGmaps = gmaps.filter(r => r.is_negative)
  const negYelp  = yelp.filter(r => r.is_negative)

  function ReviewCard({ r }: { r: Review }) {
    return (
      <div className={`bg-white border rounded-xl p-4 shadow-sm ${r.is_negative ? 'border-red-100' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900">{r.author || 'Anonymous'}</span>
          <Stars rating={r.rating} />
          {r.location && <span className="text-xs text-gray-400">📍 {r.location}</span>}
          {r.is_negative && <Badge variant="destructive" className="text-xs">負評</Badge>}
          <span className="text-xs text-gray-300 ml-auto">{r.review_date || new Date(r.scraped_at).toLocaleDateString('zh-TW')}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{r.content?.slice(0, 300)}</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⭐ Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">Google Maps + Yelp 評論監控</p>
        </div>
        <Button variant="outline" onClick={load}>↻ 重新整理</Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">載入中...</div>
      ) : (
        <Tabs defaultValue="gmaps">
          <TabsList className="mb-4">
            <TabsTrigger value="gmaps">
              🗺️ Google Maps
              {negGmaps.length > 0 && <Badge variant="destructive" className="ml-2 text-xs">{negGmaps.length} 負評</Badge>}
            </TabsTrigger>
            <TabsTrigger value="yelp">
              ⭐ Yelp
              {negYelp.length > 0 && <Badge variant="destructive" className="ml-2 text-xs">{negYelp.length} 負評</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gmaps">
            {gmaps.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">🗺️</div>
                <div className="font-medium">尚無 Google Maps 評論</div>
                <p className="text-sm mt-1">監控腳本執行後自動 push 至此</p>
              </div>
            ) : (
              <div className="space-y-3">
                {negGmaps.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-red-600">🚨 負評（{negGmaps.length} 筆）</p>
                    {negGmaps.map(r => <ReviewCard key={r.id} r={r} />)}
                    <p className="text-sm font-medium text-gray-500 pt-2">其他評論</p>
                  </>
                )}
                {gmaps.filter(r => !r.is_negative).map(r => <ReviewCard key={r.id} r={r} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="yelp">
            {yelp.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">⭐</div>
                <div className="font-medium">尚無 Yelp 評論</div>
                <p className="text-sm mt-1">監控腳本執行後自動 push 至此</p>
              </div>
            ) : (
              <div className="space-y-3">
                {negYelp.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-red-600">🚨 負評（{negYelp.length} 筆）</p>
                    {negYelp.map(r => <ReviewCard key={r.id} r={r} />)}
                    <p className="text-sm font-medium text-gray-500 pt-2">其他評論</p>
                  </>
                )}
                {yelp.filter(r => !r.is_negative).map(r => <ReviewCard key={r.id} r={r} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
