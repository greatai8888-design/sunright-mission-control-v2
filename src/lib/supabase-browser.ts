import { createBrowserClient } from '@supabase/ssr'

// Browser client using cookies (required for middleware auth to work)
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
