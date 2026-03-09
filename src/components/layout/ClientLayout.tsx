'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { AppSidebar } from './AppSidebar'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Login page: no sidebar, full-screen
  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div
        className={`fixed left-0 top-0 h-screen z-40 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <AppSidebar />
      </div>

      {/* Hamburger button — mobile only */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm active:scale-95 transition"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="開啟選單"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="2" y1="4.5" x2="16" y2="4.5"/>
          <line x1="2" y1="9" x2="16" y2="9"/>
          <line x1="2" y1="13.5" x2="16" y2="13.5"/>
        </svg>
      </button>

      {/* Main content */}
      <main className="md:ml-60 min-h-screen">
        {/* Mobile top spacer (so content isn't under hamburger button) */}
        <div className="md:hidden h-14" />
        {children}
      </main>
    </>
  )
}
