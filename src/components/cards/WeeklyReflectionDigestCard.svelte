<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import { Heart, Users, Calendar } from 'lucide-svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import { profileStore } from '$lib/stores/profileStore';
	import dayjs from 'dayjs';
	import { getUserRole } from '$lib/utils/roles';

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	// Check if user is a parent - only parents can see digest
	let userRole = $derived(getUserRole(session?.user?.email));
	let isParent = $derived(userRole === 'parent');

	// Subscribe to profileStore
	let profiles = $derived($profileStore);

	let loading = $state(true);
	let error = $state('');
	let weeklyReflections = $state<Database['public']['Tables']['reflections']['Row'][]>([]);
	let currentWeekStart = $state('');

	// Calculate current week start (Monday)
	function getWeekStart(date = new Date()): string {
		const d = dayjs(date);
		const monday = d.startOf('week').add(1, 'day'); // dayjs starts week on Sunday, we want Monday
		return monday.format('YYYY-MM-DD');
	}

	function getDisplayName(userId: string): string {
		const profile = profiles.find(p => p.user_id === userId);
		return profile?.display_name || profile?.email?.split('@')[0] || 'Family Member';
	}

	async function loadReflections() {
		if (!session?.user?.id) return;
		
		try {
			loading = true;
			error = '';
			currentWeekStart = getWeekStart();
			
			// Get all family reflections for this week
			const { data: reflections, error: fetchError } = await supabase
				.from('reflections')
				.select('*')
				.eq('week_start', currentWeekStart)
				.order('created_at', { ascending: true });

			if (fetchError) throw fetchError;
			
			weeklyReflections = reflections || [];
		} catch (err) {
			console.error('Error loading weekly reflections:', err);
			error = 'Failed to load family reflections. Please try again.';
		} finally {
			loading = false;
		}
	}

	// Load data when component mounts
	$effect(() => {
		if (session?.user?.id && profiles.length > 0) {
			loadReflections();
		}
	});

	// Show component only if user is parent and there are reflections to display
	let shouldShow = $derived(isParent && weeklyReflections.length > 0);
</script>

<ComponentErrorBoundary componentName="WeeklyReflectionDigestCard">
{#if shouldShow}
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<Users class="w-6 h-6 text-blue-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">
			Family Reflections This Week
		</h3>
	</div>

	{#if loading}
		<Loading size="md" text="Loading family reflections..." />
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-3">
			<p class="text-red-700 text-sm">{error}</p>
		</div>
	{:else if weeklyReflections.length > 0}
		<div class="space-y-3">
			<div class="flex items-center gap-2 text-sm text-gray-600 mb-3">
				<Calendar class="w-4 h-4" aria-hidden="true" />
				<span>Week of {dayjs(currentWeekStart).format('MMM D, YYYY')}</span>
			</div>
			
			{#each weeklyReflections as reflection}
				<div class="bg-gray-50 rounded-lg p-4 border">
					<div class="flex items-start gap-3">
						<span class="text-2xl flex-shrink-0">{reflection.mood_emoji}</span>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<span class="font-medium text-gray-900">
									{getDisplayName(reflection.user_id || '')}
								</span>
								<span class="text-xs text-gray-500">
									{dayjs(reflection.created_at).format('ddd, MMM D')}
								</span>
							</div>
							{#if reflection.reflection_text}
								<p class="text-sm text-gray-700 leading-relaxed">
									{reflection.reflection_text}
								</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
			
			<div class="text-center pt-2">
				<p class="text-xs text-gray-500">
					{weeklyReflections.length} family member{weeklyReflections.length === 1 ? '' : 's'} shared this week
				</p>
			</div>
		</div>
	{:else}
		<div class="text-center py-6">
			<Heart class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-gray-500 text-sm">
				No family reflections yet this week.
			</p>
			<p class="text-gray-400 text-xs mt-1">
				Be the first to share how your week is going!
			</p>
		</div>
	{/if}
</div>
{/if}
</ComponentErrorBoundary>