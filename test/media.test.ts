import { describe, it, expect } from 'vitest'
import { 
	validateMediaFile, 
	isImageFile, 
	isVideoFile 
} from '../src/lib/utils/mediaCompression'

describe('Media Compression Utility', () => {
	describe('isImageFile', () => {
		it('should return true for image files', () => {
			const imageTypes = [
				'image/jpeg',
				'image/png', 
				'image/gif',
				'image/webp'
			]

			imageTypes.forEach(type => {
				const file = new File(['test'], 'test.jpg', { type })
				expect(isImageFile(file)).toBe(true)
			})
		})

		it('should return false for non-image files', () => {
			const nonImageTypes = [
				'video/mp4',
				'text/plain',
				'application/pdf'
			]

			nonImageTypes.forEach(type => {
				const file = new File(['test'], 'test.mp4', { type })
				expect(isImageFile(file)).toBe(false)
			})
		})
	})

	describe('isVideoFile', () => {
		it('should return true for video files', () => {
			const videoTypes = [
				'video/mp4',
				'video/webm',
				'video/mov',
				'video/avi'
			]

			videoTypes.forEach(type => {
				const file = new File(['test'], 'test.mp4', { type })
				expect(isVideoFile(file)).toBe(true)
			})
		})

		it('should return false for non-video files', () => {
			const nonVideoTypes = [
				'image/jpeg',
				'text/plain',
				'application/pdf'
			]

			nonVideoTypes.forEach(type => {
				const file = new File(['test'], 'test.jpg', { type })
				expect(isVideoFile(file)).toBe(false)
			})
		})
	})

	describe('validateMediaFile', () => {
		it('should validate acceptable image files', () => {
			const file = new File(['x'.repeat(1000)], 'test.jpg', { type: 'image/jpeg' })
			const result = validateMediaFile(file)
			expect(result.valid).toBe(true)
			expect(result.error).toBeUndefined()
		})

		it('should validate acceptable video files', () => {
			const file = new File(['x'.repeat(1000)], 'test.mp4', { type: 'video/mp4' })
			const result = validateMediaFile(file)
			expect(result.valid).toBe(true)
			expect(result.error).toBeUndefined()
		})

		it('should reject files that are too large', () => {
			// Create a file larger than 100MB (using empty content but setting size in metadata won't work in tests)
			// So we'll test the logic conceptually
			const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
			
			// Mock file size to be over limit
			Object.defineProperty(file, 'size', { value: 101 * 1024 * 1024 })
			
			const result = validateMediaFile(file)
			expect(result.valid).toBe(false)
			expect(result.error).toBe('File size too large (max 100MB)')
		})

		it('should reject unsupported image formats', () => {
			const file = new File(['test'], 'test.bmp', { type: 'image/bmp' })
			const result = validateMediaFile(file)
			expect(result.valid).toBe(false)
			expect(result.error).toBe('Unsupported image format')
		})

		it('should reject unsupported video formats', () => {
			const file = new File(['test'], 'test.wmv', { type: 'video/wmv' })
			const result = validateMediaFile(file)
			expect(result.valid).toBe(false)
			expect(result.error).toBe('Unsupported video format')
		})

		it('should reject non-media files', () => {
			const file = new File(['test'], 'test.txt', { type: 'text/plain' })
			const result = validateMediaFile(file)
			expect(result.valid).toBe(false)
			expect(result.error).toBe('File must be an image or video')
		})
	})
})