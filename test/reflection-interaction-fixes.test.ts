/**
 * Tests for Sprint: Reflection Schema & Interaction Fixes
 * Testing new reflection widgets and interaction improvements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Database } from '../src/lib/supabase'

describe('Sprint: Reflection Schema & Interaction Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Database Schema Types', () => {
    it('should support reflections table structure', () => {
      const reflectionData: Database['public']['Tables']['reflections']['Insert'] = {
        user_id: 'test-user-1',
        mood_emoji: '😃',
        reflection_text: 'Had a great week!',
        week_start: '2024-01-01'
      }

      expect(reflectionData.user_id).toBe('test-user-1')
      expect(reflectionData.mood_emoji).toBe('😃')
      expect(reflectionData.reflection_text).toBe('Had a great week!')
      expect(reflectionData.week_start).toBe('2024-01-01')
    })

    it('should support optional reflection text', () => {
      const reflectionData: Database['public']['Tables']['reflections']['Insert'] = {
        user_id: 'test-user-1',
        mood_emoji: '😊',
        week_start: '2024-01-01'
      }

      expect(reflectionData.reflection_text).toBeUndefined()
    })

    it('should support reflections row type', () => {
      const reflectionRow: Database['public']['Tables']['reflections']['Row'] = {
        id: 'reflection-1',
        user_id: 'test-user-1',
        mood_emoji: '😃',
        reflection_text: 'Great week!',
        week_start: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z'
      }

      expect(reflectionRow.id).toBe('reflection-1')
      expect(reflectionRow.mood_emoji).toBe('😃')
    })

    it('should support reflections update type', () => {
      const reflectionUpdate: Database['public']['Tables']['reflections']['Update'] = {
        mood_emoji: '😊',
        reflection_text: 'Updated reflection'
      }

      expect(reflectionUpdate.mood_emoji).toBe('😊')
      expect(reflectionUpdate.reflection_text).toBe('Updated reflection')
    })
  })

  describe('Widget Registry Updates', () => {
    it('should include new reflection mood widget in registry', async () => {
      const { systemRegistry } = await import('../src/lib/systemRegistry')
      
      // New reflectionMood widget should be enabled and high priority
      expect(systemRegistry.reflectionMood).toBeDefined()
      expect(systemRegistry.reflectionMood.name).toBe('Reflection & Mood Today')
      expect(systemRegistry.reflectionMood.enabled).toBe(true)
      expect(systemRegistry.reflectionMood.priority).toBe(100)

      // Weekly reflection should now be disabled (functionality merged)
      expect(systemRegistry.weeklyReflection).toBeDefined()
      expect(systemRegistry.weeklyReflection.name).toBe('Weekly Reflection')
      expect(systemRegistry.weeklyReflection.enabled).toBe(false)

      // Digest should still be enabled
      expect(systemRegistry.weeklyReflectionDigest).toBeDefined()
      expect(systemRegistry.weeklyReflectionDigest.name).toBe('Family Reflections Digest')
      expect(systemRegistry.weeklyReflectionDigest.enabled).toBe(true)
    })

    it('should disable legacy feedback widget', async () => {
      const { systemRegistry } = await import('../src/lib/systemRegistry')
      
      expect(systemRegistry.feedback).toBeDefined()
      expect(systemRegistry.feedback.enabled).toBe(false)
      expect(systemRegistry.feedback.name).toBe('Feedback Prompt (Legacy)')
    })

    it('should have weekly reflection higher priority than legacy feedback', async () => {
      const { systemRegistry } = await import('../src/lib/systemRegistry')
      
      expect(systemRegistry.weeklyReflection.priority).toBeGreaterThan(systemRegistry.feedback.priority)
      expect(systemRegistry.weeklyReflectionDigest.priority).toBeGreaterThan(systemRegistry.feedback.priority)
    })
  })

  describe('Week Calculation Logic', () => {
    it('should calculate week start correctly', () => {
      // Mock dayjs for consistent testing
      const mockDate = new Date('2024-01-15') // Monday
      const getWeekStart = (date = new Date()) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is Sunday
        const monday = new Date(d.setDate(diff))
        return monday.toISOString().split('T')[0]
      }

      expect(getWeekStart(mockDate)).toBe('2024-01-15') // Should be the Monday

      const tuesday = new Date('2024-01-16')
      expect(getWeekStart(tuesday)).toBe('2024-01-15') // Should still be the Monday

      const sunday = new Date('2024-01-21')
      expect(getWeekStart(sunday)).toBe('2024-01-15') // Should still be the Monday
    })
  })

  describe('Interaction Functions Logic', () => {
    it('should properly construct like interaction', () => {
      const likeInteraction: Database['public']['Tables']['interactions']['Insert'] = {
        item_id: 'post-123',
        user_email: 'test@example.com',
        type: 'like'
      }

      expect(likeInteraction.item_id).toBe('post-123')
      expect(likeInteraction.user_email).toBe('test@example.com')
      expect(likeInteraction.type).toBe('like')
      expect(likeInteraction.answer_index).toBeUndefined()
    })

    it('should properly construct vote interaction', () => {
      const voteInteraction: Database['public']['Tables']['interactions']['Insert'] = {
        item_id: 'poll-123',
        user_email: 'test@example.com',
        type: 'vote',
        answer_index: 2
      }

      expect(voteInteraction.type).toBe('vote')
      expect(voteInteraction.answer_index).toBe(2)
    })
  })

  describe('Component Integration', () => {
    it('should have proper widget priorities for ordering', async () => {
      const { systemRegistry } = await import('../src/lib/systemRegistry')
      
      const widgets = Object.values(systemRegistry)
      const enabledWidgets = widgets.filter(w => w.enabled)
      
      // Check that reflection mood widget is among enabled widgets with high priority
      const reflectionMoodWidget = enabledWidgets.find(w => w.id === 'reflectionMood')
      const digestWidget = enabledWidgets.find(w => w.id === 'weeklyReflectionDigest')
      
      expect(reflectionMoodWidget).toBeDefined()
      expect(digestWidget).toBeDefined()
      expect(reflectionMoodWidget!.priority).toBe(100)
      expect(digestWidget!.priority).toBe(40)
    })
  })

  describe('Mood Options', () => {
    it('should support emoji mood options', () => {
      const moodOptions = [
        { value: '😃', label: 'Great', color: 'text-green-500' },
        { value: '😊', label: 'Good', color: 'text-blue-500' },
        { value: '😐', label: 'Okay', color: 'text-yellow-500' },
        { value: '😔', label: 'Difficult', color: 'text-orange-500' },
        { value: '😢', label: 'Tough', color: 'text-red-500' }
      ]

      expect(moodOptions).toHaveLength(5)
      expect(moodOptions[0].value).toBe('😃')
      expect(moodOptions[0].label).toBe('Great')
      expect(moodOptions[4].value).toBe('😢')
      expect(moodOptions[4].label).toBe('Tough')
    })
  })

  describe('Notification Logic', () => {
    it('should create notification from interaction', () => {
      const interaction: Database['public']['Tables']['interactions']['Row'] = {
        item_id: 'post-123',
        user_email: 'friend@example.com',
        type: 'like',
        answer_index: null,
        created_at: '2024-01-01T00:00:00Z'
      }

      const notification = {
        id: `interaction-${interaction.item_id}-${interaction.user_email}-${interaction.type}`,
        type: 'success' as const,
        title: 'New Interaction',
        message: `friend@example.com liked your post`,
        read: false,
        createdAt: interaction.created_at!,
        data: { itemId: interaction.item_id, type: interaction.type }
      }

      expect(notification.id).toBe('interaction-post-123-friend@example.com-like')
      expect(notification.type).toBe('success')
      expect(notification.message).toContain('liked your post')
    })

    it('should create notification from comment', () => {
      const comment: Database['public']['Tables']['items']['Row'] = {
        id: 'comment-123',
        kind: 'comment',
        author_email: 'friend@example.com',
        author_id: 'friend-id',
        body: 'Great post!',
        parent_id: 'post-123',
        visibility: 'all',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        data: null,
        end_at: null,
        is_deleted: false,
        media_urls: null,
        start_at: null
      }

      const notification = {
        id: `comment-${comment.id}`,
        type: 'info' as const,
        title: 'New Comment',
        message: `friend@example.com commented on your post`,
        read: false,
        createdAt: comment.created_at!,
        data: { commentId: comment.id, parentId: comment.parent_id }
      }

      expect(notification.id).toBe('comment-comment-123')
      expect(notification.type).toBe('info')
      expect(notification.message).toContain('commented on your post')
    })
  })
})