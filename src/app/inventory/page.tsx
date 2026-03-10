'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ─── Types ────────────────────────────────────────────────
interface StoreInventory {
  name: string
  outOfStock: string[]
}

// ─── Mock data — replace with Supabase when table is ready ─
const STORES: StoreInventory[] = [
  { name: 'Irvine',            outOfStock: [] },
  { name: 'Koreatown',         outOfStock: ['Brown Sugar Boba Milk', 'Taro Latte'] },
  { name: 'Arcadia',           outOfStock: ['Cheese Foam Green Tea'] },
  { name: 'Artesia',           outOfStock: [] },
  { name: 'Burlingame',        outOfStock: [] },
  { name: 'Costa Mesa',        outOfStock: [] },
  { name: 'Diamond Bar',       outOfStock: [] },
  { name: 'Fullerton',         outOfStock: [] },
  { name: 'Garden Grove',      outOfStock: [] },
  { name: 'Gardena',           outOfStock: [] },
  { name: 'Little Tokyo',      outOfStock: [] },
  { name: 'Long Beach',        outOfStock: [] },
  { name: 'Monterey Park',     outOfStock: [] },
  { name: 'San Gabriel',       outOfStock: [] },
]

const LAST_UPDATED = '2026-03-09 17:30 PST'

// ─── Store Card ────────────────────────────────────────────
function StoreCard({ store }: { store: StoreInventory }) {
  const [expanded, setExpanded] = useState(false)
  const count = store.outOfStock.length
  const status = count === 0 ? 'ok' : count === 1 ? 'warn' : 'critical'

  const statusConfig = {
    ok:       { icon: '✅', label: 'All in stock',   border: 'border-gray-100',   bg: '' },
    warn:     { icon: '⚠️', label: '1 item out',      border: 'border-yellow-200', bg: 'bg-yellow-50/40' },
    critical: { icon: '❌', label: `${count} items out`, border: 'border-red-200', bg: 'bg-red-50/40' },
  }[status]

  return (
    <div className={`border rounded-xl p-4 ${statusConfig.border} ${statusConfig.bg} transition-all`}>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => count > 0 && setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{statusConfig.icon}</span>
          <div>
            <div className="font-semibold text-gray-900 text-sm">Sunright Tea Studio — {store.name}</div>
            <div className={`text-xs mt-0.5 ${status === 'ok' ? 'text-gray-400' : status === 'warn' ? 'text-yellow-700' : 'text-red-600'}`}>
              {statusConfig.label}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <Badge variant={status === 'critical' ? 'destructive' : 'outline'}
              className={`text-xs ${status === 'warn' ? 'border-yellow-300 text-yellow-700' : ''}`}>
              {count} 缺貨
            </Badge>
          )}
          {count > 0 && (
            <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {/* Expanded OOS list */}
      {expanded && count > 0 && (
        <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
          <p className="text-xs text-gray-500 mb-2">缺貨品項：</p>
          <div className="flex flex-wrap gap-2">
            {store.outOfStock.map(item => (
              <span key={item} className="text-xs px-2.5 py-1 bg-white border border-red-200 text-red-700 rounded-full">
                🚫 {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function InventoryPage() {
  const [filter, setFilter] = useState<'all' | 'oos'>('all')

  const totalOOS = STORES.reduce((s, st) => s + st.outOfStock.length, 0)
  const storesWithOOS = STORES.filter(st => st.outOfStock.length > 0).length

  const displayed = filter === 'oos'
    ? STORES.filter(st => st.outOfStock.length > 0)
    : STORES

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">📦 Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">全門市缺貨追蹤 · {STORES.length} 家門市</p>
        </div>
        <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
          ↻ Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={`border ${totalOOS > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500 mb-1">缺貨品項總數</div>
            <div className={`text-2xl font-bold ${totalOOS > 0 ? 'text-red-600' : 'text-gray-900'}`}>{totalOOS}</div>
            <div className="text-xs text-gray-400 mt-0.5">across all stores</div>
          </CardContent>
        </Card>
        <Card className={`border ${storesWithOOS > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100'}`}>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500 mb-1">缺貨門市數</div>
            <div className={`text-2xl font-bold ${storesWithOOS > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{storesWithOOS}</div>
            <div className="text-xs text-gray-400 mt-0.5">of {STORES.length} stores</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-100">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-gray-500 mb-1">最後更新</div>
            <div className="text-sm font-bold text-gray-700 leading-tight mt-1">{LAST_UPDATED}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'oos'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-4 py-1.5 rounded-full border transition ${
              filter === f
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {f === 'all' ? `全部（${STORES.length}）` : `只看缺貨（${storesWithOOS}）`}
          </button>
        ))}
      </div>

      {/* Store List */}
      <div className="space-y-2">
        {displayed.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-2">✅</div>
            <div className="font-medium">All stores fully stocked!</div>
          </div>
        ) : (
          displayed.map(store => <StoreCard key={store.name} store={store} />)
        )}
      </div>
    </div>
  )
}
