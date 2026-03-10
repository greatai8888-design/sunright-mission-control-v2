'use client'

export const dynamic = 'force-dynamic'

import { Card, CardContent } from '@/components/ui/card'

// ─── Mock data — replace with Supabase when table is ready ─
const OUT_OF_STOCK: { store: string; items: string[] }[] = [
  { store: 'Koreatown', items: ['Brown Sugar Boba Milk', 'Taro Latte'] },
  { store: 'Arcadia',   items: ['Cheese Foam Green Tea'] },
]

const LAST_UPDATED = '2026-03-09 17:30 PST'

export default function InventoryPage() {
  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">📦 Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Out-of-stock alerts · Updated {LAST_UPDATED}</p>
        </div>
        <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
          ↻ Refresh
        </button>
      </div>

      {/* Summary Card */}
      <Card className={`border ${OUT_OF_STOCK.length > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{OUT_OF_STOCK.length > 0 ? '⚠️' : '✅'}</span>
            <div>
              {OUT_OF_STOCK.length > 0 ? (
                <>
                  <div className="text-2xl font-bold text-red-600">{OUT_OF_STOCK.length} 家門市有缺貨品項</div>
                  <div className="text-sm text-red-500 mt-0.5">
                    共 {OUT_OF_STOCK.reduce((s, st) => s + st.items.length, 0)} 項缺貨
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">全部門市庫存正常</div>
                  <div className="text-sm text-green-500 mt-0.5">No out-of-stock items</div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OOS Store List */}
      {OUT_OF_STOCK.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">✅</div>
          <div className="font-medium">All stores fully stocked!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {OUT_OF_STOCK.map(st => (
            <div key={st.store} className="bg-white border border-yellow-200 rounded-xl p-4 shadow-sm">
              {/* Store name */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚠️</span>
                <span className="font-semibold text-gray-900">Sunright Tea Studio — {st.store}</span>
                <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  {st.items.length} 項缺貨
                </span>
              </div>
              {/* Items */}
              <div className="space-y-1.5 pl-7">
                {st.items.map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-red-500">❌</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
