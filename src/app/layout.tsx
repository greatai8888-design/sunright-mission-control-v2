import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppSidebar } from '@/components/layout/AppSidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mission Control ✦ Sunright AI',
  description: 'Sunright Tea Studio AI Employee Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <AppSidebar />
        <main className="ml-60 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
