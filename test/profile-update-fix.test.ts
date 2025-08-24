import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Profile Update Fix - Remove Redundant limit(1)', () => {
  it('should not use limit(1) in profileStore updateProfile method', () => {
    // Read the actual profileStore source code
    const profileStorePath = join(process.cwd(), 'src/lib/stores/profileStore.ts')
    const profileStoreContent = readFileSync(profileStorePath, 'utf-8')
    
    // Extract the updateProfile method content using a more specific pattern
    const updateProfileMatch = profileStoreContent.match(
      /async updateProfile\([^{]*\{[\s\S]*?(?=\n\s*async|\n\s*\w+\([^{]*\{|\n\s*\}[\s\S]*$)/
    )
    
    expect(updateProfileMatch).toBeTruthy()
    
    if (updateProfileMatch) {
      const updateProfileCode = updateProfileMatch[0]
      
      // Verify the fix: no .limit(1) should be present
      expect(updateProfileCode).not.toContain('.limit(1)')
      
      // Verify .maybeSingle() is still present (proper query structure)
      expect(updateProfileCode).toContain('.maybeSingle()')
      
      // Verify the query chain structure is correct
      expect(updateProfileCode).toContain('.from(\'profiles\')')
      expect(updateProfileCode).toContain('.update(')
      expect(updateProfileCode).toContain('.eq(\'user_id\', userId)')
      expect(updateProfileCode).toContain('.select()')
    } else {
      // Fallback: check the entire file content for the absence of .limit(1) in update queries
      expect(profileStoreContent).not.toContain('.limit(1)')
      expect(profileStoreContent).toContain('updateProfile')
      expect(profileStoreContent).toContain('.maybeSingle()')
    }
  })
  
  it('should have the correct query chain order without limit(1)', () => {
    const profileStorePath = join(process.cwd(), 'src/lib/stores/profileStore.ts')
    const profileStoreContent = readFileSync(profileStorePath, 'utf-8')
    
    // Check that NO .limit(1) calls exist anywhere in the file
    expect(profileStoreContent).not.toContain('.limit(1)')
    
    // Check that updateProfile has the correct pattern: 
    // .from() -> .update() -> .eq() -> .select() -> .maybeSingle()
    const updateProfilePattern = /\.from\(['"]profiles['"]\)[\s\S]*?\.update\([\s\S]*?\.eq\(['"]user_id['"],\s*userId\)[\s\S]*?\.select\(\)[\s\S]*?\.maybeSingle\(\)/
    expect(profileStoreContent).toMatch(updateProfilePattern)
    
    // Check that loadProfile has the correct pattern:
    // .from() -> .select() -> .eq() -> .maybeSingle()
    const loadProfilePattern = /\.from\(['"]profiles['"]\)[\s\S]*?\.select\(['"][*]['"]?\)[\s\S]*?\.eq\(['"]email['"],\s*email\)[\s\S]*?\.maybeSingle\(\)/
    expect(profileStoreContent).toMatch(loadProfilePattern)
  })
})