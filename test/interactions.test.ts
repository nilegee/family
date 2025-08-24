import { describe, it, expect } from 'vitest'
import { 
	interactionTypeSchema, 
	interactionSchema,
	interactionCreateSchema,
	type InteractionType 
} from '../src/lib/schema/interactions'

describe('Interactions Schema Validation', () => {
	describe('interactionTypeSchema', () => {
		it('should accept valid interaction types', () => {
			const validTypes = ['like', 'love', 'vote', 'bookmark', 'seen', 'thanks']

			validTypes.forEach(type => {
				const result = interactionTypeSchema.safeParse(type)
				expect(result.success).toBe(true)
				if (result.success) {
					expect(result.data).toBe(type)
				}
			})
		})

		it('should reject invalid interaction types', () => {
			const invalidTypes = ['dislike', 'share', '', null, undefined, 123]

			invalidTypes.forEach(type => {
				const result = interactionTypeSchema.safeParse(type)
				expect(result.success).toBe(false)
			})
		})

		it('should provide correct TypeScript types', () => {
			const type: InteractionType = 'like'
			expect(interactionTypeSchema.parse(type)).toBe(type)
		})
	})

	describe('interactionSchema', () => {
		const validInteraction = {
			item_id: '123e4567-e89b-12d3-a456-426614174000',
			user_email: 'test@example.com',
			type: 'like' as InteractionType,
			answer_index: 1,
			created_at: '2023-01-01T00:00:00Z'
		}

		it('should accept valid interaction data', () => {
			const result = interactionSchema.safeParse(validInteraction)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.item_id).toBe(validInteraction.item_id)
				expect(result.data.type).toBe(validInteraction.type)
			}
		})

		it('should accept interaction without optional fields', () => {
			const minimalInteraction = {
				item_id: '123e4567-e89b-12d3-a456-426614174000',
				user_email: 'test@example.com',
				type: 'like' as InteractionType
			}

			const result = interactionSchema.safeParse(minimalInteraction)
			expect(result.success).toBe(true)
		})

		it('should reject invalid UUID', () => {
			const invalidInteraction = {
				...validInteraction,
				item_id: 'invalid-uuid'
			}

			const result = interactionSchema.safeParse(invalidInteraction)
			expect(result.success).toBe(false)
		})

		it('should reject invalid email', () => {
			const invalidInteraction = {
				...validInteraction,
				user_email: 'not-an-email'
			}

			const result = interactionSchema.safeParse(invalidInteraction)
			expect(result.success).toBe(false)
		})

		it('should reject non-integer answer_index', () => {
			const invalidInteraction = {
				...validInteraction,
				answer_index: 1.5
			}

			const result = interactionSchema.safeParse(invalidInteraction)
			expect(result.success).toBe(false)
		})

		it('should accept null answer_index', () => {
			const interactionWithNullIndex = {
				...validInteraction,
				answer_index: null
			}

			const result = interactionSchema.safeParse(interactionWithNullIndex)
			expect(result.success).toBe(true)
		})
	})

	describe('interactionCreateSchema', () => {
		const validCreateData = {
			item_id: '123e4567-e89b-12d3-a456-426614174000',
			user_email: 'test@example.com',
			type: 'vote' as InteractionType,
			answer_index: 2
		}

		it('should accept valid interaction creation data', () => {
			const result = interactionCreateSchema.safeParse(validCreateData)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.item_id).toBe(validCreateData.item_id)
				expect(result.data.type).toBe(validCreateData.type)
				expect(result.data.answer_index).toBe(validCreateData.answer_index)
			}
		})

		it('should accept creation data without answer_index', () => {
			const dataWithoutIndex = {
				item_id: '123e4567-e89b-12d3-a456-426614174000',
				user_email: 'test@example.com',
				type: 'like' as InteractionType
			}

			const result = interactionCreateSchema.safeParse(dataWithoutIndex)
			expect(result.success).toBe(true)
		})

		it('should reject missing required fields', () => {
			const incompleteData = {
				item_id: '123e4567-e89b-12d3-a456-426614174000',
				type: 'like' as InteractionType
				// missing user_email
			}

			const result = interactionCreateSchema.safeParse(incompleteData)
			expect(result.success).toBe(false)
		})

		it('should reject invalid interaction type', () => {
			const invalidData = {
				...validCreateData,
				type: 'invalid-type'
			}

			const result = interactionCreateSchema.safeParse(invalidData)
			expect(result.success).toBe(false)
		})
	})
})