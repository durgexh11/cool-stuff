import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key)
if (!isConfigured) console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')

// Only the public anon key lives in the browser. Security is enforced by RLS in the database.
export const supabase = createClient(url || 'http://localhost:54321', key || 'missing-key')