'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MarketSnapshot } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ─── Mock Holdings (Kai's portfolio) ──────────────────────
const HOLDINGS = [
  { symbol: 'TPL',  name: 'Texas Pacific Land',  shares: 5,   avgCost: 950.00,  currentPrice: 1125.50 },
  { symbol: 'LMT',  name: 'Lockheed Martin',     shares: 10,  avgCost: 450.00,  currentPrice: 478.25 },
  { symbol: 'RKLB', name: 'Rocket Lab USA',      shares: 200, avgCost: 18.50,   currentPrice: 22.80 },
  { symbol: 'WBD',  name: 'Warner Bros Discovery', shares: 100, avgCost: 12.00, currentPrice: 10.45 },
  { symbol: 'CAVA', name: 'CAVA Group',          shares: 50,  avgCost: 85.00,   currentPrice: 98.30 },
]

// ─── Mock Watchlist ───────────────────────────────────────
const WATCHLIST = [
  { symbol: 'PLTR', name: 'Palantir',       price: 24.50, change: +2.3 },
  { symbol: 'SMCI', name: 'Super Micro',    price: 875.00, change: -1.8 },
  { symbol: 'ARM',  name: 'ARM Holdings',   price: 145.20, change: +4.1 },
  { symbol: 'NVDA', name: 'NVIDIA',         price: 878.50, change: +1.2 },
  { symbol: 'COIN', name: 'Coinbase',       price: 245.80, change: +3.5 },
]

// ─── Mock Recent Trades ───────────────────────────────────
const RECENT_TRADES = [
  { date: '2026-03-08', symbol: 'RKLB', action: 'BUY',  shares: 50, price: 21.50 },
  { date: '2026-03-06', symbol: 'CAVA', action: 'BUY',  shares: 25, price: 92.00 },
  { date: '2026-03-04', symbol: 'WBD',  action: 'SELL', shares: 50, price: 11.20 },
  { date: '2026-03-01', symbol: 'TPL',  action: 'BUY',  shares: 2,  price: 980.00 },
]

// ─── Market Summary (Kai's daily note) ────────────────────
const MARKET_SUMMARY = {
  date: '2026-03-09',
  title: '科技股反彈，VIX 回穩',
  content: `今日大盤小幅收高，S&P 500 上漲 0.3%。VIX 從上週的 22 降到 17.5，市場恐慌情緒消退。

關鍵觀察：
• NVIDIA 財報後持續強勢，帶動半導體類股
• 防禦類股（LMT）維持穩定，適合當前不確定環境
• RKLB 突破阻力位 $22，成交量放大
• WBD 持續弱勢，考慮減倉

下週關注：CPI 數據發布（週二）、聯準會會議紀錄`,
}

export default function StocksPage() {
  const [latest, setLatest] = useState<MarketSnapshot | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('market_snapshots')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(1)
    setLatest(data?.[0] || null)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ─── Calculate portfolio stats ──────────────────────────
  const totalCost = HOLDINGS.reduce((s, h) => s + h.avgCost * h.shares, 0)
  const totalValue = HOLDINGS.reduce((s, h) => s + h.currentPrice * h.shares, 0)
  const totalPnL = totalValue - totalCost
  const totalPnLPct = (totalPnL / totalCost) * 100

  // ─── VIX styling ────────────────────────────────────────
  const vix = latest?.vix ?? null
  const vixColor = vix === null ? 'text-gray-400' : vix > 25 ? 'text-red-600' : vix > 18 ? 'text-yellow-600' : 'text-green-600'
  const vixBg = vix === null ? 'border-gray-100' : vix > 25 ? 'border-red-200 bg-red-50' : vix > 18 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
  const vixLabel = vix === null ? '—' : vix > 25 ? '⚠️ High Volatility' : vix > 18 ? '⚡ Moderate' : '✅ Stable'

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">📈 Stocks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kai's Portfolio · Market Data</p>
        </div>
        <Button variant="outline" onClick={load}>↻ Refresh</Button>
      </div>

      {/* Market Indicator Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={`border ${vixBg}`}>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500 mb-1">VIX</div>
            <div className={`text-2xl font-bold ${vixColor}`}>{loading ? '—' : vix ?? '—'}</div>
            <div className="text-xs text-gray-400 mt-0.5">{vixLabel}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500 mb-1">S&P 500</div>
            <div className="text-2xl font-bold text-gray-900">{loading ? '—' : latest?.price ?? '—'}</div>
            <div className={`text-xs mt-0.5 ${(latest?.change_pct ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {latest?.change_pct != null ? `${latest.change_pct > 0 ? '+' : ''}${latest.change_pct}%` : '—'}
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500 mb-1">Portfolio Value</div>
            <div className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className={`text-xs mt-0.5 ${totalPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnLPct.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500 mb-1">Market Status</div>
            <div className="text-2xl font-bold text-gray-900">{loading ? '—' : latest?.market_status ?? '—'}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {latest ? new Date(latest.captured_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Holdings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Holdings */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">💼 Kai's Holdings</h2>
                <div className={`text-sm font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="space-y-2">
                {HOLDINGS.map(h => {
                  const pnl = (h.currentPrice - h.avgCost) * h.shares
                  const pnlPct = ((h.currentPrice - h.avgCost) / h.avgCost) * 100
                  const isUp = pnl >= 0
                  return (
                    <div key={h.symbol} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {h.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{h.symbol}</div>
                          <div className="text-xs text-gray-400">{h.shares} shares · ${h.avgCost.toFixed(2)} avg</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">${h.currentPrice.toFixed(2)}</div>
                        <div className={`text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                          {isUp ? '+' : ''}{pnlPct.toFixed(1)}% ({isUp ? '+' : ''}${pnl.toFixed(0)})
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Market Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-sm font-semibold text-gray-700">📋 Market Summary</h2>
                <Badge variant="outline" className="text-xs">{MARKET_SUMMARY.date}</Badge>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">{MARKET_SUMMARY.title}</h3>
              <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                {MARKET_SUMMARY.content}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Watchlist + Recent Trades */}
        <div className="space-y-4">
          {/* Watchlist */}
          <Card>
            <CardContent className="pt-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">👀 Watchlist</h2>
              <div className="space-y-2">
                {WATCHLIST.map(w => (
                  <div key={w.symbol} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{w.symbol}</div>
                      <div className="text-xs text-gray-400">{w.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">${w.price.toFixed(2)}</div>
                      <div className={`text-xs font-medium ${w.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {w.change >= 0 ? '+' : ''}{w.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <Card>
            <CardContent className="pt-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">📜 Recent Trades</h2>
              <div className="space-y-2">
                {RECENT_TRADES.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={t.action === 'BUY' ? 'default' : 'destructive'} className="text-xs w-11 justify-center">
                        {t.action}
                      </Badge>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{t.symbol}</div>
                        <div className="text-xs text-gray-400">{t.shares} @ ${t.price}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{t.date}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* VIX Reference */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">📊 VIX Guide</h2>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> VIX &lt; 18: Stable</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500" /> VIX 18-25: Moderate</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> VIX &gt; 25: High Risk</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-700" /> VIX &gt; 30: Reduce ad spend</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
