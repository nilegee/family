import { describe, it, expect } from 'vitest'
import { 
	widgetConfigSchema, 
	widgetPreferencesSchema,
	notificationSchema,
	notificationCreateSchema 
} from '../src/lib/schema/ui'

describe('UI Schema Validation', () => {
	describe('widgetConfigSchema', () => {
		const validConfig = {
			id: 'birthday-card',
			name: 'Birthday Card',
			priority: 10,
			enabled: true,
			pinned: false,
			lastViewed: 1640995200000,
			viewCount: 5,
			interactionCount: 2,
			engagementScore: 15.5
		}

		it('should accept valid widget configuration', () => {
			const result = widgetConfigSchema.safeParse(validConfig)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.id).toBe(validConfig.id)
				expect(result.data.name).toBe(validConfig.name)
				expect(result.data.priority).toBe(validConfig.priority)
			}
		})

		it('should accept minimal widget configuration with defaults', () => {
			const minimalConfig = {
				id: 'test-widget',
				name: 'Test Widget'
			}

			const result = widgetConfigSchema.safeParse(minimalConfig)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.priority).toBe(0) // default
				expect(result.data.enabled).toBe(true) // default
				expect(result.data.viewCount).toBe(0) // default
				expect(result.data.interactionCount).toBe(0) // default
			}
		})

		it('should reject empty id', () => {
			const invalidConfig = {
				...validConfig,
				id: ''
			}

			const result = widgetConfigSchema.safeParse(invalidConfig)
			expect(result.success).toBe(false)
		})

		it('should reject empty name', () => {
			const invalidConfig = {
				...validConfig,
				name: ''
			}

			const result = widgetConfigSchema.safeParse(invalidConfig)
			expect(result.success).toBe(false)
		})

		it('should reject negative priority', () => {
			const invalidConfig = {
				...validConfig,
				priority: -1
			}

			const result = widgetConfigSchema.safeParse(invalidConfig)
			expect(result.success).toBe(false)
		})

		it('should reject negative viewCount', () => {
			const invalidConfig = {
				...validConfig,
				viewCount: -1
			}

			const result = widgetConfigSchema.safeParse(invalidConfig)
			expect(result.success).toBe(false)
		})

		it('should reject negative interactionCount', () => {
			const invalidConfig = {
				...validConfig,
				interactionCount: -1
			}

			const result = widgetConfigSchema.safeParse(invalidConfig)
			expect(result.success).toBe(false)
		})

		it('should reject negative engagementScore', () => {
			const invalidConfig = {
				...validConfig,
				engagementScore: -1
			}

			const result = widgetConfigSchema.safeParse(invalidConfig)
			expect(result.success).toBe(false)
		})
	})

	describe('widgetPreferencesSchema', () => {
		it('should accept valid widget preferences', () => {
			const validPreferences = {
				'birthday-card': {
					pinned: true,
					viewCount: 10
				},
				'ayah-card': {
					enabled: false,
					priority: 5
				}
			}

			const result = widgetPreferencesSchema.safeParse(validPreferences)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data['birthday-card']?.pinned).toBe(true)
				expect(result.data['ayah-card']?.enabled).toBe(false)
			}
		})

		it('should accept empty preferences', () => {
			const result = widgetPreferencesSchema.safeParse({})
			expect(result.success).toBe(true)
		})
	})

	describe('notificationSchema', () => {
		const validNotification = {
			id: 'notif-123',
			type: 'info' as const,
			title: 'New Message',
			message: 'You have a new family post',
			read: false,
			createdAt: 1640995200000,
			data: { itemId: 'post-123' }
		}

		it('should accept valid notification', () => {
			const result = notificationSchema.safeParse(validNotification)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.id).toBe(validNotification.id)
				expect(result.data.type).toBe(validNotification.type)
				expect(result.data.title).toBe(validNotification.title)
			}
		})

		it('should accept notification without data', () => {
			const notificationWithoutData = {
				id: 'notif-123',
				type: 'success' as const,
				title: 'Success',
				message: 'Operation completed',
				read: true,
				createdAt: 1640995200000
			}

			const result = notificationSchema.safeParse(notificationWithoutData)
			expect(result.success).toBe(true)
		})

		it('should use default value for read field', () => {
			const notificationWithoutRead = {
				id: 'notif-123',
				type: 'warning' as const,
				title: 'Warning',
				message: 'Please check this',
				createdAt: 1640995200000
			}

			const result = notificationSchema.safeParse(notificationWithoutRead)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.read).toBe(false) // default value
			}
		})

		it('should reject invalid notification type', () => {
			const invalidNotification = {
				...validNotification,
				type: 'invalid-type'
			}

			const result = notificationSchema.safeParse(invalidNotification)
			expect(result.success).toBe(false)
		})

		it('should reject empty title', () => {
			const invalidNotification = {
				...validNotification,
				title: ''
			}

			const result = notificationSchema.safeParse(invalidNotification)
			expect(result.success).toBe(false)
		})

		it('should reject empty message', () => {
			const invalidNotification = {
				...validNotification,
				message: ''
			}

			const result = notificationSchema.safeParse(invalidNotification)
			expect(result.success).toBe(false)
		})

		it('should reject non-positive createdAt', () => {
			const invalidNotification = {
				...validNotification,
				createdAt: 0
			}

			const result = notificationSchema.safeParse(invalidNotification)
			expect(result.success).toBe(false)
		})
	})

	describe('notificationCreateSchema', () => {
		const validCreateData = {
			type: 'error' as const,
			title: 'Error Occurred',
			message: 'Something went wrong',
			data: { error: 'Connection failed' }
		}

		it('should accept valid notification creation data', () => {
			const result = notificationCreateSchema.safeParse(validCreateData)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.type).toBe(validCreateData.type)
				expect(result.data.title).toBe(validCreateData.title)
				expect(result.data.data).toEqual(validCreateData.data)
			}
		})

		it('should accept creation data without optional data field', () => {
			const createDataWithoutData = {
				type: 'info' as const,
				title: 'Information',
				message: 'This is just info'
			}

			const result = notificationCreateSchema.safeParse(createDataWithoutData)
			expect(result.success).toBe(true)
		})

		it('should reject creation data with unknown fields due to strict mode', () => {
			const createDataWithExtra = {
				type: 'info' as const,
				title: 'Test',
				message: 'Test message',
				id: 'should-not-be-here'
			}

			const result = notificationCreateSchema.safeParse(createDataWithExtra)
			expect(result.success).toBe(false)
		})

		it('should reject creation data with read field', () => {
			const createDataWithRead = {
				...validCreateData,
				read: true
			}

			const result = notificationCreateSchema.safeParse(createDataWithRead)
			expect(result.success).toBe(false)
		})

		it('should reject creation data with createdAt field', () => {
			const createDataWithCreatedAt = {
				...validCreateData,
				createdAt: Date.now()
			}

			const result = notificationCreateSchema.safeParse(createDataWithCreatedAt)
			expect(result.success).toBe(false)
		})
	})
})