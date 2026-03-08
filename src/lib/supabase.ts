import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — only created in the browser, never at build time
let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Build-time / SSR: return a no-op placeholder (never actually queried,
    // since all data fetching is in useEffect inside 'use client' components)
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getSupabase() as any)[prop]
  },
})
