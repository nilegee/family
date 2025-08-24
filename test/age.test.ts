import { describe, it, expect, vi } from 'vitest';
import dayjs from 'dayjs';
import { 
	calculateAge, 
	calculateDobForAge, 
	calculateAgeDifference, 
	calculateFamilyAges,
	hasRequiredDobs,
	getChildrenProfiles 
} from '../src/lib/utils/age';

// Mock profiles for testing
const mockProfiles = [
	{
		user_id: '1',
		email: 'yahya@example.com',
		display_name: 'Yahya',
		avatar_url: null,
		role: 'child',
		dob: '2014-06-15', // ~10 years old (born June 15, 2014)
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z'
	},
	{
		user_id: '2',
		email: 'yazid@example.com',
		display_name: 'Yazid',
		avatar_url: null,
		role: 'child',
		dob: '2016-03-10', // ~8 years old (born March 10, 2016)
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z'
	},
	{
		user_id: '3',
		email: 'mama@example.com',
		display_name: 'Mama',
		avatar_url: null,
		role: 'parent',
		dob: '1985-09-20', // ~39 years old (born September 20, 1985)
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z'
	},
	{
		user_id: '4',
		email: 'baba@example.com',
		display_name: 'Baba',
		avatar_url: null,
		role: 'parent',
		dob: '1983-12-05', // ~40 years old (born December 5, 1983)
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z'
	},
	{
		user_id: '5',
		email: 'nodob@example.com',
		display_name: 'No DOB',
		avatar_url: null,
		role: null,
		dob: null,
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z'
	}
];

describe('Age Utilities', () => {
	describe('calculateAge', () => {
		it('should calculate correct age for a given DOB', () => {
			// Using actual current date since we're just checking calculation works
			const dob = '2000-01-01';
			const age = calculateAge(dob);
			const expectedAge = dayjs().diff(dayjs(dob), 'year');
			expect(age).toBe(expectedAge);
		});

		it('should handle different dates correctly', () => {
			// Test with dates that we know the approximate age
			const currentYear = dayjs().year();
			const dob = `${currentYear - 25}-06-15`; // 25 years ago
			const age = calculateAge(dob);
			expect(age).toBeGreaterThanOrEqual(24);
			expect(age).toBeLessThanOrEqual(26);
		});
	});

	describe('calculateDobForAge', () => {
		it('should calculate DOB for a given target age', () => {
			const targetAge = 10;
			const dob = calculateDobForAge(targetAge);
			const calculatedAge = calculateAge(dob);
			expect(calculatedAge).toBe(targetAge);
		});
	});

	describe('calculateAgeDifference', () => {
		it('should calculate age difference between two DOBs', () => {
			const diff = calculateAgeDifference('2014-06-15', '2016-03-10');
			expect(diff).toBe(1); // About 1.8 years, rounded to 1
		});

		it('should return absolute difference', () => {
			const diff1 = calculateAgeDifference('2014-06-15', '2016-03-10');
			const diff2 = calculateAgeDifference('2016-03-10', '2014-06-15');
			expect(diff1).toBe(diff2);
		});
	});

	describe('calculateFamilyAges', () => {
		it('should calculate all family ages based on base child target age', () => {
			// Set Yahya to be 12, and see how others adjust
			const familyAges = calculateFamilyAges(mockProfiles, 'yahya@example.com', 12);
			
			expect(familyAges['yahya@example.com']).toBe(12);
			expect(familyAges['yazid@example.com']).toBeGreaterThan(8); // Should be younger than Yahya
			expect(familyAges['mama@example.com']).toBeGreaterThan(30); // Should be older
			expect(familyAges['baba@example.com']).toBeGreaterThan(30); // Should be older
		});

		it('should handle missing base child', () => {
			const familyAges = calculateFamilyAges(mockProfiles, 'nonexistent@example.com', 12);
			expect(Object.keys(familyAges)).toHaveLength(0);
		});

		it('should not include profiles without DOB', () => {
			const familyAges = calculateFamilyAges(mockProfiles, 'yahya@example.com', 12);
			expect(familyAges['nodob@example.com']).toBeUndefined();
		});

		it('should ensure no negative ages', () => {
			// Set a very young age that might cause negative ages for others
			const familyAges = calculateFamilyAges(mockProfiles, 'yahya@example.com', 1);
			Object.values(familyAges).forEach(age => {
				expect(age).toBeGreaterThanOrEqual(0);
			});
		});
	});

	describe('hasRequiredDobs', () => {
		it('should return true when enough DOBs are available', () => {
			expect(hasRequiredDobs(mockProfiles)).toBe(true);
		});

		it('should return false when not enough DOBs are available', () => {
			const limitedProfiles = [mockProfiles[0], mockProfiles[4]]; // Only one with DOB
			expect(hasRequiredDobs(limitedProfiles)).toBe(false);
		});

		it('should return false for empty profiles', () => {
			expect(hasRequiredDobs([])).toBe(false);
		});
	});

	describe('getChildrenProfiles', () => {
		it('should return profiles with child role', () => {
			const children = getChildrenProfiles(mockProfiles);
			expect(children).toHaveLength(2);
			expect(children.map(c => c.email)).toEqual(['yahya@example.com', 'yazid@example.com']);
		});

		it('should infer children from age when role is not set', () => {
			const profilesWithoutRoles = mockProfiles.map(p => ({ ...p, role: null }));
			const children = getChildrenProfiles(profilesWithoutRoles);
			
			// Should still identify the young ones as children
			expect(children.length).toBeGreaterThan(0);
			children.forEach(child => {
				if (child.dob) {
					const age = calculateAge(child.dob);
					expect(age).toBeLessThan(18);
				}
			});
		});

		it('should not include profiles without DOB', () => {
			const children = getChildrenProfiles(mockProfiles);
			children.forEach(child => {
				expect(child.dob).toBeTruthy();
			});
		});
	});
});