<script lang="ts">
	import { Loader2 } from 'lucide-svelte';

	interface Props {
		/** Size of the loading spinner */
		size?: 'sm' | 'md' | 'lg';
		/** Text to display alongside spinner */
		text?: string;
		/** Whether to show skeleton cards instead of spinner */
		skeleton?: boolean;
		/** Number of skeleton cards to show */
		skeletonCount?: number;
	}

	let { 
		size = 'md', 
		text = 'Loading...', 
		skeleton = false, 
		skeletonCount = 3 
	}: Props = $props();

	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-8 h-8',
		lg: 'w-12 h-12'
	};
</script>

{#if skeleton}
	<!-- Skeleton Loading Cards -->
	<div class="space-y-4" role="status" aria-label="Loading content">
		{#each Array(skeletonCount) as _, i}
			<div class="bg-white rounded-lg shadow-sm border p-6 motion-safe:animate-pulse">
				<div class="flex items-center gap-4 mb-4">
					<div class="w-8 h-8 bg-gray-200 rounded-full"></div>
					<div class="h-5 bg-gray-200 rounded w-1/3"></div>
				</div>
				<div class="space-y-3">
					<div class="h-4 bg-gray-200 rounded w-full"></div>
					<div class="h-4 bg-gray-200 rounded w-3/4"></div>
					<div class="h-4 bg-gray-200 rounded w-1/2"></div>
				</div>
				<div class="flex justify-between items-center mt-4">
					<div class="h-3 bg-gray-200 rounded w-16"></div>
					<div class="h-8 bg-gray-200 rounded w-20"></div>
				</div>
			</div>
		{/each}
		<span class="sr-only">Loading content, please wait...</span>
	</div>
{:else}
	<!-- Spinner Loading -->
	<div class="flex flex-col items-center justify-center py-12" role="status" aria-label="Loading">
		<Loader2 class="{sizeClasses[size]} text-primary-600 motion-safe:animate-spin mb-4" />
		<p class="text-gray-600 text-sm">{text}</p>
		<span class="sr-only">{text}</span>
	</div>
{/if}