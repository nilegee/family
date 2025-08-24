import { z } from 'zod'

/**
 * Item kind validation schema
 */
export const itemKindSchema = z.enum(['post', 'comment', 'event', 'ayah', 'poll', 'tip', 'system'])

export type ItemKind = z.infer<typeof itemKindSchema>

/**
 * Item visibility validation schema
 */
export const itemVisibilitySchema = z.enum(['all', 'parents', 'owner'])

export type ItemVisibility = z.infer<typeof itemVisibilitySchema>

/**
 * Base item validation schema
 */
export const itemSchema = z.object({
	id: z.string().uuid().optional(),
	kind: itemKindSchema,
	author_id: z.string().uuid().nullish(),
	author_email: z.string().email(),
	visibility: itemVisibilitySchema.nullish().default('all'),
	body: z.string().nullish(),
	media_urls: z.array(z.string().url()).nullish(),
	parent_id: z.string().uuid().nullish(),
	start_at: z.string().datetime().nullish(),
	end_at: z.string().datetime().nullish(),
	data: z.record(z.string(), z.any()).nullish().default({}),
	is_deleted: z.boolean().nullish().default(false),
	created_at: z.string().datetime().nullish(),
	updated_at: z.string().datetime().nullish()
}).passthrough()

export type ItemData = z.infer<typeof itemSchema>

/**
 * Post creation schema
 */
export const postCreateSchema = z.object({
	kind: z.literal('post'),
	author_email: z.string().email(),
	author_id: z.string().uuid().optional(),
	body: z.string().min(1, 'Post content is required'),
	visibility: itemVisibilitySchema.default('all')
})

export type PostCreateData = z.infer<typeof postCreateSchema>

/**
 * Poll data schema for feedback polls
 */
export const feedbackPollDataSchema = z.object({
	type: z.literal('feedback'),
	mood: z.string().min(1, 'Mood is required'),
	feedback: z.string().min(1, 'Feedback is required'),
	role: z.string().min(1, 'Role is required')
})

/**
 * Poll data schema for option-based polls
 */
export const optionsPollDataSchema = z.object({
	type: z.literal('options'),
	options: z.array(z.string().min(1, 'Option cannot be empty')).min(2, 'Poll must have at least 2 options').max(6, 'Poll can have at most 6 options')
})

/**
 * Combined poll data schema
 */
export const pollDataSchema = z.discriminatedUnion('type', [
	feedbackPollDataSchema,
	optionsPollDataSchema
])

export type PollData = z.infer<typeof pollDataSchema>
export type FeedbackPollData = z.infer<typeof feedbackPollDataSchema>
export type OptionsPollData = z.infer<typeof optionsPollDataSchema>

/**
 * Poll creation schema
 */
export const pollCreateSchema = z.object({
	kind: z.literal('poll'),
	author_email: z.string().email(),
	author_id: z.string().uuid().optional(),
	body: z.string().min(1, 'Poll question is required'),
	data: pollDataSchema,
	visibility: itemVisibilitySchema.default('all')
})

export type PollCreateData = z.infer<typeof pollCreateSchema>

/**
 * Comment creation schema
 */
export const commentCreateSchema = z.object({
	kind: z.literal('comment'),
	author_email: z.string().email(),
	author_id: z.string().uuid().optional(),
	body: z.string().min(1, 'Comment content is required'),
	parent_id: z.string().uuid(),
	visibility: itemVisibilitySchema.default('all')
})

export type CommentCreateData = z.infer<typeof commentCreateSchema>

/**
 * Media post creation schema
 */
export const mediaPostCreateSchema = z.object({
	kind: z.literal('post'),
	author_email: z.string().email(),
	author_id: z.string().uuid().optional(),
	body: z.string().optional(),
	media_urls: z.array(z.string().url()).min(1, 'At least one media URL is required'),
	visibility: itemVisibilitySchema.default('all')
})

export type MediaPostCreateData = z.infer<typeof mediaPostCreateSchema>