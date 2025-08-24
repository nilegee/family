/**
 * Server-side allowlist validation for authorized family members
 * This matches the schema RLS policies and frontend allowlist
 */

import type { UserRole } from '$lib/schema/auth';

export const ALLOWED_EMAILS = [
	'nilezat@gmail.com',
	'abdessamia.mariem@gmail.com', 
	'yazidgeemail@gmail.com',
	'yahyageemail@gmail.com'
] as const;

export type AllowedEmail = typeof ALLOWED_EMAILS[number];

/**
 * Check if an email is in the allowlist
 */
export function isEmailAllowed(email: string | null | undefined): email is AllowedEmail {
	if (!email) return false;
	return ALLOWED_EMAILS.includes(email as AllowedEmail);
}

/**
 * Validate user session and email allowlist
 * Returns the validated email or throws an error
 */
export function validateUserAccess(userEmail: string | null | undefined): AllowedEmail {
	if (!userEmail) {
		throw new Error('No user email provided');
	}
	
	if (!isEmailAllowed(userEmail)) {
		throw new Error(`Access denied for email: ${userEmail}`);
	}
	
	return userEmail as AllowedEmail;
}

/**
 * Get user role based on email (basic implementation)
 * In a real app, this might come from a database
 */
export function getUserRole(email: AllowedEmail): UserRole {
	// Correct family role mapping per requirements
	if (email === 'nilezat@gmail.com' || email === 'abdessamia.mariem@gmail.com') {
		return 'parent';
	}
	if (email === 'yazidgeemail@gmail.com' || email === 'yahyageemail@gmail.com') {
		return 'child';
	}
	return 'member';
}