import { describe, it, expect } from 'vitest'
import { 
	ALLOWED_EMAILS, 
	isEmailAllowed, 
	getUserRole,
	getRoleDisplayName,
	type AllowedEmail 
} from '../src/lib/utils/roles'

describe('Client-side Role Utilities', () => {
	describe('ALLOWED_EMAILS constant', () => {
		it('should contain exactly 4 family emails', () => {
			expect(ALLOWED_EMAILS).toHaveLength(4)
			expect(ALLOWED_EMAILS).toContain('nilezat@gmail.com')
			expect(ALLOWED_EMAILS).toContain('abdessamia.mariem@gmail.com')
			expect(ALLOWED_EMAILS).toContain('yazidgeemail@gmail.com')
			expect(ALLOWED_EMAILS).toContain('yahyageemail@gmail.com')
		})

		it('should match server-side allowlist', async () => {
			const { ALLOWED_EMAILS: serverEmails } = await import('../src/lib/server/allowlist')
			expect([...ALLOWED_EMAILS].sort()).toEqual([...serverEmails].sort())
		})
	})

	describe('getUserRole function', () => {
		it('should return "parent" for parent emails', () => {
			expect(getUserRole('nilezat@gmail.com')).toBe('parent')
			expect(getUserRole('abdessamia.mariem@gmail.com')).toBe('parent')
		})

		it('should return "child" for child emails', () => {
			expect(getUserRole('yazidgeemail@gmail.com')).toBe('child')
			expect(getUserRole('yahyageemail@gmail.com')).toBe('child')
		})

		it('should return "member" for null/undefined email', () => {
			expect(getUserRole(null)).toBe('member')
			expect(getUserRole(undefined)).toBe('member')
			expect(getUserRole('')).toBe('member')
		})

		it('should correctly map all 4 family emails to their expected roles', () => {
			// Test specific email-to-role mappings as per requirements
			expect(getUserRole('nilezat@gmail.com')).toBe('parent') // Father
			expect(getUserRole('abdessamia.mariem@gmail.com')).toBe('parent') // Mother
			expect(getUserRole('yazidgeemail@gmail.com')).toBe('child') // Child
			expect(getUserRole('yahyageemail@gmail.com')).toBe('child') // Child
		})

		it('should match server-side getUserRole results', async () => {
			const { getUserRole: serverGetUserRole } = await import('../src/lib/server/allowlist')
			
			ALLOWED_EMAILS.forEach(email => {
				const clientRole = getUserRole(email)
				const serverRole = serverGetUserRole(email)
				expect(clientRole).toBe(serverRole)
			})
		})
	})

	describe('getRoleDisplayName function', () => {
		it('should return specific family role labels', () => {
			expect(getRoleDisplayName('nilezat@gmail.com')).toBe('Father')
			expect(getRoleDisplayName('abdessamia.mariem@gmail.com')).toBe('Mother')
			expect(getRoleDisplayName('yazidgeemail@gmail.com')).toBe('Child')
			expect(getRoleDisplayName('yahyageemail@gmail.com')).toBe('Child')
		})

		it('should return "Member" for null/undefined email', () => {
			expect(getRoleDisplayName(null)).toBe('Member')
			expect(getRoleDisplayName(undefined)).toBe('Member')
			expect(getRoleDisplayName('')).toBe('Member')
		})

		it('should return "Member" for non-family emails', () => {
			expect(getRoleDisplayName('unknown@example.com')).toBe('Member')
		})

		it('should ensure all family members have unique, specific labels', () => {
			const labels = ALLOWED_EMAILS.map(email => getRoleDisplayName(email))
			expect(labels).toContain('Father')
			expect(labels).toContain('Mother')
			expect(labels.filter(label => label === 'Child')).toHaveLength(2)
		})
	})

	describe('isEmailAllowed function', () => {
		it('should return true for allowed family emails', () => {
			ALLOWED_EMAILS.forEach(email => {
				expect(isEmailAllowed(email)).toBe(true)
			})
		})

		it('should return false for non-allowed emails', () => {
			const deniedEmails = [
				'stranger@gmail.com',
				'hacker@evil.com',
				'test@example.com'
			]

			deniedEmails.forEach(email => {
				expect(isEmailAllowed(email)).toBe(false)
			})
		})

		it('should return false for null, undefined, or empty email', () => {
			expect(isEmailAllowed(null)).toBe(false)
			expect(isEmailAllowed(undefined)).toBe(false)
			expect(isEmailAllowed('')).toBe(false)
		})
	})
})