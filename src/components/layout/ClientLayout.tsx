'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { AppSidebar } from './AppSidebar'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Login page: no sidebar, full-screen layout
  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <>
      {/* Mobile overlay — appears behind sidebar when open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — uses data-sidebar attribute for CSS-driven responsive behaviour */}
      <div
        data-sidebar={sidebarOpen ? 'open' : 'closed'}
        className="fixed left-0 top-0 h-screen z-40 w-60"
      >
        <AppSidebar />
      </div>

      {/* Hamburger button — only visible on mobile */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden bg-white border border-gray-200 rounded-xl shadow-sm p-2.5 active:scale-95 transition"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="開啟選單"
      >
        {sidebarOpen ? (
          /* X icon when open */
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="3" x2="15" y2="15"/>
            <line x1="15" y1="3" x2="3" y2="15"/>
          </svg>
        ) : (
          /* Hamburger icon when closed */
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="2" y1="4.5" x2="16" y2="4.5"/>
            <line x1="2" y1="9" x2="16" y2="9"/>
            <line x1="2" y1="13.5" x2="16" y2="13.5"/>
          </svg>
        )}
      </button>

      {/* Main content area */}
      <main data-main-content className="ml-60 min-h-screen">
        {/* Spacer so content doesn't sit under hamburger button on mobile */}
        <div className="h-14 md:hidden" />
        {children}
      </main>
    </>
  )
}
