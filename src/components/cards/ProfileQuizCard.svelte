<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import { User, CheckCircle, AlertCircle } from 'lucide-svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	let loading = $state(true);
	let submitting = $state(false);
	let error = $state('');
	let success = $state('');
	let questions = $state<Database['public']['Tables']['quiz_questions']['Row'][]>([]);
	let userAnswers = $state<Database['public']['Tables']['quiz_answers']['Row'][]>([]);
	let currentAnswers = $state<{ [questionId: string]: number }>({});

	// Get questions that user hasn't answered yet
	let unansweredQuestions = $derived(() => {
		const answeredIds = new Set(userAnswers.map(a => a.question_id));
		return questions.filter(q => !answeredIds.has(q.id));
	});

	// Show first 5 unanswered questions
	let questionsToShow = $derived(() => unansweredQuestions().slice(0, 5));

	// Check if all questions are answered
	let allAnswered = $derived(() => unansweredQuestions().length === 0 && questions.length > 0);

	async function loadData() {
		try {
			loading = true;
			error = '';

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
			console.error('Error loading quiz data:', err);
			error = 'Failed to load quiz questions. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function submitAnswers() {
		if (!session?.user?.id) {
			error = 'You must be logged in to submit answers.';
			return;
		}

		if (Object.keys(currentAnswers).length === 0) {
			error = 'Please answer at least one question before submitting.';
			return;
		}

		try {
			submitting = true;
			error = '';

			// Prepare answers for insertion
			const answersToInsert = Object.entries(currentAnswers).map(([questionId, answerIndex]) => ({
				user_id: session.user.id,
				question_id: questionId,
				answer_index: answerIndex
			}));

			const { error: insertError } = await supabase
				.from('quiz_answers')
				.insert(answersToInsert);

			if (insertError) throw insertError;

			success = 'Your answers have been saved! 🎉';
			currentAnswers = {};

			// Reload data to update UI
			await loadData();

		} catch (err) {
			console.error('Error submitting answers:', err);
			error = 'Failed to save your answers. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function handleAnswerChange(questionId: string, answerIndex: number) {
		currentAnswers[questionId] = answerIndex;
	}

	// Load data on mount
	$effect(() => {
		if (session) {
			loadData();
		}
	});
</script>

<ComponentErrorBoundary componentName="ProfileQuizCard">
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<User class="w-6 h-6 text-blue-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">Set Your Fun Profile</h3>
	</div>

	{#if loading}
		<Loading size="md" text="Loading quiz questions..." />
	{:else if error}
		<div class="text-center py-8">
			<AlertCircle class="w-12 h-12 text-red-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-red-600 text-sm mb-3">{error}</p>
			<button 
				onclick={() => loadData()} 
				class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
			>
				Try Again
			</button>
		</div>
	{:else if allAnswered()}
		<div class="text-center py-8">
			<CheckCircle class="w-12 h-12 text-green-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-green-600 text-sm font-medium">🎉 All questions answered!</p>
			<p class="text-gray-500 text-sm mt-2">Your profile is complete. Other family members can now guess your answers.</p>
		</div>
	{:else if questionsToShow().length === 0}
		<div class="text-center py-8">
			<User class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-gray-500 text-sm">No new questions available at the moment.</p>
		</div>
	{:else}
		<div class="space-y-6">
			{#each questionsToShow() as question, index (question.id)}
				<div class="bg-gray-50 rounded-lg p-4">
					<h4 class="text-sm font-medium text-gray-900 mb-3">
						Q{index + 1}: {question.question_text}
					</h4>
					<div class="space-y-2">
						{#each question.options as option, optionIndex (optionIndex)}
							<label class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
								<input
									type="radio"
									name="question-{question.id}"
									value={optionIndex}
									onchange={() => handleAnswerChange(question.id, optionIndex)}
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
					onclick={submitAnswers}
					disabled={submitting || Object.keys(currentAnswers).length === 0}
					class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
				>
					{#if submitting}
						Saving...
					{:else}
						Save My Answers
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>
</ComponentErrorBoundary>