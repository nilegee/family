import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Profile Picture Upload Fix - HTTP 406 Error', () => {
  it('should include .select() in profile update queries to prevent HTTP 406 errors', () => {
    // Read the profile page source code
    const profilePagePath = join(process.cwd(), 'src/routes/profile/+page.svelte')
    const profilePageContent = readFileSync(profilePagePath, 'utf-8')
    
    // Verify the fix: profile update query includes .select()
    expect(profilePageContent).toContain('.from(\'profiles\')')
    expect(profilePageContent).toContain('.update(')
    expect(profilePageContent).toContain('.eq(\'user_id\', $user!.id)')
    expect(profilePageContent).toContain('.select()')
    
    // Verify proper error handling variables are used
    expect(profilePageContent).toContain('error: updateError')
    expect(profilePageContent).toContain('error: urlError')
    
    // Verify upsert option is enabled for storage upload
    expect(profilePageContent).toContain('upsert: true')
    
    // Verify improved error messages
    expect(profilePageContent).toContain('Upload failed. Please try a smaller image.')
  })
  
  it('should have proper error handling for all upload steps', () => {
    const profilePagePath = join(process.cwd(), 'src/routes/profile/+page.svelte')
    const profilePageContent = readFileSync(profilePagePath, 'utf-8')
    
    // Check for specific error handling patterns
    expect(profilePageContent).toContain('if (uploadError) throw uploadError')
    expect(profilePageContent).toContain('if (updateError) throw updateError')  
    expect(profilePageContent).toContain('if (urlError) throw urlError')
    
    // Check for user-friendly error messages
    expect(profilePageContent).toContain('Upload failed. Please try a smaller image.')
    expect(profilePageContent).toContain('Upload failed. Please check your connection and try again.')
    
    // Verify storage upload has upsert enabled
    expect(profilePageContent).toContain('{ upsert: true }')
  })
  
  it('should properly structure the database update query', () => {
    const profilePagePath = join(process.cwd(), 'src/routes/profile/+page.svelte')
    const profilePageContent = readFileSync(profilePagePath, 'utf-8')
    
    // Check that the profile update query follows the correct pattern:
    // .from() -> .update() -> .eq() -> .select()
    const updateQueryPattern = /\.from\(['"]profiles['"]\)[\s\S]*?\.update\(\s*\{\s*avatar_url:\s*data\.path\s*\}\s*\)[\s\S]*?\.eq\(['"]user_id['"],\s*\$user!?\.id\)[\s\S]*?\.select\(\)/
    expect(profilePageContent).toMatch(updateQueryPattern)
    
    // Verify the response is properly captured with error handling
    expect(profilePageContent).toContain('{ data: updateData, error: updateError }')
  })
})