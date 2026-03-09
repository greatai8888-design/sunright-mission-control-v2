'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Task, Agent } from '@/types'

const STATUS_ORDER = ['inprogress', 'review', 'todo', 'pending', 'backlog', 'done']
const STATUS_LABEL: Record<string, string> = {
  inprogress: '⚡ 進行中',
  review:     '🔍 Review',
  todo:       '📌 To Do',
  pending:    '⏳ Pending',
  backlog:    '📋 Backlog',
  done:       '✅ Done',
}
const STATUS_COLOR: Record<string, string> = {
  inprogress: 'text-blue-600 bg-blue-50 border-blue-200',
  review:     'text-yellow-600 bg-yellow-50 border-yellow-200',
  todo:       'text-indigo-600 bg-indigo-50 border-indigo-200',
  pending:    'text-orange-500 bg-orange-50 border-orange-200',
  backlog:    'text-gray-500 bg-gray-50 border-gray-200',
  done:       'text-green-600 bg-green-50 border-green-200',
}
const PRIORITY_COLOR: Record<string, string> = {
  high:   'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low:    'text-gray-500 bg-gray-50 border-gray-200',
}

interface Props {
  agent: Agent | null
  onClose: () => void
}

export function AgentTaskDrawer({ agent, onClose }: Props) {
  const [tasks,   setTasks]   = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!agent) return
    setLoading(true)
    // Query by single assignee field (assignees[] col needs DB migration first)
    supabase
      .from('tasks')
      .select('*')
      .eq('assignee', agent.name)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTasks(data || [])
        setLoading(false)
      })
  }, [agent?.id])

  if (!agent) return null

  const grouped = STATUS_ORDER
    .map(status => ({ status, label: STATUS_LABEL[status], items: tasks.filter(t => t.status === status) }))
    .filter(g => g.items.length > 0)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer:
          Mobile  → bottom sheet, slides up, max 80vh
          Desktop → right panel, full height, 400px wide */}
      <div className="
        fixed z-50 bg-white shadow-2xl flex flex-col
        inset-x-0 bottom-0 max-h-[82vh] rounded-t-2xl
        md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:w-[400px] md:max-h-full md:rounded-none
        animate-in slide-in-from-bottom-4 md:slide-in-from-right-4
      ">
        {/* Drag handle (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none" style={{ fontFamily: 'initial' }}>
              {agent.emoji}
            </span>
            <div>
              <div className="font-bold text-gray-900 text-base">{agent.name} 的任務</div>
              <div className="text-xs text-gray-500">{agent.role}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="space-y-2 pt-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">📭</div>
              <div className="font-medium text-gray-600">目前沒有任務</div>
              <p className="text-xs text-gray-400 mt-1">Kanban 上尚未指派任務給 {agent.name}</p>
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.status}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500">{group.label}</span>
                  <span className="text-xs text-gray-300 bg-gray-100 px-1.5 rounded-full">{group.items.length}</span>
                </div>
                <div className="space-y-2">
                  {group.items.map(task => (
                    <Link
                      href="/kanban"
                      key={task.id}
                      onClick={onClose}
                      className="block bg-white border border-gray-100 rounded-xl p-3.5 hover:border-gray-200 hover:shadow-sm transition group"
                    >
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition leading-snug">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium}`}>
                          {task.priority === 'high' ? '🔴 高' : task.priority === 'medium' ? '🟡 中' : '🟢 低'}
                        </span>
                        {task.tag && (
                          <span className="text-[11px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100">
                            {task.tag}
                          </span>
                        )}
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ml-auto ${STATUS_COLOR[task.status] || ''}`}>
                          {STATUS_LABEL[task.status]}
                        </span>
                      </div>
                      {task.deadline && (
                        <div className="text-[11px] text-gray-400 mt-1.5">
                          📅 截止 {new Date(task.deadline).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — link to Kanban */}
        <div className="px-5 py-4 border-t border-gray-100">
          <Link
            href="/kanban"
            onClick={onClose}
            className="block w-full text-center text-sm font-medium text-gray-600 hover:text-gray-900 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            在 Kanban 查看全部任務 →
          </Link>
        </div>
      </div>
    </>
  )
}
