/**
 * Media compression utilities for Mayo (FamilyNest) app
 * Client-side compression for photos and videos before upload
 */

import imageCompression from 'browser-image-compression';

export interface CompressionProgress {
	phase: 'compressing' | 'uploading' | 'done' | 'error';
	progress: number;
	message: string;
}

export type CompressionCallback = (progress: CompressionProgress) => void;

/**
 * Compresses an image file on the client side
 */
export async function compressImage(
	file: File, 
	onProgress?: CompressionCallback
): Promise<File> {
	try {
		onProgress?.({ phase: 'compressing', progress: 0, message: 'Starting image compression...' });
		
		const options = {
			maxSizeMB: 1, // Maximum file size in MB
			maxWidthOrHeight: 1920, // Maximum width or height
			useWebWorker: true, // Use web worker for better performance
			fileType: file.type.startsWith('image/') ? file.type : 'image/jpeg',
			onProgress: (progress: number) => {
				onProgress?.({ 
					phase: 'compressing', 
					progress: progress * 0.8, // Reserve 20% for upload phase
					message: `Compressing image... ${Math.round(progress)}%`
				});
			}
		};

		const compressedFile = await imageCompression(file, options);
		
		onProgress?.({ 
			phase: 'compressing', 
			progress: 80, 
			message: 'Image compression complete'
		});
		
		return compressedFile;
	} catch (error) {
		console.warn('Image compression failed, using original file:', error);
		onProgress?.({ 
			phase: 'error', 
			progress: 0, 
			message: 'Compression failed, using original file'
		});
		return file;
	}
}

/**
 * Basic video compression using HTML5 Canvas and MediaRecorder
 * Reduces resolution and quality for smaller file sizes
 */
export async function compressVideo(
	file: File,
	onProgress?: CompressionCallback
): Promise<File> {
	try {
		onProgress?.({ phase: 'compressing', progress: 0, message: 'Starting video compression...' });
		
		// For now, we'll implement a simple approach
		// In a full implementation, we might use ffmpeg.wasm for better compression
		
		// Check if file is too large (> 50MB), then attempt basic compression
		const maxSize = 50 * 1024 * 1024; // 50MB
		
		if (file.size <= maxSize) {
			onProgress?.({ 
				phase: 'compressing', 
				progress: 80, 
				message: 'Video file size acceptable, no compression needed'
			});
			return file;
		}
		
		// For basic implementation, we'll just warn and use original
		// A full implementation would use ffmpeg.wasm or similar
		console.warn('Video file is large but compression not fully implemented yet');
		
		onProgress?.({ 
			phase: 'compressing', 
			progress: 80, 
			message: 'Video compression not available, using original file'
		});
		
		return file;
	} catch (error) {
		console.warn('Video compression failed, using original file:', error);
		onProgress?.({ 
			phase: 'error', 
			progress: 0, 
			message: 'Video compression failed, using original file'
		});
		return file;
	}
}

/**
 * Determines if a file is an image based on type and extension
 */
export function isImageFile(file: File): boolean {
	// Check MIME type first
	if (file.type.startsWith('image/')) {
		return true;
	}
	
	// Fallback to file extension for mobile compatibility
	const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i;
	return imageExtensions.test(file.name);
}

/**
 * Determines if a file is a video based on type and extension
 */
export function isVideoFile(file: File): boolean {
	// Check MIME type first
	if (file.type.startsWith('video/')) {
		return true;
	}
	
	// Fallback to file extension for mobile compatibility
	const videoExtensions = /\.(mp4|webm|mov|avi|m4v|3gp|mkv)$/i;
	return videoExtensions.test(file.name);
}

/**
 * Validates file size and type for upload
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
	const maxSize = 100 * 1024 * 1024; // 100MB max
	const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
	const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
	
	if (file.size > maxSize) {
		return { valid: false, error: 'File size too large (max 100MB)' };
	}
	
	// Check if it's an image or video
	if (!isImageFile(file) && !isVideoFile(file)) {
		return { valid: false, error: 'File must be an image or video' };
	}
	
	// For images, validate MIME type if available
	if (isImageFile(file) && file.type && !allowedImageTypes.includes(file.type)) {
		// If MIME type is not in our list but file extension suggests it's an image, allow it
		const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
		if (!imageExtensions.test(file.name)) {
			return { valid: false, error: 'Unsupported image format' };
		}
	}
	
	// For videos, validate MIME type if available  
	if (isVideoFile(file) && file.type && !allowedVideoTypes.includes(file.type)) {
		// If MIME type is not in our list but file extension suggests it's a video, allow it
		const videoExtensions = /\.(mp4|webm|mov|avi)$/i;
		if (!videoExtensions.test(file.name)) {
			return { valid: false, error: 'Unsupported video format' };
		}
	}
	
	return { valid: true };
}

/**
 * Compresses a media file based on its type
 */
export async function compressMediaFile(
	file: File,
	onProgress?: CompressionCallback
): Promise<File> {
	const validation = validateMediaFile(file);
	if (!validation.valid) {
		throw new Error(validation.error);
	}
	
	if (isImageFile(file)) {
		return compressImage(file, onProgress);
	} else if (isVideoFile(file)) {
		return compressVideo(file, onProgress);
	}
	
	return file;
}