<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import { Heart, Mic, MicOff, Volume2 } from 'lucide-svelte';
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
	let hasSubmittedToday = $state(false);
	let isRecording = $state(false);
	let showVoiceInput = $state(false);

	// Emoji-only quick tap options
	const moodOptions = [
		{ value: '😊', label: 'Happy', description: 'Feeling great today!' },
		{ value: '😐', label: 'Neutral', description: 'An okay day' },
		{ value: '😔', label: 'Sad', description: 'Feeling down today' }
	];

	// Get today's week start (Monday) to match schema
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
			const weekStart = getWeekStart();
			
			// Check if user has already submitted for this week
			const { data: existingReflection, error: fetchError } = await supabase
				.from('reflections')
				.select('*')
				.eq('user_id', session.user.id)
				.eq('week_start', weekStart)
				.maybeSingle();

			if (fetchError) throw fetchError;

			if (existingReflection) {
				hasSubmittedToday = true;
				selectedMood = existingReflection.mood_emoji || '';
				reflectionText = existingReflection.reflection_text || '';
			} else {
				hasSubmittedToday = false;
				selectedMood = '';
				reflectionText = '';
			}

		} catch (err) {
			console.error('Error loading reflection data:', err);
			error = 'Failed to load reflection data. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function submitReflection() {
		if (!session?.user?.id || (!selectedMood && !reflectionText)) return;

		try {
			submitting = true;
			error = '';
			const weekStart = getWeekStart();

			const { error: upsertError } = await supabase
				.from('reflections')
				.upsert({
					user_id: session.user.id,
					week_start: weekStart,
					mood_emoji: selectedMood,
					reflection_text: reflectionText.trim() || null,
					created_at: new Date().toISOString()
				}, {
					onConflict: 'user_id,week_start'
				});

			if (upsertError) throw upsertError;

			hasSubmittedToday = true;

		} catch (err) {
			console.error('Error submitting reflection:', err);
			error = 'Failed to save reflection. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function selectMood(mood: string) {
		selectedMood = mood;
		// Auto-submit if just selecting mood
		if (!showVoiceInput) {
			submitReflection();
		}
	}

	function toggleVoiceInput() {
		showVoiceInput = !showVoiceInput;
	}

	// Simulate voice input (in real app, this would use Web Speech API)
	function toggleRecording() {
		isRecording = !isRecording;
		if (isRecording) {
			// In real implementation, start speech recognition
			console.log('Starting voice recording...');
		} else {
			// In real implementation, stop speech recognition and process
			console.log('Stopping voice recording...');
		}
	}

	// Load data on mount
	$effect(() => {
		loadData();
	});
</script>

<ComponentErrorBoundary componentName="ReflectionMoodCard">
<div class="card bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
	{#if loading}
		<Loading size="sm" />
	{:else}
		<div class="space-y-4">
			<div class="flex items-center gap-2">
				<Heart class="w-6 h-6 text-pink-500" aria-hidden="true" />
				<h3 class="text-lg font-semibold text-gray-900">How are you feeling today?</h3>
			</div>

			{#if error}
				<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			{/if}

			{#if hasSubmittedToday}
				<div class="text-center space-y-3">
					<div class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
						<span class="text-2xl">{selectedMood}</span>
						<span class="text-sm font-medium">Thanks for sharing!</span>
					</div>
					
					{#if reflectionText}
						<div class="p-3 bg-white rounded-lg border border-gray-200">
							<p class="text-sm text-gray-700 italic">"{reflectionText}"</p>
						</div>
					{/if}
					
					<p class="text-xs text-gray-500">
						You can update your mood anytime by tapping a new emoji.
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					<!-- Quick mood selection -->
					<div class="grid grid-cols-3 gap-3">
						{#each moodOptions as option}
							<button
								onclick={() => selectMood(option.value)}
								class="flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105 {selectedMood === option.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-white'}"
								aria-label="Select {option.label} mood"
							>
								<span class="text-3xl">{option.value}</span>
								<span class="text-xs font-medium text-gray-700">{option.label}</span>
							</button>
						{/each}
					</div>

					<!-- Optional voice input toggle -->
					<div class="text-center">
						<button
							onclick={toggleVoiceInput}
							class="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
						>
							<Mic class="w-4 h-4" aria-hidden="true" />
							{showVoiceInput ? 'Hide' : 'Add'} voice note
						</button>
					</div>

					{#if showVoiceInput}
						<div class="space-y-3">
							<div class="flex items-center gap-3">
								<button
									onclick={toggleRecording}
									class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors {isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}"
									aria-label={isRecording ? 'Stop recording' : 'Start recording'}
								>
									{#if isRecording}
										<MicOff class="w-5 h-5" aria-hidden="true" />
									{:else}
										<Mic class="w-5 h-5" aria-hidden="true" />
									{/if}
								</button>
								
								<textarea
									bind:value={reflectionText}
									placeholder="Or type how you're feeling..."
									class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
									rows="2"
								></textarea>
							</div>

							{#if isRecording}
								<div class="flex items-center gap-2 text-sm text-red-600">
									<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
									Recording... Speak now
								</div>
							{/if}

							<button
								onclick={submitReflection}
								disabled={submitting || (!selectedMood && !reflectionText.trim())}
								class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{submitting ? 'Saving...' : 'Save Reflection'}
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
</ComponentErrorBoundary>