import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Supabase 客户端单例：底层封装仅供 '@/lib/adapters/db' 使用。
// 未配置环境变量时不创建客户端，由 db.js 自动切换到 mock 数据。
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null
