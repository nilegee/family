<script lang="ts">
	interface Props {
		src?: string;
		alt?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		fallback?: string;
		loading?: 'lazy' | 'eager';
	}

	let { src, alt = '', size = 'md', fallback, loading = 'lazy' }: Props = $props();

	let sizeClasses = $derived(() => {
		switch (size) {
			case 'sm': return 'w-8 h-8 text-sm';
			case 'md': return 'w-10 h-10 text-base';
			case 'lg': return 'w-12 h-12 text-lg';
			case 'xl': return 'w-16 h-16 text-xl';
			default: return 'w-10 h-10 text-base';
		}
	});

	let showFallback = $state(false);

	function handleImageError() {
		showFallback = true;
	}

	// Generate fallback text from alt or provided fallback
	let fallbackText = $derived(() => {
		if (fallback) return fallback;
		if (alt) return alt.charAt(0).toUpperCase();
		return 'U';
	});
</script>

{#if src && !showFallback}
	<img 
		{src} 
		{alt}
		{loading}
		class="rounded-full object-cover border-2 border-gray-200 {sizeClasses()}"
		onerror={handleImageError}
	/>
{:else}
	<div class="bg-primary-100 rounded-full flex items-center justify-center border-2 border-gray-200 {sizeClasses()}">
		<span class="text-primary-600 font-semibold">
			{fallbackText()}
		</span>
	</div>
{/if}