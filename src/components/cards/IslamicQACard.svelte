<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import { BookOpen, CheckCircle, Heart, AlertCircle } from 'lucide-svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	let loading = $state(true);
	let error = $state('');
	let questions = $state<Database['public']['Tables']['islamic_questions']['Row'][]>([]);
	let currentAnswer = $state<number | null>(null);
	let showExplanation = $state(false);
	let currentQuestionIndex = $state(0);

	type IslamicQuestion = Database['public']['Tables']['islamic_questions']['Row'];

	// Get 1-2 questions per session
	async function loadQuestions() {
		try {
			loading = true;
			error = '';

			const { data: allQuestions, error: fetchError } = await supabase
				.from('islamic_questions')
				.select('*')
				.order('order_index');

			if (fetchError) throw fetchError;

			if (allQuestions && allQuestions.length > 0) {
				// Show 1-2 questions per session, cycling through them
				const sessionIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % allQuestions.length;
				const questionsToShow = [allQuestions[sessionIndex]];
				
				// Add second question if available
				if (allQuestions.length > 1) {
					const secondIndex = (sessionIndex + 1) % allQuestions.length;
					questionsToShow.push(allQuestions[secondIndex]);
				}

				questions = questionsToShow;
			}
		} catch (err) {
			console.error('Error loading Islamic questions:', err);
			error = 'Failed to load questions. Please try again.';
		} finally {
			loading = false;
		}
	}

	function selectAnswer(questionIndex: number, answerIndex: number) {
		currentAnswer = answerIndex;
		currentQuestionIndex = questionIndex;
		showExplanation = true;
	}

	function nextQuestion() {
		if (currentQuestionIndex < questions.length - 1) {
			currentQuestionIndex++;
			currentAnswer = null;
			showExplanation = false;
		} else {
			// Reset for next session
			currentAnswer = null;
			showExplanation = false;
			currentQuestionIndex = 0;
		}
	}

	function getCurrentQuestion(): IslamicQuestion | null {
		return questions[currentQuestionIndex] || null;
	}

	function isCorrectAnswer(question: IslamicQuestion, answerIndex: number): boolean {
		return question.correct_index === answerIndex;
	}

	// Load questions on mount
	$effect(() => {
		if (session) {
			loadQuestions();
		}
	});

	let currentQ = $derived(getCurrentQuestion());
</script>

<ComponentErrorBoundary componentName="IslamicQACard">
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<BookOpen class="w-6 h-6 text-green-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">Islamic Q&A</h3>
	</div>

	{#if loading}
		<Loading size="md" text="Loading questions..." />
	{:else if error}
		<div class="text-center py-8">
			<AlertCircle class="w-12 h-12 text-red-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-red-600 text-sm mb-3">{error}</p>
			<button 
				onclick={() => loadQuestions()} 
				class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
			>
				Try Again
			</button>
		</div>
	{:else if questions.length === 0}
		<div class="text-center py-8">
			<BookOpen class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-gray-500 text-sm">No questions available at the moment.</p>
		</div>
	{:else if currentQ}
		<div class="space-y-4">
			<!-- Question -->
			<div class="bg-green-50 rounded-lg p-4">
				<h4 class="text-sm font-medium text-green-900 mb-2">
					Question {currentQuestionIndex + 1} of {questions.length}
				</h4>
				<p class="text-sm text-gray-700 leading-relaxed">
					{currentQ.question_text}
				</p>
			</div>

			{#if !showExplanation}
				<!-- Answer Options -->
				<div class="space-y-2">
					{#each currentQ.options as option, index (option)}
						<button
							onclick={() => selectAnswer(currentQuestionIndex, index)}
							class="w-full text-left p-3 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors focus:ring-2 focus:ring-green-500 focus:border-green-500"
							aria-label="Select answer: {option}"
						>
							<span class="text-sm font-medium text-gray-900">
								{String.fromCharCode(65 + index)}. {option}
							</span>
						</button>
					{/each}
				</div>
			{:else}
				<!-- Show Explanation -->
				<div class="space-y-4">
					<!-- Selected Answer Display -->
					<div class="flex items-start gap-3 p-3 border rounded-lg {isCorrectAnswer(currentQ, currentAnswer!) ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}">
						{#if isCorrectAnswer(currentQ, currentAnswer!)}
							<CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
						{:else}
							<Heart class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
						{/if}
						<div class="flex-1">
							<p class="text-sm font-medium {isCorrectAnswer(currentQ, currentAnswer!) ? 'text-green-900' : 'text-blue-900'}">
								Your answer: {currentQ.options[currentAnswer!]}
							</p>
						</div>
					</div>

					<!-- Explanation -->
					<div class="bg-gray-50 rounded-lg p-4">
						{#if isCorrectAnswer(currentQ, currentAnswer!)}
							{#if currentQ.explanation_correct}
								<p class="text-sm text-gray-700 leading-relaxed">
									{currentQ.explanation_correct}
								</p>
							{/if}
						{:else}
							{#if currentQ.explanation_incorrect}
								<p class="text-sm text-gray-700 leading-relaxed">
									{currentQ.explanation_incorrect}
								</p>
							{/if}
						{/if}
					</div>

					<!-- Continue Button -->
					<div class="text-center">
						{#if currentQuestionIndex < questions.length - 1}
							<button
								onclick={() => nextQuestion()}
								class="px-6 py-2 text-sm font-medium text-green-600 border border-green-300 hover:bg-green-50 rounded-lg transition-colors"
							>
								Next Question
							</button>
						{:else}
							<button
								onclick={() => nextQuestion()}
								class="px-6 py-2 text-sm font-medium text-green-600 border border-green-300 hover:bg-green-50 rounded-lg transition-colors"
							>
								Complete Session
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
</ComponentErrorBoundary>