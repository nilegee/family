<script lang="ts">
	import { extractYouTubeVideoId, isValidYouTubeUrl } from '$lib/utils/youtubeParser';
	import LiteYouTubeEmbed from '../LiteYouTubeEmbed.svelte';

	export let text: string = "";

	// Detect if the text contains only a YouTube URL (for embedding)
	function isYouTubeOnlyText(content: string): { isYouTube: boolean; videoId?: string } {
		const trimmed = content.trim();
		if (isValidYouTubeUrl(trimmed)) {
			const videoId = extractYouTubeVideoId(trimmed);
			return { isYouTube: true, videoId: videoId || undefined };
		}
		return { isYouTube: false };
	}

	// Check for YouTube URL in the text content
	$: youTubeData = isYouTubeOnlyText(text);
</script>

{#if youTubeData.isYouTube && youTubeData.videoId}
	<!-- Render YouTube embed instead of raw URL -->
	<div class="my-3">
		<LiteYouTubeEmbed videoId={youTubeData.videoId} title="Shared YouTube video" />
	</div>
{:else}
	<!-- Regular text content -->
	<p class="break-words overflow-hidden text-ellipsis whitespace-pre-line">
		{text}
	</p>
{/if}