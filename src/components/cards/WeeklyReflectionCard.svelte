<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import { Heart, Smile, Meh, Frown, Sparkles, Check } from 'lucide-svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import { profileStore } from '$lib/stores/profileStore';
	import dayjs from 'dayjs';

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	// Subscribe to profileStore
	let profiles = $derived($profileStore);

	let loading = $state(true);
	let submitting = $state(false);
	let error = $state('');
	let selectedMood = $state('');
	let reflectionText = $state('');
	let hasSubmittedThisWeek = $state(false);
	let currentWeekStart = $state('');

	const moodOptions = [
		{ value: '😃', label: 'Great', color: 'text-green-500' },
		{ value: '😊', label: 'Good', color: 'text-blue-500' },
		{ value: '😐', label: 'Okay', color: 'text-yellow-500' },
		{ value: '😔', label: 'Difficult', color: 'text-orange-500' },
		{ value: '😢', label: 'Tough', color: 'text-red-500' }
	];

	// Calculate current week start (Monday)
	function getWeekStart(date = new Date()): string {
		const d = dayjs(date);
		const monday = d.startOf('week').add(1, 'day'); // dayjs starts week on Sunday, we want Monday
		return monday.format('YYYY-MM-DD');
	}

	async function loadData() {
		if (!session?.user?.id) return;
		
		try {
			loading = true;
			error = '';
			currentWeekStart = getWeekStart();
			
			// Check if user has already submitted for this week
			const { data: existingReflection, error: fetchError } = await supabase
				.from('reflections')
				.select('*')
				.eq('user_id', session.user.id)
				.eq('week_start', currentWeekStart)
				.maybeSingle();

			if (fetchError) throw fetchError;
			
			hasSubmittedThisWeek = !!existingReflection;
			
			if (existingReflection) {
				selectedMood = existingReflection.mood_emoji;
				reflectionText = existingReflection.reflection_text || '';
			}
		} catch (err) {
			console.error('Error loading reflection data:', err);
			error = 'Failed to load reflection data. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function submitReflection() {
		if (!session?.user?.id || !selectedMood || submitting) return;
		
		try {
			submitting = true;
			error = '';
			
			const { error: submitError } = await supabase
				.from('reflections')
				.insert({
					user_id: session.user.id,
					mood_emoji: selectedMood,
					reflection_text: reflectionText.trim() || null,
					week_start: currentWeekStart
				} as Database['public']['Tables']['reflections']['Insert']);

			if (submitError) throw submitError;

			hasSubmittedThisWeek = true;
		} catch (err) {
			console.error('Error submitting reflection:', err);
			error = 'Failed to submit reflection. Please try again.';
		} finally {
			submitting = false;
		}
	}

	// Load data when component mounts
	$effect(() => {
		if (session?.user?.id) {
			loadData();
		}
	});
</script>

<ComponentErrorBoundary componentName="WeeklyReflectionCard">
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<Heart class="w-6 h-6 text-pink-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">
			Weekly Reflection
		</h3>
	</div>

	{#if loading}
		<Loading size="md" text="Loading reflection..." />
	{:else if hasSubmittedThisWeek}
		<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
			<Check class="w-8 h-8 text-green-600 mx-auto mb-2" aria-hidden="true" />
			<p class="text-green-700 font-medium">Thanks for sharing this week!</p>
			<p class="text-green-600 text-sm mt-1">You can submit a new reflection next Monday.</p>
			
			{#if selectedMood || reflectionText}
				<div class="mt-3 p-3 bg-white rounded border">
					<div class="flex items-center justify-center gap-2 mb-2">
						<span class="text-2xl">{selectedMood}</span>
					</div>
					{#if reflectionText}
						<p class="text-sm text-gray-700">{reflectionText}</p>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div class="space-y-4">
			<p class="text-gray-600 text-sm">
				How are you feeling this week? Share your mood and thoughts with the family.
			</p>

			{#if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3">
					<p class="text-red-700 text-sm">{error}</p>
				</div>
			{/if}

			<!-- Mood Selection -->
			<div>
				<fieldset>
					<legend class="block text-sm font-medium text-gray-700 mb-2">
						How are you feeling?
					</legend>
					<div class="grid grid-cols-5 gap-2">
						{#each moodOptions as mood}
							<button
								type="button"
								onclick={() => selectedMood = mood.value}
								class="flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
								class:border-pink-500={selectedMood === mood.value}
								class:bg-pink-50={selectedMood === mood.value}
								class:border-gray-200={selectedMood !== mood.value}
								class:hover:border-gray-300={selectedMood !== mood.value}
								aria-pressed={selectedMood === mood.value}
								aria-label="Select {mood.label} mood"
							>
								<span class="text-2xl">{mood.value}</span>
								<span class="text-xs {mood.color} font-medium">{mood.label}</span>
							</button>
						{/each}
					</div>
				</fieldset>
			</div>

			<!-- Optional Text -->
			<div>
				<label for="reflection-text" class="block text-sm font-medium text-gray-700 mb-2">
					Share more (optional)
				</label>
				<textarea
					id="reflection-text"
					bind:value={reflectionText}
					placeholder="What made this week special? What are you grateful for?"
					rows="3"
					class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none text-sm"
				></textarea>
			</div>

			<button
				type="button"
				onclick={submitReflection}
				disabled={!selectedMood || submitting}
				class="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{#if submitting}
					<Loading size="sm" text="" />
					Submitting...
				{:else}
					Share Reflection
				{/if}
			</button>
		</div>
	{/if}
</div>
</ComponentErrorBoundary>