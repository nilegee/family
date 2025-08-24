<script lang="ts">
	import { AlertTriangle, RefreshCw, X } from 'lucide-svelte';

	interface Props {
		title?: string;
		message: string;
		type?: 'error' | 'warning' | 'info';
		dismissible?: boolean;
		retryable?: boolean;
		onDismiss?: () => void;
		onRetry?: () => void;
	}

	let { 
		title,
		message,
		type = 'error',
		dismissible = false,
		retryable = false,
		onDismiss,
		onRetry
	}: Props = $props();

	const typeStyles = {
		error: {
			container: 'bg-red-50 border-red-200',
			icon: 'text-red-500',
			title: 'text-red-800',
			message: 'text-red-700',
			button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
		},
		warning: {
			container: 'bg-yellow-50 border-yellow-200',
			icon: 'text-yellow-500',
			title: 'text-yellow-800',
			message: 'text-yellow-700',
			button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
		},
		info: {
			container: 'bg-blue-50 border-blue-200',
			icon: 'text-blue-500',
			title: 'text-blue-800',
			message: 'text-blue-700',
			button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
		}
	};

	const styles = typeStyles[type];
</script>

<div class={`border rounded-lg p-4 ${styles.container}`}>
	<div class="flex items-start gap-3">
		<AlertTriangle class={`w-5 h-5 mt-0.5 ${styles.icon}`} aria-hidden="true" />
		
		<div class="flex-1 min-w-0">
			{#if title}
				<h3 class={`text-sm font-medium ${styles.title} mb-1`}>
					{title}
				</h3>
			{/if}
			<p class={`text-sm ${styles.message}`}>
				{message}
			</p>
			
			{#if retryable && onRetry}
				<div class="mt-3">
					<button
						onclick={onRetry}
						class={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
					>
						<RefreshCw class="w-4 h-4" aria-hidden="true" />
						Try Again
					</button>
				</div>
			{/if}
		</div>
		
		{#if dismissible && onDismiss}
			<button
				onclick={onDismiss}
				class={`p-1 rounded-lg transition-colors hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button.split(' ')[0]}`}
				aria-label="Dismiss"
			>
				<X class="w-4 h-4" aria-hidden="true" />
			</button>
		{/if}
	</div>
</div>