import { writable, derived } from 'svelte/store'
import { supabase } from '../supabase'
import type { Database } from '../supabase'
import { session } from './sessionStore'

export interface Profile {
  user_id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: string | null
  dob: string | null
  created_at: string | null
  updated_at: string | null
}

class ProfileStore {
  private store = writable<Profile[]>([])
  private profiles: Profile[] = []
  private loadingStore = writable(false)
  private errorStore = writable<string | null>(null)

  constructor() {
    // Auto-load profiles when session becomes available
    session.subscribe(($session) => {
      if ($session) {
        this.loadProfiles()
      } else {
        this.clear()
      }
    })
  }

  subscribe = this.store.subscribe

  get loading() {
    return this.loadingStore
  }

  get error() {
    return this.errorStore
  }

  async loadProfiles() {
    this.loadingStore.set(true)
    this.errorStore.set(null)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading profiles:', error)
        this.errorStore.set(error.message)
        return
      }

      this.profiles = data || []
      this.store.set(this.profiles)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profiles'
      this.errorStore.set(errorMessage)
      console.error('Error loading profiles:', err)
    } finally {
      this.loadingStore.set(false)
    }
  }

  async loadProfile(email: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (error || !data) {
        // Don't log as error - missing profile is expected
        return null
      }

      // Update the local store if profile was found
      const existingIndex = this.profiles.findIndex(p => p.email === email)
      if (existingIndex >= 0) {
        this.profiles[existingIndex] = data
      } else {
        this.profiles.push(data)
      }
      this.store.set(this.profiles)

      return data
    } catch (err) {
      // Never throw - return null on any error
      console.error('Error loading profile for email:', email, err)
      return null
    }
  }

  async createProfile(profileData: Omit<Profile, 'created_at' | 'updated_at'>) {
    this.errorStore.set(null)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData as Database['public']['Tables']['profiles']['Insert'])
        .select()
        .maybeSingle()

      if (error) {
        const errorMessage = error.message || 'Failed to create profile'
        this.errorStore.set(errorMessage)
        console.error('Error creating profile:', error)
        return null
      }

      if (data) {
        this.profiles = [data, ...this.profiles]
        this.store.set(this.profiles)
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create profile'
      this.errorStore.set(errorMessage)
      console.error('Error creating profile:', err)
      return null
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    this.errorStore.set(null)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates as Database['public']['Tables']['profiles']['Update'])
        .eq('user_id', userId)
        .select()
        .maybeSingle()

      if (error) {
        const errorMessage = error.message || 'Failed to update profile'
        this.errorStore.set(errorMessage)
        console.error('Error updating profile:', error)
        return null
      }

      if (data) {
        this.profiles = this.profiles.map(profile =>
          profile.user_id === userId ? data : profile
        )
        this.store.set(this.profiles)
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      this.errorStore.set(errorMessage)
      console.error('Error updating profile:', err)
      return null
    }
  }

  findByEmail(email: string): Profile | undefined {
    return this.profiles.find(profile => profile.email === email)
  }

  findById(userId: string): Profile | undefined {
    return this.profiles.find(profile => profile.user_id === userId)
  }

  getDisplayName(email: string): string {
    const profile = this.findByEmail(email)
    return profile?.display_name || email.split('@')[0]
  }

  getAvatarUrl(email: string): string | null {
    const profile = this.findByEmail(email)
    return profile?.avatar_url || null
  }

  clear() {
    this.profiles = []
    this.store.set(this.profiles)
    this.errorStore.set(null)
  }
}

export const profileStore = new ProfileStore()

// Derived stores for common use cases
export const currentUserProfile = derived(
  [profileStore, session],
  ([$profiles, $session]) => {
    if (!$session?.user?.email) return null
    return $profiles.find(profile => profile.email === $session.user.email) || null
  }
)

export const parentProfiles = derived(
  profileStore,
  ($profiles) => $profiles.filter(profile => profile.role === 'parent')
)

export const childProfiles = derived(
  profileStore,
  ($profiles) => $profiles.filter(profile => profile.role === 'child')
)