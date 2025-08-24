import { z } from 'zod'

/**
 * Widget configuration validation schema
 */
export const widgetConfigSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	priority: z.number().int().min(0).default(0),
	enabled: z.boolean().default(true),
	pinned: z.boolean().optional(),
	lastViewed: z.number().int().optional(),
	viewCount: z.number().int().min(0).default(0),
	interactionCount: z.number().int().min(0).default(0),
	engagementScore: z.number().min(0).optional()
}).passthrough()

export type WidgetConfigData = z.infer<typeof widgetConfigSchema>

/**
 * Widget preferences validation schema
 */
export const widgetPreferencesSchema = z.record(
	z.string(),
	widgetConfigSchema.partial()
)

export type WidgetPreferencesData = z.infer<typeof widgetPreferencesSchema>

/**
 * Notification validation schema
 */
export const notificationSchema = z.object({
	id: z.string().min(1),
	type: z.enum(['info', 'success', 'warning', 'error']),
	title: z.string().min(1),
	message: z.string().min(1),
	read: z.boolean().default(false),
	createdAt: z.number().int().positive(),
	data: z.any().optional()
}).passthrough()

export type NotificationData = z.infer<typeof notificationSchema>

/**
 * Notification creation schema
 */
export const notificationCreateSchema = z.object({
	type: z.enum(['info', 'success', 'warning', 'error']),
	title: z.string().min(1),
	message: z.string().min(1),
	data: z.any().optional()
}).strict()

export type NotificationCreateData = z.infer<typeof notificationCreateSchema>