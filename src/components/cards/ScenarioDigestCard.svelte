<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import { BarChart3, AlertCircle, Lightbulb, Users } from 'lucide-svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import { profileStore } from '$lib/stores/profileStore';
	import { getUserRole } from '$lib/utils/roles';

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	// Check if user is a parent - only parents can see digest
	let userRole = $derived(getUserRole(session?.user?.email));
	let isParent = $derived(userRole === 'parent');

	let loading = $state(true);
	let error = $state('');
	let digestData = $state<{
		childName: string;
		categories: { [category: string]: { correct: number; total: number } };
	}[]>([]);

	// Subscribe to profileStore
	let profiles = $derived($profileStore);

	// Get children profiles
	let children = $derived(() => profiles.filter(p => p.role === 'child'));

	// Categories mapping (based on the problem statement)
	const categories = [
		'bullying', 'honesty', 'manners', 'empathy', 'parents', 'islam', 
		'respect_girls', 'responsibility', 'digital', 'courage', 'generosity', 
		'teamwork', 'patience', 'gratitude'
	];

	async function loadDigestData() {
		try {
			loading = true;
			error = '';

			const childrenData = [];

			for (const child of children()) {
				if (!child.user_id) continue;

				// Get child's scenario answers from the last week
				const oneWeekAgo = new Date();
				oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

				const { data: answers, error: answersError } = await supabase
					.from('scenario_answers')
					.select(`
						*,
						scenario_questions (
							correct_index,
							question_text
						)
					`)
					.eq('user_id', child.user_id)
					.gte('created_at', oneWeekAgo.toISOString());

				if (answersError) {
					console.error('Error fetching answers for child:', child.display_name, answersError);
					continue;
				}

				// Categorize answers (simplified categorization based on question text keywords)
				const categoryStats: { [category: string]: { correct: number; total: number } } = {};

				for (const category of categories) {
					categoryStats[category] = { correct: 0, total: 0 };
				}

				answers?.forEach(answer => {
					if (answer.scenario_questions) {
						const question = answer.scenario_questions;
						const isCorrect = answer.chosen_index === question.correct_index;
						
						// Simple keyword matching to categorize questions
						const questionText = question.question_text.toLowerCase();
						let category = 'general';

						if (questionText.includes('bully')) category = 'bullying';
						else if (questionText.includes('honest') || questionText.includes('truth') || questionText.includes('lie')) category = 'honesty';
						else if (questionText.includes('please') || questionText.includes('thank') || questionText.includes('polite')) category = 'manners';
						else if (questionText.includes('feel') || questionText.includes('sad') || questionText.includes('hurt')) category = 'empathy';
						else if (questionText.includes('parent') || questionText.includes('mom') || questionText.includes('dad')) category = 'parents';
						else if (questionText.includes('prayer') || questionText.includes('allah') || questionText.includes('islamic')) category = 'islam';
						else if (questionText.includes('girl') || questionText.includes('sister') || questionText.includes('respect')) category = 'respect_girls';
						else if (questionText.includes('responsible') || questionText.includes('duty') || questionText.includes('task')) category = 'responsibility';
						else if (questionText.includes('internet') || questionText.includes('phone') || questionText.includes('screen')) category = 'digital';
						else if (questionText.includes('brave') || questionText.includes('courage') || questionText.includes('stand up')) category = 'courage';
						else if (questionText.includes('share') || questionText.includes('give') || questionText.includes('generous')) category = 'generosity';
						else if (questionText.includes('team') || questionText.includes('together') || questionText.includes('group')) category = 'teamwork';
						else if (questionText.includes('wait') || questionText.includes('patient') || questionText.includes('calm')) category = 'patience';
						else if (questionText.includes('thank') || questionText.includes('grateful') || questionText.includes('appreciate')) category = 'gratitude';

						if (categoryStats[category]) {
							categoryStats[category].total++;
							if (isCorrect) {
								categoryStats[category].correct++;
							}
						}
					}
				});

				childrenData.push({
					childName: child.display_name || child.email?.split('@')[0] || 'Child',
					categories: categoryStats
				});
			}

			digestData = childrenData;

		} catch (err) {
			console.error('Error loading digest data:', err);
			error = 'Failed to load scenario digest. Please try again.';
		} finally {
			loading = false;
		}
	}

	function getCategoryIcon(category: string) {
		switch (category) {
			case 'bullying': return '🛡️';
			case 'honesty': return '🤝';
			case 'manners': return '🙏';
			case 'empathy': return '❤️';
			case 'parents': return '👨‍👩‍👧‍👦';
			case 'islam': return '🕌';
			case 'respect_girls': return '🌸';
			case 'responsibility': return '📋';
			case 'digital': return '📱';
			case 'courage': return '💪';
			case 'generosity': return '🎁';
			case 'teamwork': return '🤝';
			case 'patience': return '⏳';
			case 'gratitude': return '🙏';
			default: return '📚';
		}
	}

	function getCategoryStatus(correct: number, total: number) {
		if (total === 0) return { icon: '⚪', label: 'No data' };
		const percentage = (correct / total) * 100;
		if (percentage >= 80) return { icon: '✅', label: 'Strong' };
		if (percentage >= 60) return { icon: '⚠️', label: 'Good' };
		return { icon: '🔄', label: 'Needs attention' };
	}

	function getActionableTips(): string[] {
		const tips: string[] = [];
		
		digestData.forEach(child => {
			Object.entries(child.categories).forEach(([category, stats]) => {
				if (stats.total > 0 && (stats.correct / stats.total) < 0.6) {
					tips.push(`💡 Discuss ${category.replace('_', ' ')} with ${child.childName} this week.`);
				}
			});
		});

		return tips.slice(0, 3); // Show max 3 tips
	}

	// Load data on mount if user is parent
	$effect(() => {
		if (session && isParent) {
			loadDigestData();
		}
	});
</script>

<ComponentErrorBoundary componentName="ScenarioDigestCard">
{#if !isParent}
	<!-- Don't render anything for non-parents -->
{:else}
	<div class="card">
		<div class="flex items-center gap-2 mb-4">
			<BarChart3 class="w-6 h-6 text-orange-500" aria-hidden="true" />
			<h3 class="text-lg font-semibold text-gray-900">Scenario Reflection Digest</h3>
		</div>

		{#if loading}
			<Loading size="md" text="Loading digest..." />
		{:else if error}
			<div class="text-center py-8">
				<AlertCircle class="w-12 h-12 text-red-300 mx-auto mb-3" aria-hidden="true" />
				<p class="text-red-600 text-sm mb-3">{error}</p>
				<button 
					onclick={() => loadDigestData()} 
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
				>
					Try Again
				</button>
			</div>
		{:else if children().length === 0}
			<div class="text-center py-8">
				<Users class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
				<p class="text-gray-500 text-sm">No children profiles found to generate digest.</p>
			</div>
		{:else if digestData.length === 0}
			<div class="text-center py-8">
				<BarChart3 class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
				<p class="text-gray-500 text-sm">No scenario data available for this week.</p>
			</div>
		{:else}
			<div class="space-y-6">
				<!-- Children progress summary -->
				<div class="space-y-4">
					{#each digestData as childData (childData.childName)}
						<div class="bg-gray-50 rounded-lg p-4">
							<h4 class="text-sm font-medium text-gray-900 mb-3">{childData.childName}</h4>
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
								{#each Object.entries(childData.categories) as [category, stats] (category)}
									{#if stats.total > 0}
										{@const status = getCategoryStatus(stats.correct, stats.total)}
										<div class="flex items-center gap-2 text-xs">
											<span>{getCategoryIcon(category)}</span>
											<span class="capitalize text-gray-700">{category.replace('_', ' ')}</span>
											<span>{status.icon}</span>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>

				<!-- Actionable tips -->
				{#if getActionableTips().length > 0}
					<div class="bg-blue-50 rounded-lg p-4">
						<div class="flex items-start gap-3">
							<Lightbulb class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
							<div>
								<h4 class="text-sm font-medium text-gray-900 mb-2">📝 This Week's Focus</h4>
								<div class="space-y-1">
									{#each getActionableTips() as tip}
										<p class="text-sm text-gray-700">{tip}</p>
									{/each}
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="bg-green-50 rounded-lg p-4">
						<div class="flex items-start gap-3">
							<span class="text-2xl">🎉</span>
							<div>
								<h4 class="text-sm font-medium text-gray-900 mb-1">Great Progress!</h4>
								<p class="text-sm text-gray-700">All children are doing well with their scenario reflections.</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Weekly summary note -->
				<div class="text-center text-xs text-gray-500 border-t pt-4">
					📊 Digest shows progress from the last 7 days • Updates daily
				</div>
			</div>
		{/if}
	</div>
{/if}
</ComponentErrorBoundary>