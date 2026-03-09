'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const navItems = [
  { href: '/',           label: 'Dashboard',     icon: '📊' },
  { href: '/kanban',     label: 'Kanban',         icon: '🗂' },
  { href: '/calendar',   label: 'Calendar',       icon: '📅' },
  { href: '/reviews',    label: 'Reviews',        icon: '⭐' },
  { href: '/analytics',  label: 'Analytics',      icon: '📊' },
  { href: '/stocks',     label: 'Stocks',         icon: '📈' },
  { href: '/brain',      label: 'Second Brain',   icon: '🧠' },
  { href: '/docs',       label: 'Docs',           icon: '📝' },
  { href: '/projects',   label: 'Projects',       icon: '🗂' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">✦</span>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight whitespace-nowrap">Mission Control</div>
            <div className="text-xs text-gray-400 whitespace-nowrap">Sunright AI Team</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-2 mb-2">主要功能</p>
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="truncate">Supabase 已連線</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition"
        >
          <span>🚪</span>
          <span>登出</span>
        </button>
      </div>
    </aside>
  )
}
