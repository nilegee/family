<script lang="ts">
	import { AlertTriangle } from 'lucide-svelte';

	interface Props {
		componentName?: string;
		children: any;
	}

	let { componentName = 'Component', children }: Props = $props();

	let hasError = $state(false);
	let errorMessage = $state('');

	// Simple error catcher for async operations within components
	export function catchError(error: any) {
		console.error(`Error in ${componentName}:`, error);
		hasError = true;
		errorMessage = error?.message || 'An unexpected error occurred';
	}

	export function reset() {
		hasError = false;
		errorMessage = '';
	}
</script>

{#if hasError}
	<div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
		<div class="flex items-start gap-3">
			<AlertTriangle class="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
			<div class="flex-1">
				<h3 class="text-sm font-medium text-orange-800">
					{componentName} Error
				</h3>
				<p class="text-sm text-orange-700 mt-1">
					{errorMessage}
				</p>
				<button
					onclick={reset}
					class="mt-2 text-xs text-orange-600 hover:text-orange-800 underline focus:outline-none"
				>
					Try again
				</button>
			</div>
		</div>
	</div>
{:else}
	{@render children()}
{/if}