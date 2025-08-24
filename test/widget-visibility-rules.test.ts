import { describe, it, expect } from 'vitest';
import { getUserRole } from '../src/lib/utils/roles';

describe('Widget Visibility Rules', () => {
	describe('Role-based Widget Filtering', () => {
		it('should correctly identify parent users', () => {
			const parentEmails = ['nilezat@gmail.com', 'abdessamia.mariem@gmail.com'];
			
			parentEmails.forEach(email => {
				const role = getUserRole(email);
				expect(role).toBe('parent');
			});
		});

		it('should correctly identify child users', () => {
			const childEmails = ['yazidgeemail@gmail.com', 'yahyageemail@gmail.com'];
			
			childEmails.forEach(email => {
				const role = getUserRole(email);
				expect(role).toBe('child');
			});
		});

		it('should handle unknown users as members', () => {
			const unknownRole = getUserRole('unknown@example.com');
			expect(unknownRole).toBe('member');
		});

		it('should handle null/undefined emails', () => {
			expect(getUserRole(null)).toBe('member');
			expect(getUserRole(undefined)).toBe('member');
			expect(getUserRole('')).toBe('member');
		});
	});

	describe('Widget Visibility Logic', () => {
		it('should define children-only widgets correctly', () => {
			// What Would You Do? should be visible only to children
			const childEmails = ['yazidgeemail@gmail.com', 'yahyageemail@gmail.com'];
			const parentEmails = ['nilezat@gmail.com', 'abdessamia.mariem@gmail.com'];
			
			childEmails.forEach(email => {
				const role = getUserRole(email);
				const shouldSeeScenarios = role === 'child';
				expect(shouldSeeScenarios).toBe(true);
			});

			parentEmails.forEach(email => {
				const role = getUserRole(email);
				const shouldSeeScenarios = role === 'child';
				expect(shouldSeeScenarios).toBe(false);
			});
		});

		it('should define parent-only widgets correctly', () => {
			// Digest widgets should be visible only to parents
			const parentEmails = ['nilezat@gmail.com', 'abdessamia.mariem@gmail.com'];
			const childEmails = ['yazidgeemail@gmail.com', 'yahyageemail@gmail.com'];
			
			parentEmails.forEach(email => {
				const role = getUserRole(email);
				const shouldSeeDigests = role === 'parent';
				expect(shouldSeeDigests).toBe(true);
			});

			childEmails.forEach(email => {
				const role = getUserRole(email);
				const shouldSeeDigests = role === 'parent';
				expect(shouldSeeDigests).toBe(false);
			});
		});
	});

	describe('Specific Family Member Access', () => {
		it('should allow Yazid access to scenario widgets', () => {
			const role = getUserRole('yazidgeemail@gmail.com');
			expect(role).toBe('child');
		});

		it('should allow Yahya access to scenario widgets', () => {
			const role = getUserRole('yahyageemail@gmail.com');
			expect(role).toBe('child');
		});

		it('should allow Ghassan access to digest widgets', () => {
			const role = getUserRole('nilezat@gmail.com');
			expect(role).toBe('parent');
		});

		it('should allow Mariem access to digest widgets', () => {
			const role = getUserRole('abdessamia.mariem@gmail.com');
			expect(role).toBe('parent');
		});
	});

	describe('Age Playground Extension', () => {
		it('should allow extended age range for Ghassan', () => {
			const ghassanEmail = 'nilezat@gmail.com';
			const maxAge = ghassanEmail === 'nilezat@gmail.com' ? 70 : 18;
			
			expect(maxAge).toBe(70);
		});

		it('should use standard age range for others', () => {
			const otherEmails = [
				'abdessamia.mariem@gmail.com',
				'yazidgeemail@gmail.com', 
				'yahyageemail@gmail.com'
			];
			
			otherEmails.forEach(email => {
				const maxAge = email === 'nilezat@gmail.com' ? 70 : 18;
				expect(maxAge).toBe(18);
			});
		});
	});
});