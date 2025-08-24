<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import type { AyahData } from '$lib/supabase';
	import dayjs from 'dayjs';
	import { BookOpen, Share2 } from 'lucide-svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import { profileStore } from '$lib/stores/profileStore';

	interface Props extends WidgetProps {}

	let { session, items, interactions }: Props = $props();

	// Subscribe to profileStore instead of using props
	let profiles = $derived($profileStore);

	let todayAyah = $derived(items
		.filter(item => item.kind === 'ayah')
		.find(item => dayjs(item.created_at).isSame(dayjs(), 'day')));

	// Sample ayahs for demonstration if none in database
	const sampleAyahs: AyahData[] = [
		{
			arabic: "وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ",
			translation: "And Allah loves the doers of good.",
			reference: "Quran 3:134"
		},
		{
			arabic: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
			translation: "And whoever fears Allah - He will make for him a way out.",
			reference: "Quran 65:2"
		},
		{
			arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
			translation: "Indeed, with hardship comes ease.",
			reference: "Quran 94:6"
		}
	];

	let displayAyah = $derived(() => {
		// Type guard for AyahData
		const data = todayAyah?.data;
		if (data && typeof data === 'object' && !Array.isArray(data) && 
		    'arabic' in data && 'translation' in data && 'reference' in data) {
			return data as unknown as AyahData;
		}
		return sampleAyahs[dayjs().day() % sampleAyahs.length];
	});
</script>

<ComponentErrorBoundary componentName="AyahCard">
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<BookOpen class="w-6 h-6 text-green-600" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">Daily Ayah</h3>
	</div>

	{#if !items}
		<Loading size="md" text="Loading daily ayah..." />
	{:else if displayAyah()}
		<div class="space-y-4">
			<div class="text-right">
				<p class="text-xl text-gray-800 leading-relaxed" dir="rtl" style="font-family: 'Amiri', 'Scheherazade', serif;">
					{displayAyah().arabic}
				</p>
			</div>
			
			<div class="border-t pt-4">
				<p class="text-gray-700 italic mb-2">
					"{displayAyah().translation}"
				</p>
				<p class="text-sm text-gray-500 font-medium">
					— {displayAyah().reference}
				</p>
			</div>

			<div class="flex items-center justify-between pt-2">
				<span class="text-xs text-gray-400">
					{dayjs().format('dddd, MMMM D, YYYY')}
				</span>
				<button 
					class="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
					onclick={() => {
						if (navigator.share) {
							navigator.share({
								title: 'Daily Ayah',
								text: `${displayAyah().translation} — ${displayAyah().reference}`
							});
						}
					}}
					aria-label="Share this ayah"
				>
					<Share2 class="w-4 h-4" aria-hidden="true" />
					Share
				</button>
			</div>
		</div>
	{:else}
		<div class="text-center py-8">
			<BookOpen class="w-12 h-12 text-gray-300 mx-auto mb-2" aria-hidden="true" />
			<p class="text-gray-500 text-sm">No daily ayah yet</p>
		</div>
	{/if}
</div>
</ComponentErrorBoundary>

