import { z } from 'zod'

/**
 * Interaction type validation schema
 */
export const interactionTypeSchema = z.enum(['like', 'love', 'vote', 'bookmark', 'seen', 'thanks'])

export type InteractionType = z.infer<typeof interactionTypeSchema>

/**
 * Interaction validation schema
 */
export const interactionSchema = z.object({
	item_id: z.string().uuid(),
	user_email: z.string().email(),
	type: interactionTypeSchema,
	answer_index: z.number().int().nullish(),
	created_at: z.string().datetime().nullish()
}).passthrough()

export type InteractionData = z.infer<typeof interactionSchema>

/**
 * Interaction creation schema
 */
export const interactionCreateSchema = z.object({
	item_id: z.string().uuid(),
	user_email: z.string().email(),
	type: interactionTypeSchema,
	answer_index: z.number().int().nullish()
})

export type InteractionCreateData = z.infer<typeof interactionCreateSchema>