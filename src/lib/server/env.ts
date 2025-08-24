import { z } from 'zod';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Environment validation schema
const envSchema = z.object({
  PUBLIC_SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required')
});

/**
 * Validates required environment variables at startup
 * Throws descriptive errors if any are missing or invalid
 */
export function validateOnStartup() {
  const required = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY'];
  
  for (const key of required) {
    const value = key === 'PUBLIC_SUPABASE_URL' ? PUBLIC_SUPABASE_URL : PUBLIC_SUPABASE_ANON_KEY;
    if (!value) {
      throw new Error(`❌ Missing environment variable: ${key}`);
    }
  }
  
  try {
    envSchema.parse({
      PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`❌ Invalid environment variables: ${details}`);
    }
    throw error;
  }
}

// Validate environment variables on import
validateOnStartup();

const validatedEnv = envSchema.parse({
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
});

export default validatedEnv;

// Helper function to get validated environment variables
export function getValidatedEnv() {
  return validatedEnv;
}

// Type-safe environment variables
export type ValidatedEnv = z.infer<typeof envSchema>;