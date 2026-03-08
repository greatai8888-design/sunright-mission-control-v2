'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MarketSnapshot } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function StocksPage() {
  const [latest, setLatest] = useState<MarketSnapshot | null>(null)
  const [history, setHistory] = useState<MarketSnapshot[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('market_snapshots')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(20)
    const rows = data || []
    setLatest(rows[0] || null)
    setHistory(rows)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const vix = latest?.vix ?? null
  const vixColor = vix === null ? 'text-gray-400' : vix > 25 ? 'text-red-600' : vix > 18 ? 'text-yellow-600' : 'text-green-600'
  const vixBg    = vix === null ? '' : vix > 25 ? 'border-red-200 bg-red-50' : vix > 18 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
  const vixLabel = vix === null ? '—' : vix > 25 ? '⚠️ 高波動' : vix > 18 ? '⚡ 輕度波動' : '✅ 市場穩定'

  const cards = [
    { label: 'VIX',          value: vix ?? '—',                     sub: vixLabel,               color: vixColor, border: vixBg, icon: '📊' },
    { label: 'S&P 500',      value: latest?.price ?? '—',           sub: latest?.change_pct != null ? `${latest.change_pct > 0 ? '+' : ''}${latest.change_pct}%` : '—', color: 'text-blue-600', border: '', icon: '📈' },
    { label: '市場狀態',     value: latest?.market_status ?? '—',   sub: latest ? new Date(latest.captured_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '', color: 'text-gray-700', border: '', icon: '🕐' },
  ]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📉 Stocks</h1>
          <p className="text-sm text-gray-500 mt-0.5">市場數據 · VIX 追蹤</p>
        </div>
        <Button variant="outline" onClick={load}>↻</Button>
      </div>

      {/* Market Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.label} className={`border ${c.border || 'border-gray-100'}`}>
            <CardContent className="pt-5">
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className={`text-3xl font-bold ${c.color}`}>{loading ? '—' : String(c.value)}</div>
              <div className="text-sm text-gray-500 mt-1">{c.label}</div>
              {c.sub && <div className="text-xs text-gray-400 mt-0.5">{String(c.sub)}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* VIX Reference */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">VIX 警戒標準</p>
          <div className="flex gap-4 flex-wrap text-xs">
            <span className="text-green-600">● VIX &lt; 18：市場穩定</span>
            <span className="text-yellow-600">● VIX 18–25：輕度波動</span>
            <span className="text-red-600">● VIX &gt; 25：高波動警戒</span>
            <span className="text-red-700 font-medium">● VIX &gt; 30：恐慌，減少廣告預算</span>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 1 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">最近記錄</p>
          <div className="space-y-2">
            {history.slice(1, 8).map(h => (
              <div key={h.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-2.5 text-sm">
                <span className="text-gray-500">{new Date(h.captured_at).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`font-semibold ${h.vix && h.vix > 25 ? 'text-red-600' : h.vix && h.vix > 18 ? 'text-yellow-600' : 'text-green-600'}`}>VIX {h.vix ?? '—'}</span>
                <span className="text-gray-700">{h.price ?? '—'}</span>
                <Badge variant="outline" className="text-xs">{h.market_status ?? '—'}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !latest && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📉</div>
          <div className="font-medium">尚無市場數據</div>
          <p className="text-sm mt-1">交易腳本執行後自動更新</p>
        </div>
      )}
    </div>
  )
}
