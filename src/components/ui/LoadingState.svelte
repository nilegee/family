<script lang="ts">
	import { Loader2 } from 'lucide-svelte';

	interface Props {
		size?: 'sm' | 'md' | 'lg';
		text?: string;
		fullScreen?: boolean;
	}

	let { size = 'md', text = 'Loading...', fullScreen = false }: Props = $props();

	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-6 h-6', 
		lg: 'w-8 h-8'
	};

	const containerClasses = fullScreen 
		? 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50'
		: 'flex items-center justify-center p-8';
</script>

<div class={containerClasses}>
	<div class="flex flex-col items-center gap-3">
		<Loader2 class={`${sizeClasses[size]} animate-spin text-primary-600`} aria-hidden="true" />
		{#if text}
			<p class="text-sm text-gray-600 font-medium">{text}</p>
		{/if}
	</div>
</div>