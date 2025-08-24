<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import { Users, CheckCircle, X, AlertCircle } from 'lucide-svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import { profileStore } from '$lib/stores/profileStore';

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	let loading = $state(true);
	let submitting = $state(false);
	let error = $state('');
	let success = $state('');
	let selectedTarget = $state('');
	let targetAnswers = $state<(Database['public']['Tables']['quiz_answers']['Row'] & { 
		quiz_questions: Database['public']['Tables']['quiz_questions']['Row'] | null
	})[]>([]);
	let userGuesses = $state<Database['public']['Tables']['quiz_guesses']['Row'][]>([]);
	let currentGuesses = $state<{ [questionId: string]: number }>({});
	let showResults = $state(false);

	// Subscribe to profileStore
	let profiles = $derived($profileStore);

	// Get other family members (exclude current user)
	let otherMembers = $derived(() => {
		return profiles.filter(p => p.email !== session?.user?.email && p.user_id);
	});

	// Get target's unanswered questions by current user
	let questionsToGuess = $derived(() => {
		const guessedIds = new Set(userGuesses.map(g => g.question_id));
		return targetAnswers.filter(ta => ta.quiz_questions && !guessedIds.has(ta.question_id));
	});

	// Show first 5 questions
	let questionsToShow = $derived(() => questionsToGuess().slice(0, 5));

	async function loadTargetAnswers() {
		if (!selectedTarget) {
			targetAnswers = [];
			return;
		}

		try {
			loading = true;
			error = '';

			// Load target's answers with question details
			const { data, error: fetchError } = await supabase
				.from('quiz_answers')
				.select(`
					*,
					quiz_questions (*)
				`)
				.eq('user_id', selectedTarget)
				.order('created_at');

			if (fetchError) throw fetchError;
			targetAnswers = data || [];

			// Load current user's guesses for this target
			if (session?.user?.id) {
				const { data: guessesData, error: guessesError } = await supabase
					.from('quiz_guesses')
					.select('*')
					.eq('guesser_id', session.user.id)
					.eq('target_id', selectedTarget);

				if (guessesError) throw guessesError;
				userGuesses = guessesData || [];
			}

		} catch (err) {
			console.error('Error loading target answers:', err);
			error = 'Failed to load questions. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function submitGuesses() {
		if (!session?.user?.id || !selectedTarget) {
			error = 'You must be logged in to submit guesses.';
			return;
		}

		if (Object.keys(currentGuesses).length === 0) {
			error = 'Please make at least one guess before submitting.';
			return;
		}

		try {
			submitting = true;
			error = '';

			// Prepare guesses for insertion
			const guessesToInsert = Object.entries(currentGuesses).map(([questionId, guessedIndex]) => ({
				guesser_id: session.user.id,
				target_id: selectedTarget,
				question_id: questionId,
				guessed_index: guessedIndex
			}));

			const { error: insertError } = await supabase
				.from('quiz_guesses')
				.insert(guessesToInsert);

			if (insertError) throw insertError;

			success = 'Your guesses have been submitted! 🎉';
			currentGuesses = {};
			showResults = true;

			// Reload data to update UI
			await loadTargetAnswers();

		} catch (err) {
			console.error('Error submitting guesses:', err);
			error = 'Failed to save your guesses. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function handleGuessChange(questionId: string, guessIndex: number) {
		currentGuesses[questionId] = guessIndex;
	}

	function getTargetName(targetId: string) {
		const target = profiles.find(p => p.user_id === targetId);
		return target?.display_name || target?.email?.split('@')[0] || 'Family Member';
	}

	function getComparisonResults() {
		return userGuesses.map(guess => {
			const targetAnswer = targetAnswers.find(ta => ta.question_id === guess.question_id);
			const question = targetAnswer?.quiz_questions;
			
			if (!targetAnswer || !question) return null;

			const correct = guess.guessed_index === targetAnswer.answer_index;
			return {
				question: question.question_text,
				guessed: question.options[guess.guessed_index],
				correct: question.options[targetAnswer.answer_index],
				isCorrect: correct
			};
		}).filter((result): result is NonNullable<typeof result> => result !== null);
	}

	// Load data when target changes
	$effect(() => {
		if (selectedTarget) {
			loadTargetAnswers();
		}
	});

	// Reset states when target changes
	$effect(() => {
		currentGuesses = {};
		showResults = false;
		success = '';
	});
</script>

<ComponentErrorBoundary componentName="GuessFamilyCard">
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<Users class="w-6 h-6 text-purple-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">How Well Do You Know Your Family?</h3>
	</div>

	{#if otherMembers().length === 0}
		<div class="text-center py-8">
			<Users class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-gray-500 text-sm">No other family members have answered questions yet.</p>
		</div>
	{:else}
		<!-- Target selection -->
		<div class="mb-6">
			<label for="target-select" class="block text-sm font-medium text-gray-700 mb-2">
				Choose a family member:
			</label>
			<select
				id="target-select"
				bind:value={selectedTarget}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
			>
				<option value="">Select someone...</option>
				{#each otherMembers() as member (member.user_id)}
					<option value={member.user_id}>
						{member.display_name || member.email?.split('@')[0] || 'Family Member'}
					</option>
				{/each}
			</select>
		</div>

		{#if selectedTarget}
			{#if loading}
				<Loading size="md" text="Loading questions..." />
			{:else if error}
				<div class="text-center py-8">
					<AlertCircle class="w-12 h-12 text-red-300 mx-auto mb-3" aria-hidden="true" />
					<p class="text-red-600 text-sm mb-3">{error}</p>
					<button 
						onclick={() => loadTargetAnswers()} 
						class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
					>
						Try Again
					</button>
				</div>
			{:else if targetAnswers.length === 0}
				<div class="text-center py-8">
					<Users class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
					<p class="text-gray-500 text-sm">
						{getTargetName(selectedTarget)} hasn't answered any questions yet.
					</p>
				</div>
			{:else if questionsToShow().length === 0 && !showResults}
				<div class="text-center py-8">
					<CheckCircle class="w-12 h-12 text-green-300 mx-auto mb-3" aria-hidden="true" />
					<p class="text-green-600 text-sm font-medium">You've guessed all available questions!</p>
				</div>
			{:else}
				<div class="space-y-6">
					{#if !showResults && questionsToShow().length > 0}
						<div class="bg-purple-50 rounded-lg p-4 mb-4">
							<p class="text-sm text-purple-700">
								🤔 Guess how <strong>{getTargetName(selectedTarget)}</strong> answered these questions:
							</p>
						</div>

						{#each questionsToShow() as answer, index (answer.id)}
							<div class="bg-gray-50 rounded-lg p-4">
								<h4 class="text-sm font-medium text-gray-900 mb-3">
									Q{index + 1}: {answer.quiz_questions?.question_text}
								</h4>
								<div class="space-y-2">
									{#each answer.quiz_questions?.options || [] as option, optionIndex (optionIndex)}
										<label class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
											<input
												type="radio"
												name="guess-{answer.question_id}"
												value={optionIndex}
												onchange={() => answer.question_id && handleGuessChange(answer.question_id, optionIndex)}
												class="h-4 w-4 text-primary-600 border-gray-300 focus:ring-2 focus:ring-primary-500"
											/>
											<span class="text-sm text-gray-700">{option}</span>
										</label>
									{/each}
								</div>
							</div>
						{/each}

						{#if success}
							<div class="text-center text-green-600 text-sm font-medium mb-4">
								{success}
							</div>
						{/if}

						<div class="flex justify-center">
							<button
								onclick={submitGuesses}
								disabled={submitting || Object.keys(currentGuesses).length === 0}
								class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
							>
								{#if submitting}
									Submitting...
								{:else}
									Submit Guesses
								{/if}
							</button>
						</div>
					{/if}

					{#if showResults || (questionsToShow().length === 0 && userGuesses.length > 0)}
						<div class="bg-blue-50 rounded-lg p-4">
							<h4 class="text-sm font-medium text-gray-900 mb-3">
								🎯 Results for {getTargetName(selectedTarget)}:
							</h4>
							<div class="space-y-3">
								{#each getComparisonResults() as result}
									<div class="flex items-start gap-3 text-sm">
										{#if result.isCorrect}
											<CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
										{:else}
											<X class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
										{/if}
										<div>
											<div class="font-medium text-gray-900">{result.question}</div>
											<div class="text-gray-600">
												You guessed: <span class="font-medium">{result.guessed}</span> | 
												Correct: <span class="font-medium">{result.correct}</span>
											</div>
										</div>
									</div>
								{/each}
								{#if getComparisonResults().length > 0}
									<div class="text-center mt-4 text-sm text-gray-600">
										You got {getComparisonResults().filter(r => r.isCorrect).length}/{getComparisonResults().length} correct 🎉
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	{/if}
</div>
</ComponentErrorBoundary>