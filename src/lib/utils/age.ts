import dayjs from 'dayjs';
import type { Database } from '../supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Calculate the current age of a person based on their DOB
 */
export function calculateAge(dob: string): number {
  const birthDate = dayjs(dob);
  const now = dayjs();
  return now.diff(birthDate, 'year');
}

/**
 * Calculate what someone's DOB would be if they were a specific age today
 */
export function calculateDobForAge(targetAge: number): string {
  const now = dayjs();
  const dob = now.subtract(targetAge, 'year');
  return dob.format('YYYY-MM-DD');
}

/**
 * Calculate the age difference between two people based on their DOBs
 */
export function calculateAgeDifference(dob1: string, dob2: string): number {
  const date1 = dayjs(dob1);
  const date2 = dayjs(dob2);
  return Math.abs(date1.diff(date2, 'year'));
}

/**
 * Calculate family ages based on one child's target age
 * Assumes typical family structure with known age gaps
 */
export function calculateFamilyAges(
  profiles: Profile[],
  baseChildEmail: string,
  targetAge: number
): { [email: string]: number } {
  const result: { [email: string]: number } = {};
  
  // Find the base child's profile
  const baseChild = profiles.find(p => p.email === baseChildEmail);
  if (!baseChild?.dob) {
    return result;
  }

  // Calculate what the base child's current age actually is
  const currentAge = calculateAge(baseChild.dob);
  const ageDifference = targetAge - currentAge;

  // Apply the age difference to all family members
  profiles.forEach(profile => {
    if (profile.dob) {
      const currentMemberAge = calculateAge(profile.dob);
      const adjustedAge = currentMemberAge + ageDifference;
      result[profile.email] = Math.max(0, adjustedAge); // Ensure no negative ages
    }
  });

  return result;
}

/**
 * Get family member display names for the playground
 */
export function getFamilyMemberDisplayNames(profiles: Profile[]): { [email: string]: string } {
  const result: { [email: string]: string } = {};
  
  profiles.forEach(profile => {
    if (profile.dob) {
      result[profile.email] = profile.display_name || profile.email.split('@')[0];
    }
  });

  return result;
}

/**
 * Check if all required family DOBs are available
 */
export function hasRequiredDobs(profiles: Profile[]): boolean {
  return profiles.filter(p => p.dob).length >= 2; // At least 2 family members need DOBs
}

/**
 * Get children profiles (those with 'child' role or inferred from age)
 */
export function getChildrenProfiles(profiles: Profile[]): Profile[] {
  return profiles.filter(profile => {
    if (!profile.dob) return false;
    
    // If role is explicitly set, use that
    if (profile.role === 'child') return true;
    
    // Otherwise, infer from age (assume under 18 are children)
    const age = calculateAge(profile.dob);
    return age < 18;
  });
}