import { z } from 'zod';
import { env } from '$env/dynamic/public';

const envSchema = z.object({
  PUBLIC_SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required')
});

export function validateOnStartup() {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`❌ Invalid environment variables: ${details}`);
  }
}

validateOnStartup();

const validatedEnv = envSchema.parse(env);

export const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } = validatedEnv;

export default validatedEnv;

export function getValidatedEnv() {
  return validatedEnv;
}

export type ValidatedEnv = z.infer<typeof envSchema>;
