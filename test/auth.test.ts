import { describe, it, expect } from 'vitest'
import { 
	allowedEmailSchema, 
	userRoleSchema, 
	profileSchema, 
	profileUpdateSchema,
	type AllowedEmail,
	type UserRole 
} from '../src/lib/schema/auth'

describe('Auth Schema Validation', () => {
	describe('allowedEmailSchema', () => {
		it('should accept valid family emails', () => {
			const validEmails = [
				'nilezat@gmail.com',
				'abdessamia.mariem@gmail.com',
				'yazidgeemail@gmail.com',
				'yahyageemail@gmail.com'
			]

			validEmails.forEach(email => {
				const result = allowedEmailSchema.safeParse(email)
				expect(result.success).toBe(true)
				if (result.success) {
					expect(result.data).toBe(email)
				}
			})
		})

		it('should reject invalid emails', () => {
			const invalidEmails = [
				'invalid@example.com',
				'test@gmail.com',
				'',
				null,
				undefined,
				'not-an-email'
			]

			invalidEmails.forEach(email => {
				const result = allowedEmailSchema.safeParse(email)
				expect(result.success).toBe(false)
			})
		})

		it('should provide correct TypeScript types', () => {
			const email: AllowedEmail = 'nilezat@gmail.com'
			expect(allowedEmailSchema.parse(email)).toBe(email)
		})
	})

	describe('userRoleSchema', () => {
		it('should accept valid user roles', () => {
			const validRoles = ['parent', 'child', 'member']

			validRoles.forEach(role => {
				const result = userRoleSchema.safeParse(role)
				expect(result.success).toBe(true)
				if (result.success) {
					expect(result.data).toBe(role)
				}
			})
		})

		it('should reject invalid roles', () => {
			const invalidRoles = ['admin', 'guest', '', null, undefined, 123]

			invalidRoles.forEach(role => {
				const result = userRoleSchema.safeParse(role)
				expect(result.success).toBe(false)
			})
		})

		it('should provide correct TypeScript types', () => {
			const role: UserRole = 'parent'
			expect(userRoleSchema.parse(role)).toBe(role)
		})
	})

	describe('profileSchema', () => {
		const validProfile = {
			user_id: '123e4567-e89b-12d3-a456-426614174000',
			email: 'nilezat@gmail.com' as AllowedEmail,
			display_name: 'Test User',
			avatar_url: 'https://example.com/avatar.jpg',
			role: 'parent' as UserRole,
			dob: '1990-01-01',
			created_at: '2023-01-01T00:00:00Z',
			updated_at: '2023-01-01T00:00:00Z'
		}

		it('should accept valid profile data', () => {
			const result = profileSchema.safeParse(validProfile)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.email).toBe(validProfile.email)
				expect(result.data.user_id).toBe(validProfile.user_id)
			}
		})

		it('should accept profile with null optional fields', () => {
			const profileWithNulls = {
				user_id: '123e4567-e89b-12d3-a456-426614174000',
				email: 'nilezat@gmail.com' as AllowedEmail,
				display_name: null,
				avatar_url: null,
				role: null,
				dob: null
			}

			const result = profileSchema.safeParse(profileWithNulls)
			expect(result.success).toBe(true)
		})

		it('should reject invalid UUID', () => {
			const invalidProfile = {
				...validProfile,
				user_id: 'invalid-uuid'
			}

			const result = profileSchema.safeParse(invalidProfile)
			expect(result.success).toBe(false)
		})

		it('should reject invalid email', () => {
			const invalidProfile = {
				...validProfile,
				email: 'invalid@example.com'
			}

			const result = profileSchema.safeParse(invalidProfile)
			expect(result.success).toBe(false)
		})

		it('should reject invalid date format', () => {
			const invalidProfile = {
				...validProfile,
				dob: '01/01/1990' // Invalid format
			}

			const result = profileSchema.safeParse(invalidProfile)
			expect(result.success).toBe(false)
		})
	})

	describe('profileUpdateSchema', () => {
		it('should require user_id and email', () => {
			const updateData = {
				display_name: 'Updated Name'
			}

			const result = profileUpdateSchema.safeParse(updateData)
			expect(result.success).toBe(false)
		})

		it('should accept partial updates with required fields', () => {
			const updateData = {
				user_id: '123e4567-e89b-12d3-a456-426614174000',
				email: 'nilezat@gmail.com' as AllowedEmail,
				display_name: 'Updated Name'
			}

			const result = profileUpdateSchema.safeParse(updateData)
			expect(result.success).toBe(true)
		})
	})
})