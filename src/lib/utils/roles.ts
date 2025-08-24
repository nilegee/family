/**
 * Client-side role utilities for Mayo (FamilyNest) app
 * This mirrors the server-side logic from allowlist.ts
 */

import type { UserRole, RoleDisplayName } from '$lib/schema/auth';

export const ALLOWED_EMAILS = [
	'nilezat@gmail.com',
	'abdessamia.mariem@gmail.com', 
	'yazidgeemail@gmail.com',
	'yahyageemail@gmail.com'
] as const;

export type AllowedEmail = typeof ALLOWED_EMAILS[number];

/**
 * Get user role based on email (client-side version)
 * This mirrors the server-side logic for UI display
 */
export function getUserRole(email: string | null | undefined): UserRole {
	if (!email) return 'member';
	
	// Correct family role mapping - mirrors server logic
	if (email === 'nilezat@gmail.com' || email === 'abdessamia.mariem@gmail.com') {
		return 'parent';
	}
	if (email === 'yazidgeemail@gmail.com' || email === 'yahyageemail@gmail.com') {
		return 'child';
	}
	return 'member';
}

/**
 * Get specific role display name for family members
 */
export function getRoleDisplayName(email: string | null | undefined): RoleDisplayName {
	if (!email) return 'Member';
	
	// Specific family role labels
	if (email === 'nilezat@gmail.com') {
		return 'Father';
	}
	if (email === 'abdessamia.mariem@gmail.com') {
		return 'Mother';
	}
	if (email === 'yazidgeemail@gmail.com' || email === 'yahyageemail@gmail.com') {
		return 'Child';
	}
	return 'Member';
}

/**
 * Check if an email is in the allowlist (client-side)
 */
export function isEmailAllowed(email: string | null | undefined): email is AllowedEmail {
	if (!email) return false;
	return ALLOWED_EMAILS.includes(email as AllowedEmail);
}

/**
 * Get seeded display name for family members
 * These are the default display names that should be seeded for each email
 */
export function getSeededDisplayName(email: string | null | undefined): string | null {
	if (!email) return null;
	
	// Seeded display names per requirements
	switch (email) {
		case 'nilezat@gmail.com':
			return 'G';
		case 'abdessamia.mariem@gmail.com':
			return 'Mayouta';
		case 'yazidgeemail@gmail.com':
			return 'Yazid';
		case 'yahyageemail@gmail.com':
			return 'Yahya';
		default:
			return null;
	}
}