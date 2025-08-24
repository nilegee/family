<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { AlertTriangle, RefreshCw, Home } from 'lucide-svelte';

	interface Props {
		fallback?: boolean;
		showDetails?: boolean;
		children: any;
	}

	let { fallback = false, showDetails = false, children }: Props = $props();

	let hasError = $state(false);
	let errorMessage = $state('');
	let errorStack = $state('');

	// Global error handler for unhandled promise rejections
	function handleUnhandledRejection(event: PromiseRejectionEvent) {
		console.error('Unhandled promise rejection:', event.reason);
		
		hasError = true;
		errorMessage = event.reason?.message || 'An unhandled promise rejection occurred';
		errorStack = event.reason?.stack || '';
		
		// Prevent the default browser behavior
		event.preventDefault();
	}

	// Global error handler for JavaScript errors
	function handleError(event: ErrorEvent) {
		console.error('JavaScript error:', event.error);
		
		hasError = true;
		errorMessage = event.message || 'A JavaScript error occurred';
		errorStack = event.error?.stack || '';
	}

	onMount(() => {
		// Add global error listeners
		window.addEventListener('unhandledrejection', handleUnhandledRejection);
		window.addEventListener('error', handleError);
	});

	onDestroy(() => {
		// Remove global error listeners
		window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		window.removeEventListener('error', handleError);
	});

	function retry() {
		hasError = false;
		errorMessage = '';
		errorStack = '';
	}

	function goHome() {
		window.location.href = '/dashboard';
	}
</script>

{#if hasError}
	<div class={fallback ? "min-h-screen bg-gray-50 flex items-center justify-center p-4" : "bg-red-50 border border-red-200 rounded-lg p-4 my-4"}>
		<div class={fallback ? "max-w-md w-full text-center" : "text-center"}>
			<div class={fallback ? "bg-white rounded-lg shadow-lg p-8" : ""}>
				<div class="mb-4">
					<AlertTriangle class={fallback ? "w-16 h-16 text-red-500 mx-auto mb-4" : "w-8 h-8 text-red-500 mx-auto mb-2"} aria-hidden="true" />
					<h2 class={fallback ? "text-2xl font-bold text-gray-900 mb-2" : "text-lg font-semibold text-red-800 mb-2"}>
						Something went wrong
					</h2>
					<p class="text-red-700 text-sm">
						{errorMessage}
					</p>
				</div>

				{#if showDetails && errorStack}
					<details class="mb-4 text-left">
						<summary class="text-sm text-red-600 cursor-pointer hover:text-red-800">
							Show technical details
						</summary>
						<pre class="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-32">
							{errorStack}
						</pre>
					</details>
				{/if}

				<div class={fallback ? "space-y-3" : "flex gap-2 justify-center"}>
					<button
						onclick={retry}
						class={fallback 
							? "w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
							: "flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"}
					>
						<RefreshCw class="w-4 h-4" aria-hidden="true" />
						Try Again
					</button>

					{#if fallback}
						<button
							onclick={goHome}
							class="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
						>
							<Home class="w-4 h-4" aria-hidden="true" />
							Go Home
						</button>
					{/if}
				</div>

				{#if fallback}
					<div class="mt-6 pt-6 border-t border-gray-200">
						<p class="text-xs text-gray-500">
							If this problem persists, please contact your family administrator.
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	{@render children()}
{/if}