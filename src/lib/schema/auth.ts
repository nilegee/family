import { z } from 'zod'

/**
 * Allowlist email validation schema
 * Validates against the 4 hardcoded family emails
 */
export const allowedEmailSchema = z.enum([
	'nilezat@gmail.com',
	'abdessamia.mariem@gmail.com',
	'yazidgeemail@gmail.com',
	'yahyageemail@gmail.com'
])

export type AllowedEmail = z.infer<typeof allowedEmailSchema>

/**
 * User role validation schema
 */
export const userRoleSchema = z.enum(['parent', 'child', 'member'])

export type UserRole = z.infer<typeof userRoleSchema>

/**
 * Specific family role display names
 */
export const roleDisplayNameSchema = z.enum(['Father', 'Mother', 'Child', 'Member'])

export type RoleDisplayName = z.infer<typeof roleDisplayNameSchema>

/**
 * Profile validation schema for forms and updates
 */
export const profileSchema = z.object({
	user_id: z.string().uuid(),
	email: allowedEmailSchema,
	display_name: z.string().min(1, 'Display name is required').max(100).nullish(),
	avatar_url: z.string().url().nullish(),
	role: userRoleSchema.nullish(),
	dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').nullish(),
	created_at: z.string().datetime().nullish(),
	updated_at: z.string().datetime().nullish()
}).passthrough()

export type ProfileData = z.infer<typeof profileSchema>

/**
 * Profile update schema (for forms)
 */
export const profileUpdateSchema = profileSchema.partial().required({
	user_id: true,
	email: true
})

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>