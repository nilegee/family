import { writable } from 'svelte/store'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../supabase'

export const session = writable<Session | null>(null)
export const user = writable<User | null>(null)

// Initialize session on app load
supabase.auth.getSession().then(({ data }) => {
  session.set(data.session)
  user.set(data.session?.user ?? null)
})

// Listen for auth changes
supabase.auth.onAuthStateChange((event, newSession) => {
  session.set(newSession)
  user.set(newSession?.user ?? null)
})