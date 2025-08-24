import { describe, it, expect } from 'vitest'
import { validateMediaFile, isImageFile, isVideoFile } from '../src/lib/utils/mediaCompression'

describe('Mobile Upload Fixes', () => {
  describe('File type detection with fallback for mobile', () => {
    it('should detect image files by MIME type', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      expect(isImageFile(file)).toBe(true)
    })

    it('should detect image files by extension when MIME type is missing', () => {
      const file = new File([''], 'test.jpg', { type: '' })
      expect(isImageFile(file)).toBe(true)
    })

    it('should detect video files by MIME type', () => {
      const file = new File([''], 'test.mp4', { type: 'video/mp4' })
      expect(isVideoFile(file)).toBe(true)
    })

    it('should detect video files by extension when MIME type is missing', () => {
      const file = new File([''], 'test.mp4', { type: '' })
      expect(isVideoFile(file)).toBe(true)
    })

    it('should handle mobile camera images with missing MIME types', () => {
      // Simulate mobile camera file with missing MIME type
      const file = new File([''], 'IMG_20231201_123456.jpg', { type: '' })
      expect(isImageFile(file)).toBe(true)
      expect(validateMediaFile(file).valid).toBe(true)
    })

    it('should handle mobile video files with missing MIME types', () => {
      // Simulate mobile video file with missing MIME type  
      const file = new File([''], 'VID_20231201_123456.mp4', { type: '' })
      expect(isVideoFile(file)).toBe(true)
      expect(validateMediaFile(file).valid).toBe(true)
    })

    it('should reject non-media files even with missing MIME types', () => {
      const file = new File([''], 'document.pdf', { type: '' })
      expect(isImageFile(file)).toBe(false)
      expect(isVideoFile(file)).toBe(false)
      expect(validateMediaFile(file).valid).toBe(false)
    })

    it('should handle file validation with unknown MIME types but valid extensions', () => {
      // Mobile browsers sometimes provide non-standard MIME types
      const file = new File([''], 'photo.jpg', { type: 'application/octet-stream' })
      expect(isImageFile(file)).toBe(true)
      expect(validateMediaFile(file).valid).toBe(true)
    })

    it('should support additional mobile video formats', () => {
      const formats = ['3gp', 'm4v', 'mkv']
      formats.forEach(ext => {
        const file = new File([''], `video.${ext}`, { type: '' })
        expect(isVideoFile(file)).toBe(true)
      })
    })

    it('should validate file size limits', () => {
      // Create a file that's too large (over 100MB)
      const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      expect(validateMediaFile(largeFile).valid).toBe(false)
      expect(validateMediaFile(largeFile).error).toContain('too large')
    })
  })
})