<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { CheckCircle, ArrowRight } from 'lucide-svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	let showQuietMode = $state(false);

	function toggleQuietMode() {
		showQuietMode = !showQuietMode;
	}
</script>

<ComponentErrorBoundary componentName="ClosingRitualCard">
<div class="card bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
	<div class="text-center space-y-4">
		<div class="flex justify-center">
			<CheckCircle class="w-12 h-12 text-green-500" aria-hidden="true" />
		</div>
		
		<div class="space-y-2">
			<h3 class="text-lg font-semibold text-gray-900">
				✅ You're all caught up today
			</h3>
			<p class="text-sm text-gray-600">
				Great job staying connected with your family today!
			</p>
		</div>

		<button
			onclick={toggleQuietMode}
			class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-300 hover:border-primary-400 rounded-lg transition-colors"
			aria-expanded={showQuietMode}
		>
			Want to explore more?
			<ArrowRight class="w-4 h-4" aria-hidden="true" />
		</button>

		{#if showQuietMode}
			<div class="mt-4 p-4 bg-white rounded-lg border border-gray-200">
				<p class="text-sm text-gray-600 mb-3">
					Explore additional activities and memories:
				</p>
				<div class="grid grid-cols-2 gap-2 text-xs">
					<span class="px-2 py-1 bg-gray-100 rounded text-gray-700">📸 Family Feed</span>
					<span class="px-2 py-1 bg-gray-100 rounded text-gray-700">💙 Reflections</span>
					<span class="px-2 py-1 bg-gray-100 rounded text-gray-700">👤 Fun Profiles</span>
					<span class="px-2 py-1 bg-gray-100 rounded text-gray-700">🕹️ Age Games</span>
					<span class="px-2 py-1 bg-gray-100 rounded text-gray-700">👩‍👩‍👦 Family Roles</span>
					<span class="px-2 py-1 bg-gray-100 rounded text-gray-700">📚 Archives</span>
				</div>
			</div>
		{/if}
	</div>
</div>
</ComponentErrorBoundary>