import { systemRegistry } from './systemRegistry'
import { customRegistry } from './customRegistry'
import type { WidgetRegistry, WidgetConfig } from './types/widget'

class WidgetRegistryManager {
  private registry: WidgetRegistry = { ...systemRegistry, ...customRegistry }
  private preferences: { [key: string]: Partial<WidgetConfig> } = {}

  constructor() {
    this.loadPreferences()
  }

  getAll(): WidgetConfig[] {
    return Object.values(this.registry).map(widget => ({
      ...widget,
      ...this.preferences[widget.id]
    }))
  }

  getEnabled(): WidgetConfig[] {
    return this.getAll().filter(widget => widget.enabled)
  }

  getSorted(): WidgetConfig[] {
    const widgets = this.getEnabled()
    
    // First, sort by pinned status, then by engagement score, then by priority
    return widgets.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      
      // Usage-based ordering with exponential decay
      const aScore = this.calculateEngagementScore(a)
      const bScore = this.calculateEngagementScore(b)
      
      if (aScore !== bScore) return bScore - aScore
      
      return b.priority - a.priority
    })
  }

  private calculateEngagementScore(widget: WidgetConfig): number {
    const now = Date.now()
    const halfLife = 3 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
    
    let score = widget.priority || 0
    
    // Add view score with exponential decay
    if (widget.lastViewed && widget.viewCount) {
      const timeDiff = now - widget.lastViewed
      const decayFactor = Math.pow(0.5, timeDiff / halfLife)
      score += (widget.viewCount * 10) * decayFactor
    }
    
    // Add interaction score
    if (widget.interactionCount) {
      score += widget.interactionCount * 50
    }
    
    return score
  }

  updatePreference(widgetId: string, updates: Partial<WidgetConfig>) {
    this.preferences[widgetId] = {
      ...this.preferences[widgetId],
      ...updates
    }
    this.savePreferences()
  }

  recordView(widgetId: string) {
    const current = this.preferences[widgetId] || {}
    this.updatePreference(widgetId, {
      lastViewed: Date.now(),
      viewCount: (current.viewCount || 0) + 1
    })
  }

  recordInteraction(widgetId: string) {
    const current = this.preferences[widgetId] || {}
    this.updatePreference(widgetId, {
      interactionCount: (current.interactionCount || 0) + 1
    })
  }

  private loadPreferences() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('widgetPreferences')
      if (stored) {
        try {
          this.preferences = JSON.parse(stored)
        } catch (e) {
          console.warn('Failed to load widget preferences:', e)
        }
      }
    }
  }

  private savePreferences() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('widgetPreferences', JSON.stringify(this.preferences))
    }
  }
}

export const widgetRegistry = new WidgetRegistryManager()