<script lang="ts">
	import { Play } from 'lucide-svelte';
	
	interface Props {
		videoId: string;
		title?: string;
		class?: string;
	}
	
	let { videoId, title = 'YouTube video', class: className = '' }: Props = $props();
	
	let embedLoaded = $state(false);
	let thumbnailUrl = $derived(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
	let embedUrl = $derived(`https://www.youtube.com/embed/${videoId}?autoplay=1`);
	
	function loadEmbed() {
		embedLoaded = true;
	}
</script>

<div class="relative aspect-video bg-gray-200 rounded-lg overflow-hidden {className}">
	{#if embedLoaded}
		<!-- Full YouTube iframe -->
		<iframe
			src={embedUrl}
			{title}
			frameborder="0"
			allow="autoplay; encrypted-media; picture-in-picture; web-share"
			referrerpolicy="strict-origin-when-cross-origin"
			allowfullscreen
			class="w-full h-full"
		></iframe>
	{:else}
		<!-- Thumbnail with play button -->
		<button
			type="button"
			onclick={loadEmbed}
			class="w-full h-full relative group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
			aria-label="Play video: {title}"
		>
			<img
				src={thumbnailUrl}
				alt="Video thumbnail"
				class="w-full h-full object-cover transition-transform group-hover:scale-105"
			/>
			
			<!-- Play button overlay -->
			<div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-colors">
				<div class="bg-red-600 hover:bg-red-700 text-white rounded-full p-3 sm:p-4 transition-colors shadow-lg">
					<Play class="w-6 h-6 sm:w-8 sm:h-8 ml-1" fill="currentColor" aria-hidden="true" />
				</div>
			</div>
		</button>
	{/if}
</div>