/**
 * YouTube URL parser utility for Mayo (FamilyNest) app
 * Normalizes YouTube URLs to embed links for inline rendering
 */

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
	try {
		const urlObj = new URL(url);
		
		// Handle youtu.be short links
		if (urlObj.hostname === 'youtu.be') {
			return urlObj.pathname.slice(1);
		}
		
		// Handle youtube.com URLs
		if (urlObj.hostname.includes('youtube.com')) {
			// Handle /watch?v= format
			if (urlObj.pathname === '/watch') {
				return urlObj.searchParams.get('v');
			}
			
			// Handle /embed/ format
			if (urlObj.pathname.startsWith('/embed/')) {
				return urlObj.pathname.slice(7);
			}
		}
		
		return null;
	} catch {
		return null;
	}
}

/**
 * Validates if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
	const videoId = extractYouTubeVideoId(url);
	return videoId !== null && videoId.length === 11;
}

/**
 * Converts a YouTube URL to an embed URL
 */
export function getYouTubeEmbedUrl(url: string): string | null {
	const videoId = extractYouTubeVideoId(url);
	if (!videoId) return null;
	
	return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Gets YouTube thumbnail URL for a video ID
 */
export function getYouTubeThumbnail(videoId: string): string {
	return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Parses a YouTube URL and returns useful metadata
 */
export interface YouTubeVideoInfo {
	videoId: string;
	embedUrl: string;
	thumbnailUrl: string;
	isValid: boolean;
}

export function parseYouTubeUrl(url: string): YouTubeVideoInfo | null {
	const videoId = extractYouTubeVideoId(url);
	
	if (!videoId) {
		return null;
	}
	
	return {
		videoId,
		embedUrl: `https://www.youtube.com/embed/${videoId}`,
		thumbnailUrl: getYouTubeThumbnail(videoId),
		isValid: true
	};
}