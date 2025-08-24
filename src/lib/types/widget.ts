import type { Component } from 'svelte'
import type { Session } from '@supabase/supabase-js'
import type { Database } from '../supabase'

export interface WidgetProps {
  session: Session | null
  profiles: Database['public']['Tables']['profiles']['Row'][]
  items: Database['public']['Tables']['items']['Row'][]
  interactions: Database['public']['Tables']['interactions']['Row'][]
  widget?: WidgetConfig
}

export interface WidgetConfig {
  id: string
  name: string
  component: Component<WidgetProps> | (() => Promise<{ default: Component<WidgetProps> }>)
  priority: number
  enabled: boolean
  pinned?: boolean
  lastViewed?: number
  viewCount?: number
  interactionCount?: number
  engagementScore?: number
}

export interface WidgetRegistry {
  [key: string]: WidgetConfig
}