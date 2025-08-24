<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import { User, Users, CheckCircle, AlertCircle, RotateCcw, ArrowRight } from 'lucide-svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import { profileStore } from '$lib/stores/profileStore';

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	type QuizMode = 'profile' | 'guess';
	let currentMode: QuizMode = $state('profile');

	let loading = $state(true);
	let submitting = $state(false);
	let error = $state('');
	let success = $state('');

	// Profile Quiz State
	let questions = $state<Database['public']['Tables']['quiz_questions']['Row'][]>([]);
	let userAnswers = $state<Database['public']['Tables']['quiz_answers']['Row'][]>([]);
	let currentAnswers = $state<{ [questionId: string]: number }>({});

	// Guess Quiz State
	let selectedTarget = $state('');
	let targetAnswers = $state<(Database['public']['Tables']['quiz_answers']['Row'] & { 
		quiz_questions: Database['public']['Tables']['quiz_questions']['Row'] | null
	})[]>([]);
	let userGuesses = $state<Database['public']['Tables']['quiz_guesses']['Row'][]>([]);
	let currentGuesses = $state<{ [questionId: string]: number }>({});

	// Subscribe to profileStore
	let profiles = $derived($profileStore);

	// Get other family members (exclude current user)
	let otherMembers = $derived(() => {
		return profiles.filter(p => p.email !== session?.user?.email && p.user_id);
	});

	// Profile Quiz Derived State
	let unansweredQuestions = $derived(() => {
		const answeredIds = new Set(userAnswers.map(a => a.question_id));
		return questions.filter(q => !answeredIds.has(q.id));
	});

	let profileQuestionsToShow = $derived(() => unansweredQuestions().slice(0, 3));
	let allProfileAnswered = $derived(() => unansweredQuestions().length === 0 && questions.length > 0);

	// Guess Quiz Derived State
	let questionsToGuess = $derived(() => {
		const guessedIds = new Set(userGuesses.map(g => g.question_id));
		return targetAnswers.filter(ta => ta.quiz_questions && !guessedIds.has(ta.question_id));
	});

	let guessQuestionsToShow = $derived(() => questionsToGuess().slice(0, 3));

	// Determine which mode to show based on available content
	let recommendedMode = $derived(() => {
		if (allProfileAnswered() && otherMembers().length > 0) {
			return 'guess';
		}
		return 'profile';
	});

	async function loadProfileData() {
		try {
			// Load quiz questions
			const { data: questionsData, error: questionsError } = await supabase
				.from('quiz_questions')
				.select('*')
				.order('order_index');

			if (questionsError) throw questionsError;
			questions = questionsData || [];

			// Load user's existing answers
			if (session?.user?.id) {
				const { data: answersData, error: answersError } = await supabase
					.from('quiz_answers')
					.select('*')
					.eq('user_id', session.user.id);

				if (answersError) throw answersError;
				userAnswers = answersData || [];
			}
		} catch (err) {
			console.error('Error loading profile quiz data:', err);
			error = 'Failed to load questions. Please try again.';
		}
	}

	async function loadGuessData() {
		if (!selectedTarget) return;

		try {
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
			console.error('Error loading guess data:', err);
			error = 'Failed to load guess questions. Please try again.';
		}
	}

	async function loadData() {
		try {
			loading = true;
			error = '';
			await loadProfileData();
			if (recommendedMode() === 'guess' && otherMembers().length > 0) {
				selectedTarget = otherMembers()[0].user_id;
				await loadGuessData();
			}
		} catch (err) {
			console.error('Error loading quiz data:', err);
		} finally {
			loading = false;
		}
	}

	async function submitProfileAnswer(questionId: string, answerIndex: number) {
		if (!session?.user?.id) return;

		try {
			submitting = true;
			error = '';
			success = '';

			const { error: insertError } = await supabase
				.from('quiz_answers')
				.insert({
					user_id: session.user.id,
					question_id: questionId,
					answer_index: answerIndex
				});

			if (insertError) throw insertError;

			// Update local state
			userAnswers = [...userAnswers, {
				id: '', // Will be generated by DB
				user_id: session.user.id,
				question_id: questionId,
				answer_index: answerIndex,
				locked_at: new Date().toISOString()
			}];

			success = 'Answer saved! Keep going to complete your profile.';

		} catch (err) {
			console.error('Error submitting answer:', err);
			error = 'Failed to save answer. Please try again.';
		} finally {
			submitting = false;
		}
	}

	async function submitGuess(questionId: string, guessedIndex: number) {
		if (!session?.user?.id || !selectedTarget) return;

		try {
			submitting = true;
			error = '';
			success = '';

			const { error: insertError } = await supabase
				.from('quiz_guesses')
				.insert({
					guesser_id: session.user.id,
					target_id: selectedTarget,
					question_id: questionId,
					guessed_index: guessedIndex
				});

			if (insertError) throw insertError;

			// Update local state
			userGuesses = [...userGuesses, {
				id: '', // Will be generated by DB
				guesser_id: session.user.id,
				target_id: selectedTarget,
				question_id: questionId,
				guessed_index: guessedIndex,
				created_at: new Date().toISOString()
			}];

			success = 'Guess recorded! See how well you know your family.';

		} catch (err) {
			console.error('Error submitting guess:', err);
			error = 'Failed to save guess. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function switchMode(mode: QuizMode) {
		currentMode = mode;
		if (mode === 'guess' && !selectedTarget && otherMembers().length > 0) {
			selectedTarget = otherMembers()[0].user_id;
			loadGuessData();
		}
	}

	function handleTargetChange(targetId: string) {
		selectedTarget = targetId;
		loadGuessData();
	}

	// Load data on mount
	$effect(() => {
		loadData();
	});

	// Set current mode based on recommendation
	$effect(() => {
		if (!loading) {
			currentMode = recommendedMode();
		}
	});
</script>

<ComponentErrorBoundary componentName="QuizCard">
<div class="card">
	{#if loading}
		<Loading size="sm" />
	{:else}
		<div class="space-y-4">
			<!-- Header with mode toggle -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					{#if currentMode === 'profile'}
						<User class="w-6 h-6 text-blue-500" aria-hidden="true" />
						<h3 class="text-lg font-semibold text-gray-900">Quiz: Set Your Profile</h3>
					{:else}
						<Users class="w-6 h-6 text-green-500" aria-hidden="true" />
						<h3 class="text-lg font-semibold text-gray-900">Quiz: Guess Family Answers</h3>
					{/if}
				</div>
				
				<button
					onclick={() => switchMode(currentMode === 'profile' ? 'guess' : 'profile')}
					class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
					title="Switch quiz mode"
				>
					<RotateCcw class="w-3 h-3" aria-hidden="true" />
					Switch
				</button>
			</div>

			{#if error}
				<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
					<div class="flex items-center gap-2">
						<AlertCircle class="w-4 h-4 text-red-500" aria-hidden="true" />
						<p class="text-sm text-red-600">{error}</p>
					</div>
				</div>
			{/if}

			{#if success}
				<div class="p-3 bg-green-50 border border-green-200 rounded-lg">
					<div class="flex items-center gap-2">
						<CheckCircle class="w-4 h-4 text-green-500" aria-hidden="true" />
						<p class="text-sm text-green-600">{success}</p>
					</div>
				</div>
			{/if}

			<!-- Profile Quiz Mode -->
			{#if currentMode === 'profile'}
				{#if allProfileAnswered()}
					<div class="text-center py-6">
						<CheckCircle class="w-12 h-12 text-green-500 mx-auto mb-3" aria-hidden="true" />
						<h4 class="text-lg font-semibold text-gray-900 mb-2">Profile Complete!</h4>
						<p class="text-sm text-gray-600 mb-4">
							Great job! You've answered all the quiz questions.
						</p>
						{#if otherMembers().length > 0}
							<button
								onclick={() => switchMode('guess')}
								class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
							>
								Try Guessing Family Answers
								<ArrowRight class="w-4 h-4" aria-hidden="true" />
							</button>
						{/if}
					</div>
				{:else}
					<div class="space-y-4">
						<p class="text-sm text-gray-600">
							Answer these fun questions to set up your family profile!
						</p>
						
						{#each profileQuestionsToShow() as question}
							<div class="border border-gray-200 rounded-lg p-4">
								<h4 class="font-medium text-gray-900 mb-3">{question.question_text}</h4>
								
								<div class="space-y-2">
									{#each question.options as option, index}
										<button
											onclick={() => submitProfileAnswer(question.id, index)}
											disabled={submitting}
											class="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
										>
											{option}
										</button>
									{/each}
								</div>
							</div>
						{/each}

						{#if profileQuestionsToShow().length === 0}
							<div class="text-center py-6">
								<p class="text-gray-500">No more questions available right now.</p>
								<p class="text-xs text-gray-400 mt-1">Check back later for more!</p>
							</div>
						{/if}
					</div>
				{/if}

			<!-- Guess Quiz Mode -->
			{:else}
				{#if otherMembers().length === 0}
					<div class="text-center py-6">
						<Users class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
						<p class="text-gray-500">No other family members to guess about yet.</p>
						<p class="text-xs text-gray-400 mt-1">Invite more family members to play!</p>
					</div>
				{:else}
					<div class="space-y-4">
						<!-- Target Selection -->
						<div>
							<label for="target-select" class="block text-sm font-medium text-gray-700 mb-2">
								Guess how this person answered:
							</label>
							<select
								id="target-select"
								bind:value={selectedTarget}
								onchange={(e) => handleTargetChange((e.target as HTMLSelectElement)?.value || '')}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
							>
								{#each otherMembers() as member}
									<option value={member.user_id}>
										{member.display_name || member.email?.split('@')[0] || 'Family Member'}
									</option>
								{/each}
							</select>
						</div>

						{#if guessQuestionsToShow().length > 0}
							{#each guessQuestionsToShow() as { quiz_questions: question, answer_index }}
								{#if question}
									<div class="border border-gray-200 rounded-lg p-4">
										<h4 class="font-medium text-gray-900 mb-3">
											{question.question_text}
										</h4>
										
										<div class="space-y-2">
											{#each question.options as option, index}
												<button
													onclick={() => submitGuess(question.id, index)}
													disabled={submitting}
													class="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
												>
													{option}
												</button>
											{/each}
										</div>
									</div>
								{/if}
							{/each}
						{:else}
							<div class="text-center py-6">
								<p class="text-gray-500">No questions to guess about right now.</p>
								<p class="text-xs text-gray-400 mt-1">
									{selectedTarget ? 'This person needs to answer more questions first!' : 'Select a family member above.'}
								</p>
							</div>
						{/if}
					</div>
				{/if}
			{/if}

			{#if submitting}
				<div class="text-center">
					<div class="inline-flex items-center gap-2 text-sm text-gray-600">
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
						Saving...
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
</ComponentErrorBoundary>