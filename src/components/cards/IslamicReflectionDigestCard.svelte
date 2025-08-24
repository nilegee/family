<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import { BookOpen, Star, CheckCircle } from 'lucide-svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import { getUserRole } from '$lib/utils/roles';

	dayjs.extend(relativeTime);

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	// Check if user is a parent - only parents can see digest
	let userRole = $derived(getUserRole(session?.user?.email));
	let isParent = $derived(userRole === 'parent');

	let loading = $state(true);
	let error = $state('');
	let islamicEntries = $state<Database['public']['Tables']['islamic_questions']['Row'][]>([]);

	type IslamicQuestion = Database['public']['Tables']['islamic_questions']['Row'];

	// Get 1-2 past Islamic Q&A entries for digest
	async function loadIslamicDigest() {
		try {
			loading = true;
			error = '';

			const { data: allQuestions, error: fetchError } = await supabase
				.from('islamic_questions')
				.select('*')
				.order('order_index')
				.limit(2);

			if (fetchError) throw fetchError;

			if (allQuestions && allQuestions.length > 0) {
				islamicEntries = allQuestions;
			}
		} catch (err) {
			console.error('Error loading Islamic digest:', err);
			error = 'Failed to load Islamic reflection digest. Please try again.';
		} finally {
			loading = false;
		}
	}

	// Load digest on mount
	$effect(() => {
		if (session && isParent) {
			loadIslamicDigest();
		}
	});
</script>

<ComponentErrorBoundary componentName="IslamicReflectionDigestCard">
{#if !isParent}
	<!-- Only visible to parents -->
	<div class="hidden"></div>
{:else}
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<BookOpen class="w-6 h-6 text-green-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">Islamic Reflection Digest</h3>
	</div>

	{#if loading}
		<Loading text="Loading Islamic reflections..." />
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4">
			<p class="text-sm text-red-700">{error}</p>
		</div>
	{:else if islamicEntries.length > 0}
		<div class="space-y-4">
			<p class="text-sm text-gray-600 mb-3">
				Recent Islamic Q&A topics for family reflection and discussion.
			</p>
			
			{#each islamicEntries as entry}
				<div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
					<div class="flex items-start gap-3">
						<div class="flex-shrink-0">
							<Star class="w-5 h-5 text-green-500 mt-0.5" aria-hidden="true" />
						</div>
						<div class="flex-1 min-w-0">
							<h4 class="text-sm font-medium text-gray-900 mb-2">
								{entry.question_text}
							</h4>
							
							{#if entry.category}
								<div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
									{entry.category}
								</div>
							{/if}
							
							{#if entry.explanation_correct}
								<div class="text-xs text-gray-600 bg-white border border-gray-200 rounded p-2">
									<div class="flex items-start gap-2">
										<CheckCircle class="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
										<div>
											<span class="font-medium">Key Teaching:</span>
											<span class="ml-1">{entry.explanation_correct}</span>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
			
			<div class="text-center pt-3">
				<p class="text-xs text-gray-500">
					💚 These topics offer opportunities for gentle family discussions about Islamic values.
				</p>
			</div>
		</div>
	{:else}
		<div class="text-center py-8">
			<BookOpen class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-sm text-gray-500">No Islamic Q&A entries yet.</p>
			<p class="text-xs text-gray-400 mt-1">Check back later for reflection topics.</p>
		</div>
	{/if}
</div>
{/if}
</ComponentErrorBoundary>