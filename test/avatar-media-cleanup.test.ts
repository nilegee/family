import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Avatar Upload and Media Cleanup Features', () => {
  describe('Avatar Upload Overwrite Fix', () => {
    it('should use consistent filename for avatar uploads to enable overwriting', () => {
      const profilePagePath = join(process.cwd(), 'src/routes/profile/+page.svelte')
      const profilePageContent = readFileSync(profilePagePath, 'utf-8')
      
      // Verify that avatar uploads use consistent filename pattern
      expect(profilePageContent).toContain('avatars/${$user?.id}-avatar.png')
      
      // Should not use timestamp-based filenames that create duplicates
      expect(profilePageContent).not.toContain('${Date.now()}-avatar')
      
      // Should still use upsert for overwriting
      expect(profilePageContent).toContain('{ upsert: true }')
    })

    it('should use notification system instead of alerts for better UX', () => {
      const profilePagePath = join(process.cwd(), 'src/routes/profile/+page.svelte')
      const profilePageContent = readFileSync(profilePagePath, 'utf-8')
      
      // Should import notification store
      expect(profilePageContent).toContain("import { notificationStore } from '$lib/stores/notificationStore'")
      
      // Should use notifications instead of alerts
      expect(profilePageContent).toContain('notificationStore.add({')
      expect(profilePageContent).toContain("type: 'success'")
      expect(profilePageContent).toContain("type: 'error'")
      
      // Should not use alert() calls
      expect(profilePageContent).not.toContain('alert(')
    })

    it('should provide settings access for parents in profile page', () => {
      const profilePagePath = join(process.cwd(), 'src/routes/profile/+page.svelte')
      const profilePageContent = readFileSync(profilePagePath, 'utf-8')
      
      // Should check for parent role
      expect(profilePageContent).toContain("getUserRole($user?.email) === 'parent'")
      
      // Should have settings link
      expect(profilePageContent).toContain("goto('/settings')")
      expect(profilePageContent).toContain('Settings')
    })
  })

  describe('Settings Page for Parents', () => {
    it('should create settings page with parent-only access', () => {
      const settingsPagePath = join(process.cwd(), 'src/routes/settings/+page.svelte')
      expect(() => readFileSync(settingsPagePath, 'utf-8')).not.toThrow()
      
      const settingsContent = readFileSync(settingsPagePath, 'utf-8')
      
      // Should check for parent role
      expect(settingsContent).toContain("getUserRole($user?.email)")
      expect(settingsContent).toContain("role === 'parent'")
      
      // Should redirect non-parents
      expect(settingsContent).toContain("goto('/dashboard')")
    })

    it('should include storage usage indicator', () => {
      const settingsPagePath = join(process.cwd(), 'src/routes/settings/+page.svelte')
      const settingsContent = readFileSync(settingsPagePath, 'utf-8')
      
      // Should fetch storage usage
      expect(settingsContent).toContain('fetchStorageUsage')
      expect(settingsContent).toContain('supabase.storage')
      expect(settingsContent).toContain('.list(')
      
      // Should calculate storage in GB
      expect(settingsContent).toContain('totalBytes / (1024 ** 3)')
      expect(settingsContent).toContain('GB used of 10 GB')
      
      // Should show progress bar
      expect(settingsContent).toContain('storagePercent')
    })

    it('should include media cleanup functionality for old files', () => {
      const settingsPagePath = join(process.cwd(), 'src/routes/settings/+page.svelte')
      const settingsContent = readFileSync(settingsPagePath, 'utf-8')
      
      // Should have clearOldMedia function
      expect(settingsContent).toContain('clearOldMedia')
      expect(settingsContent).toContain('dayjs().subtract(days, \'day\')')
      
      // Should filter by date
      expect(settingsContent).toContain('dayjs(f.created_at).isBefore(cutoff)')
      
      // Should delete files from storage
      expect(settingsContent).toContain('supabase.storage')
      expect(settingsContent).toContain('.remove(oldFiles)')
      
      // Should have confirmation dialog
      expect(settingsContent).toContain('confirm(')
      
      // Should have cleanup buttons for different time periods
      expect(settingsContent).toContain('clearOldMedia(30)')
      expect(settingsContent).toContain('clearOldMedia(60)')
    })

    it('should use notification system instead of alerts', () => {
      const settingsPagePath = join(process.cwd(), 'src/routes/settings/+page.svelte')
      const settingsContent = readFileSync(settingsPagePath, 'utf-8')
      
      // Should import notification store
      expect(settingsContent).toContain("import { notificationStore } from '$lib/stores/notificationStore'")
      
      // Should use notifications for feedback
      expect(settingsContent).toContain('notificationStore.add({')
      expect(settingsContent).toContain("type: 'success'")
      expect(settingsContent).toContain("type: 'error'")
      expect(settingsContent).toContain("type: 'info'")
      
      // Should not use alert() calls (except for confirm dialogs)
      const alertMatches = settingsContent.match(/alert\(/g)
      expect(alertMatches).toBeNull() // No alert() calls
    })

    it('should show storage warnings when nearing limit', () => {
      const settingsPagePath = join(process.cwd(), 'src/routes/settings/+page.svelte')
      const settingsContent = readFileSync(settingsPagePath, 'utf-8')
      
      // Should check for storage limits
      expect(settingsContent).toContain('storagePercent() > 80')
      
      // Should show visual indicators
      expect(settingsContent).toContain('bg-yellow-500')
      expect(settingsContent).toContain('bg-red-500')
      expect(settingsContent).toContain('bg-green-500')
    })
  })
})