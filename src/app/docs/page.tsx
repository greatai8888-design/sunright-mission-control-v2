'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'

const DOCS = [
  {
    section: '🏗 系統架構',
    items: [
      {
        title: 'Mission Control 技術架構',
        content: `**Frontend:** Next.js 16 + Tailwind CSS 4  
**Backend:** Supabase (PostgreSQL + Realtime + Auth)  
**Hosting:** Netlify  
**Auth:** Supabase Auth (cookie-based sessions, middleware protection)  
**API Routes:** Next.js server-side API routes (使用 service_role key)

**主要 Tables:**
- \`agents\` — 12 位 AI 員工的狀態
- \`tasks\` — Kanban 任務（6 欄：Backlog/ToDo/Pending/Ongoing/Review/Done）
- \`projects\` — 專案列表
- \`reviews\` — Google Maps + Yelp 評論
- \`knowledge_entries\` — Second Brain 知識庫
- \`market_snapshots\` — 股票/VIX 市場快照
- \`competitors\` + \`competitor_snapshots\` — 競品 IG 分析
- \`competitor_latest\` — 最新競品快照（View）`,
      },
      {
        title: 'Supabase 資料庫',
        content: `**Project Ref:** \`jmjfwvjfzwscrkxualgo\`  
**URL:** \`https://jmjfwvjfzwscrkxualgo.supabase.co\`  

**RLS 設定：**
- Anon Key → READ ONLY（只能讀）
- Service Role Key → ALL（完整 CRUD）

**Realtime：** agents 表格啟用 UPDATE 事件訂閱（Dashboard 即時更新）`,
      },
    ],
  },
  {
    section: '🤖 AI 員工',
    items: [
      {
        title: '12 位 AI 員工列表',
        content: `| Agent | Emoji | 職責 | Telegram Topic |
|-------|-------|------|----------------|
| Orion | 🧭 | Strategy & Operations | 134 |
| Volt  | 💻 | Software & Systems     | 4   |
| Mira  | 📣 | Marketing              | 3   |
| Iris  | 📊 | Analytics              | 5   |
| Kai   | 📉 | Trading                | 6   |
| Lume  | 🧪 | R&D                    | 7   |
| Rex   | 🔍 | QA & Testing           | 99  |
| Cleo  | 🛎 | Customer Service       | 159 |
| Nova  | 👥 | HR                     | 72  |
| Aria  | 🎨 | Design                 | 382 |
| Quinn | 🖌 | Visual Design          | 417 |
| Coda  | 🎬 | Video                  | 439 |`,
      },
      {
        title: 'A2A Gateway（Agent-to-Agent）',
        content: `OpenClaw 的 A2A 功能允許 agents 直接互相通訊，不需要 Soma 手動觸發。

**設定：**
\`\`\`json
{
  "tools": {
    "agentToAgent": {
      "enabled": true,
      "allow": ["main", "orion", "volt", "mira", "iris", "kai", ...]
    }
  }
}
\`\`\`

**使用方式：**
- Orion → \`sessions_send(label="volt", message="...")\`
- Volt → \`sessions_send(label="orion", message="...")\`

**啟用日期：** 2026-03-09`,
      },
    ],
  },
  {
    section: '📅 Cron Jobs',
    items: [
      {
        title: '排程任務清單',
        content: `| Job | 時間 | 頻率 |
|-----|------|------|
| 🌙 系統回顧 | 2:00 AM | 每日 |
| 📉 Kai 開盤情報 | 6:30 AM | 週一至五 |
| 🗺️ Google Maps 掃描 | 7:00 AM | 每日 |
| ⭐ Yelp 掃描 | 7:30 AM | 每日 |
| 🔍 Rex 健康檢查 | 8:00 AM | 每日 |
| ☀️ 每日晨報 | 8:00 AM | 每日 |
| 🛎 Cleo 評論監控 | 9:00 AM | 每日 |
| 📊 Yelp 週報 | 9:00 AM | 週一 |
| 📊 Iris 業務週報 | 6:00 PM | 週五 |
| 📣 Mira 週內容規劃 | 8:00 PM | 週日 |
| 🔐 安全審計 | 9:00 PM | 週日 |
| 🧭 全團隊週會 | 9:00 PM | 週日 |
| 🔄 MC 資料推送 | 每 30 分鐘 | 高頻 |
| 🍞 Ginza 庫存監控 | 每 20 分鐘 | 12PM-11PM |`,
      },
    ],
  },
  {
    section: '🔐 安全規範',
    items: [
      {
        title: '安全規定（強制執行）',
        content: `以下規定由 Soma 在 2026-03-08 安全審計後設立，**所有 AI 員工必須遵守：**

**🚫 禁止：**
- 使用 localtunnel / ngrok / 任何公網隧道工具
- 啟動無認證的 HTTP 伺服器（如 python -m http.server）
- 本地服務綁定 \`0.0.0.0\`

**✅ 必須：**
- 本地服務只能綁定 \`127.0.0.1\`
- 任務完成後立即關閉所有臨時服務
- API Keys 只能存入環境變數，不得明文寫入程式碼
- 對外暴露的 port 必須先告知 Orion，由 Soma 批准

**背景：** 2026-03-08 發現 localtunnel 和多個 HTTP 伺服器在後台運行。`,
      },
      {
        title: 'API Keys 管理',
        content: `所有 API Keys 存放於 Netlify Environment Variables：

| Key | 用途 |
|-----|------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 連線 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 公開讀取 |
| SUPABASE_SERVICE_ROLE_KEY | Supabase 完整存取（server-only）|
| GOOGLE_PLACES_API_KEY | Google Maps 評論 |
| YELP_API_KEY | Yelp 評論 |
| POLYGON_API_KEY | 股票數據備用 |

**禁止將任何 key 明文提交到 Git**`,
      },
    ],
  },
  {
    section: '🛠 開發指南',
    items: [
      {
        title: '新增頁面流程',
        content: `1. 在 \`src/app/<page-name>/page.tsx\` 建立頁面
2. 加上 \`'use client'\` 和 \`export const dynamic = 'force-dynamic'\`
3. 在 \`src/components/layout/AppSidebar.tsx\` 的 \`navItems\` 陣列新增路由
4. 如需寫入 Supabase，建立 \`src/app/api/<page-name>/route.ts\`（使用 service_role key）
5. Build 確認（\`npm run build\`）
6. Push 到 main → Netlify 自動部署（約 2-3 分鐘）`,
      },
      {
        title: 'Agent Status API',
        content: `Agents 可透過 API 更新自己的狀態，讓 Dashboard 即時顯示。

\`\`\`bash
# 任務開始
PATCH https://magenta-banoffee-423ec9.netlify.app/api/agents/volt/status
Body: { "status": "working" }

# 任務完成  
PATCH https://magenta-banoffee-423ec9.netlify.app/api/agents/volt/status
Body: { "status": "idle" }
\`\`\`

**Header 需要：**
\`Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>\``,
      },
    ],
  },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState(DOCS[0].section)
  const [expanded, setExpanded] = useState<string | null>(null)

  const currentDocs = DOCS.find(d => d.section === activeSection)

  function renderContent(content: string) {
    // Simple markdown-like rendering
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-gray-800 mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>
      }
      if (line.startsWith('| ')) {
        // Table row
        const cells = line.split('|').filter(c => c.trim() && c.trim() !== '---')
        if (cells.length === 0 || line.includes('---')) return null
        const isHeader = i > 0 && content.split('\n')[i - 1].includes('---') || 
                         content.split('\n')[i + 1]?.includes('---')
        return (
          <div key={i} className={`flex gap-0 ${isHeader ? 'font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-1' : 'text-gray-600'}`}>
            {cells.map((cell, ci) => (
              <div key={ci} className={`flex-1 text-xs py-0.5 ${ci === 0 ? 'font-medium' : ''}`}>
                {cell.trim()}
              </div>
            ))}
          </div>
        )
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="text-sm text-gray-600 ml-4 list-disc">{line.slice(2)}</li>
      }
      if (line.startsWith('```')) return null
      if (line.trim() === '') return <div key={i} className="h-1" />
      if (line.startsWith('#')) {
        return <p key={i} className="font-semibold text-gray-700 mt-2">{line.replace(/^#+\s/, '')}</p>
      }
      return <p key={i} className="text-sm text-gray-600 leading-relaxed">{line.replace(/\*\*/g, '')}</p>
    }).filter(Boolean)
  }

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-0px)] overflow-hidden">
      {/* Section tabs — horizontal on mobile, vertical sidebar on desktop */}
      <div className="md:w-52 border-b md:border-b-0 md:border-r border-gray-100 bg-white flex-shrink-0 overflow-x-auto md:overflow-y-auto pt-4 md:pt-6 pb-2 md:pb-6">
        <div className="flex md:flex-col gap-1 px-3 md:px-0 min-w-max md:min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-4 mb-2 hidden md:block">文件目錄</p>
        {DOCS.map(d => (
          <button
            key={d.section}
            onClick={() => setActiveSection(d.section)}
            className={`whitespace-nowrap md:w-full text-left px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-lg md:rounded-none transition ${
              activeSection === d.section
                ? 'text-gray-900 bg-gray-100 md:bg-gray-50 md:border-r-2 md:border-gray-900'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {d.section}
          </button>
        ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{activeSection}</h1>

        <div className="space-y-3 max-w-3xl">
          {currentDocs?.items.map(item => (
            <div
              key={item.title}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                onClick={() => setExpanded(expanded === item.title ? null : item.title)}
              >
                <span className="font-semibold text-gray-900 text-sm">{item.title}</span>
                <span className="text-gray-400 text-lg">{expanded === item.title ? '−' : '+'}</span>
              </button>

              {expanded === item.title && (
                <div className="px-5 pb-5 border-t border-gray-50">
                  <div className="pt-4 space-y-0.5 font-mono-free">
                    {renderContent(item.content)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
