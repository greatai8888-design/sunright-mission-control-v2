export type TaskStatus = 'backlog' | 'todo' | 'pending' | 'inprogress' | 'review' | 'done' | 'archived'
export type Priority = 'low' | 'medium' | 'high'
export type AgentStatus = 'active' | 'inactive' | 'idle' | 'working' | 'offline'

export interface Agent {
  id: string
  name: string
  emoji: string
  role: string
  status: AgentStatus
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  assignee?: string
  assignees?: string[]
  tag?: string
  position: number
  project_id?: string
  deadline?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  emoji?: string
  status: 'active' | 'paused' | 'done'
  owner?: string
  created_at: string
  updated_at: string
}

export interface CronJob {
  id: string
  name: string
  emoji?: string
  category: string
  description?: string
  schedule_type: 'daily' | 'weekly' | 'interval' | 'hourly' | 'frequent'
  schedule_hour?: number
  schedule_minute?: number
  schedule_day?: string
  start_hour?: number
  end_hour?: number
  high_freq: boolean
  enabled: boolean
  created_at: string
}

export interface KnowledgeEntry {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  source?: string
  created_at: string
  updated_at: string
}

export interface Competitor {
  id: string
  handle: string
  name?: string
  notes?: string
  platform: string
  active: boolean
}

export interface CompetitorSnapshot {
  id: string
  competitor_id: string
  followers?: number
  avg_likes?: number
  avg_comments?: number
  posts_per_week?: number
  engagement_rate?: number
  last_post_date?: string
  scraped_at: string
  // from view
  handle?: string
  name?: string
  notes?: string
}

export interface Review {
  id: string
  platform: 'google_maps' | 'yelp'
  location?: string
  author?: string
  rating: number
  content?: string
  review_date?: string
  is_negative: boolean
  scraped_at: string
}

export interface MarketSnapshot {
  id: string
  symbol: string
  price?: number
  change_pct?: number
  vix?: number
  market_status?: string
  captured_at: string
}

export interface MonitoringStatus {
  id: string
  service: string
  status: 'ok' | 'warning' | 'error' | 'unknown'
  last_checked?: string
  details?: Record<string, unknown>
  updated_at: string
}

export interface DashboardStats {
  tasks: { todo: number; inprogress: number; review: number; done: number; total: number; backlog: number; pending: number }
  agents: { total: number; active: number }
}
