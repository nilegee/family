import { describe, it, expect } from 'vitest'
import { getUserRole as serverGetUserRole } from '../src/lib/server/allowlist'
import { getUserRole as clientGetUserRole, getRoleDisplayName } from '../src/lib/utils/roles'

describe('Role Mapping Requirements Validation', () => {
	describe('Requirement: Correct Role Mapping', () => {
		it('should map nilezat@gmail.com to parent (Father)', () => {
			const email = 'nilezat@gmail.com'
			expect(serverGetUserRole(email)).toBe('parent')
			expect(clientGetUserRole(email)).toBe('parent')
			expect(getRoleDisplayName(email)).toBe('Father')
		})

		it('should map abdessamia.mariem@gmail.com to parent (Mother)', () => {
			const email = 'abdessamia.mariem@gmail.com'
			expect(serverGetUserRole(email)).toBe('parent')
			expect(clientGetUserRole(email)).toBe('parent')
			expect(getRoleDisplayName(email)).toBe('Mother')
		})

		it('should map yazidgeemail@gmail.com to child', () => {
			const email = 'yazidgeemail@gmail.com'
			expect(serverGetUserRole(email)).toBe('child')
			expect(clientGetUserRole(email)).toBe('child')
			expect(getRoleDisplayName(email)).toBe('Child')
		})

		it('should map yahyageemail@gmail.com to child', () => {
			const email = 'yahyageemail@gmail.com'
			expect(serverGetUserRole(email)).toBe('child')
			expect(clientGetUserRole(email)).toBe('child')
			expect(getRoleDisplayName(email)).toBe('Child')
		})
	})

	describe('Requirement: Server-side First Role Assignment', () => {
		it('should have consistent role mapping between server and client', () => {
			const emails = [
				'nilezat@gmail.com',
				'abdessamia.mariem@gmail.com',
				'yazidgeemail@gmail.com',
				'yahyageemail@gmail.com'
			]

			emails.forEach(email => {
				const serverRole = serverGetUserRole(email as any)
				const clientRole = clientGetUserRole(email)
				expect(clientRole).toBe(serverRole)
			})
		})
	})

	describe('Requirement: TypeScript Type Safety', () => {
		it('should have proper types to prevent unknown roles', () => {
			// If this compiles, it means our types are working correctly
			const role: 'parent' | 'child' | 'member' = serverGetUserRole('nilezat@gmail.com')
			const displayName: string = getRoleDisplayName('nilezat@gmail.com')
			
			expect(['parent', 'child', 'member']).toContain(role)
			expect(['Father', 'Mother', 'Child', 'Member']).toContain(displayName)
		})
	})

	describe('Requirement: Specific Role Labels in UI', () => {
		it('should provide specific family role labels for display', () => {
			const roleLabels = [
				getRoleDisplayName('nilezat@gmail.com'),
				getRoleDisplayName('abdessamia.mariem@gmail.com'),
				getRoleDisplayName('yazidgeemail@gmail.com'),
				getRoleDisplayName('yahyageemail@gmail.com')
			]

			expect(roleLabels).toContain('Father')
			expect(roleLabels).toContain('Mother')
			expect(roleLabels.filter(label => label === 'Child')).toHaveLength(2)
		})
	})

	describe('Requirement: Access Denial for Non-allowlist', () => {
		it('should handle non-allowlist emails appropriately', () => {
			const unknownEmail = 'stranger@example.com'
			expect(clientGetUserRole(unknownEmail)).toBe('member')
			expect(getRoleDisplayName(unknownEmail)).toBe('Member')
		})
	})
})