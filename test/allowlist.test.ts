import { describe, it, expect } from 'vitest'
import { 
	ALLOWED_EMAILS, 
	isEmailAllowed, 
	validateUserAccess, 
	getUserRole,
	type AllowedEmail 
} from '../src/lib/server/allowlist'

describe('Server Allowlist Validation', () => {
	describe('ALLOWED_EMAILS constant', () => {
		it('should contain exactly 4 family emails', () => {
			expect(ALLOWED_EMAILS).toHaveLength(4)
			expect(ALLOWED_EMAILS).toContain('nilezat@gmail.com')
			expect(ALLOWED_EMAILS).toContain('abdessamia.mariem@gmail.com')
			expect(ALLOWED_EMAILS).toContain('yazidgeemail@gmail.com')
			expect(ALLOWED_EMAILS).toContain('yahyageemail@gmail.com')
		})

		it('should be a readonly array', () => {
			// This test ensures the type safety of the allowlist
			const email: AllowedEmail = 'nilezat@gmail.com'
			expect(ALLOWED_EMAILS).toContain(email)
		})
	})

	describe('isEmailAllowed function', () => {
		it('should return true for allowed family emails', () => {
			const allowedEmails = [
				'nilezat@gmail.com',
				'abdessamia.mariem@gmail.com',
				'yazidgeemail@gmail.com',
				'yahyageemail@gmail.com'
			]

			allowedEmails.forEach(email => {
				expect(isEmailAllowed(email)).toBe(true)
			})
		})

		it('should return false for non-allowed emails', () => {
			const deniedEmails = [
				'stranger@gmail.com',
				'hacker@evil.com',
				'test@example.com',
				'admin@mayo.com',
				'support@mayo.com'
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

		it('should return false for malformed emails', () => {
			const malformedEmails = [
				'not-an-email',
				'@gmail.com',
				'test@',
				'test..test@gmail.com',
				'test@gmail',
				123 as any,
				{} as any,
				[] as any
			]

			malformedEmails.forEach(email => {
				expect(isEmailAllowed(email)).toBe(false)
			})
		})

		it('should be case sensitive', () => {
			expect(isEmailAllowed('NILEZAT@GMAIL.COM')).toBe(false)
			expect(isEmailAllowed('Nilezat@Gmail.Com')).toBe(false)
			expect(isEmailAllowed('nilezat@GMAIL.COM')).toBe(false)
		})
	})

	describe('validateUserAccess function', () => {
		it('should return validated email for allowed users', () => {
			const allowedEmails = [
				'nilezat@gmail.com',
				'abdessamia.mariem@gmail.com',
				'yazidgeemail@gmail.com',
				'yahyageemail@gmail.com'
			]

			allowedEmails.forEach(email => {
				const result = validateUserAccess(email)
				expect(result).toBe(email)
			})
		})

		it('should throw error for null or undefined email', () => {
			expect(() => validateUserAccess(null)).toThrow('No user email provided')
			expect(() => validateUserAccess(undefined)).toThrow('No user email provided')
		})

		it('should throw error for non-allowed emails', () => {
			const deniedEmails = [
				'stranger@gmail.com',
				'hacker@evil.com',
				'test@example.com'
			]

			deniedEmails.forEach(email => {
				expect(() => validateUserAccess(email)).toThrow(`Access denied for email: ${email}`)
			})
		})

		it('should throw error for empty email', () => {
			expect(() => validateUserAccess('')).toThrow('No user email provided')
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

		it('should handle all allowed emails without throwing', () => {
			const testRoles = () => {
				ALLOWED_EMAILS.forEach(email => {
					const role = getUserRole(email)
					expect(['parent', 'child', 'member']).toContain(role)
				})
			}

			expect(testRoles).not.toThrow()
		})

		it('should correctly map all 4 family emails to their expected roles', () => {
			// Test specific email-to-role mappings as per requirements
			expect(getUserRole('nilezat@gmail.com')).toBe('parent') // Father
			expect(getUserRole('abdessamia.mariem@gmail.com')).toBe('parent') // Mother
			expect(getUserRole('yazidgeemail@gmail.com')).toBe('child') // Child
			expect(getUserRole('yahyageemail@gmail.com')).toBe('child') // Child
		})
	})

	describe('Integration: Allowlist with Schema Validation', () => {
		it('should work with Zod schema validation', async () => {
			// Import the schema to test integration
			const { allowedEmailSchema } = await import('../src/lib/schema/auth')
			
			// Test that server allowlist matches schema allowlist
			ALLOWED_EMAILS.forEach(email => {
				expect(isEmailAllowed(email)).toBe(true)
				expect(allowedEmailSchema.safeParse(email).success).toBe(true)
			})

			// Test that non-allowed emails fail both
			const testEmail = 'test@example.com'
			expect(isEmailAllowed(testEmail)).toBe(false)
			expect(allowedEmailSchema.safeParse(testEmail).success).toBe(false)
		})

		it('should maintain consistency between server and client validation', async () => {
			const { allowedEmailSchema } = await import('../src/lib/schema/auth')
			
			// Get emails from schema enum
			const schemaEmails = allowedEmailSchema.options
			const serverEmails = [...ALLOWED_EMAILS]

			// Sort both arrays for comparison
			schemaEmails.sort()
			serverEmails.sort()

			expect(schemaEmails).toEqual(serverEmails)
		})
	})
})