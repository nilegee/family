import { describe, it, expect } from 'vitest'
import { 
	extractYouTubeVideoId, 
	isValidYouTubeUrl, 
	getYouTubeEmbedUrl, 
	parseYouTubeUrl,
	getYouTubeThumbnail
} from '../src/lib/utils/youtubeParser'

describe('YouTube Parser Utility', () => {
	describe('extractYouTubeVideoId', () => {
		it('should extract video ID from youtube.com/watch URLs', () => {
			const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			const result = extractYouTubeVideoId(url)
			expect(result).toBe('dQw4w9WgXcQ')
		})

		it('should extract video ID from youtu.be URLs', () => {
			const url = 'https://youtu.be/dQw4w9WgXcQ'
			const result = extractYouTubeVideoId(url)
			expect(result).toBe('dQw4w9WgXcQ')
		})

		it('should extract video ID from youtube.com/embed URLs', () => {
			const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
			const result = extractYouTubeVideoId(url)
			expect(result).toBe('dQw4w9WgXcQ')
		})

		it('should handle youtube.com without www', () => {
			const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ'
			const result = extractYouTubeVideoId(url)
			expect(result).toBe('dQw4w9WgXcQ')
		})

		it('should return null for non-YouTube URLs', () => {
			const url = 'https://example.com/video'
			const result = extractYouTubeVideoId(url)
			expect(result).toBeNull()
		})

		it('should return null for invalid URLs', () => {
			const url = 'not-a-url'
			const result = extractYouTubeVideoId(url)
			expect(result).toBeNull()
		})

		it('should return null for YouTube URLs without video ID', () => {
			const url = 'https://www.youtube.com'
			const result = extractYouTubeVideoId(url)
			expect(result).toBeNull()
		})
	})

	describe('isValidYouTubeUrl', () => {
		it('should return true for valid YouTube URLs', () => {
			const urls = [
				'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				'https://youtu.be/dQw4w9WgXcQ',
				'https://youtube.com/watch?v=dQw4w9WgXcQ'
			]

			urls.forEach(url => {
				expect(isValidYouTubeUrl(url)).toBe(true)
			})
		})

		it('should return false for invalid YouTube URLs', () => {
			const urls = [
				'https://example.com/video',
				'https://www.youtube.com',
				'not-a-url',
				'https://www.youtube.com/watch?v=short', // Too short video ID
				'https://www.youtube.com/watch?v=toolongvideoidhere' // Too long video ID
			]

			urls.forEach(url => {
				expect(isValidYouTubeUrl(url)).toBe(false)
			})
		})
	})

	describe('getYouTubeEmbedUrl', () => {
		it('should convert YouTube URL to embed URL', () => {
			const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			const result = getYouTubeEmbedUrl(url)
			expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
		})

		it('should return null for invalid URLs', () => {
			const url = 'https://example.com/video'
			const result = getYouTubeEmbedUrl(url)
			expect(result).toBeNull()
		})
	})

	describe('getYouTubeThumbnail', () => {
		it('should generate correct thumbnail URL', () => {
			const videoId = 'dQw4w9WgXcQ'
			const result = getYouTubeThumbnail(videoId)
			expect(result).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
		})
	})

	describe('parseYouTubeUrl', () => {
		it('should parse valid YouTube URL and return metadata', () => {
			const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
			const result = parseYouTubeUrl(url)
			
			expect(result).toEqual({
				videoId: 'dQw4w9WgXcQ',
				embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
				thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
				isValid: true
			})
		})

		it('should return null for invalid URLs', () => {
			const url = 'https://example.com/video'
			const result = parseYouTubeUrl(url)
			expect(result).toBeNull()
		})
	})
})