<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { widgetRegistry } from '$lib/widgetRegistry';
	import type { WidgetConfig } from '$lib/types/widget';
	import type { Database } from '$lib/supabase';
	import { supabase } from '$lib/supabase';
	import { HeartHandshake, Leaf, ChevronDown, User } from 'lucide-svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import Avatar from '$lib/../components/ui/Avatar.svelte';
	import { profileStore } from '$lib/stores/profileStore';
	import { getAuthorAvatar } from '$lib/utils/avatar';

	let widgets: WidgetConfig[] = $state([]);
	let loadedWidgets: { config: WidgetConfig, component: any }[] = $state([]);
	let items: Database['public']['Tables']['items']['Row'][] = $state([]);
	let interactions: Database['public']['Tables']['interactions']['Row'][] = $state([]);
	let loading = $state(true);
	let userName = $derived($user?.user_metadata?.full_name || $user?.email?.split('@')[0] || 'Friend');

	// Individual widget collapse states
	let widgetCollapseStates = $state<Record<string, boolean>>({});
	
	// Initialize widget collapse states
	function initializeWidgetStates(allWidgets: WidgetConfig[]) {
		const initialStates: Record<string, boolean> = {};
		allWidgets.forEach(widget => {
			// Default to expanded for anchor widgets, collapsed for others
			if (['reflectionMood', 'ayah', 'birthday', 'scenario', 'closingRitual'].includes(widget.id)) {
				initialStates[widget.id] = true;
			} else {
				initialStates[widget.id] = false;
			}
		});
		// Add quietMode state - starts collapsed
		initialStates['quietMode'] = false;
		widgetCollapseStates = initialStates;
	}
	
	function toggleWidget(widgetId: string) {
		widgetCollapseStates[widgetId] = !widgetCollapseStates[widgetId];
	}

	// Use profileStore instead of local profiles state
	let profiles = $derived($profileStore);

	// Get current user's profile for avatar
	let currentUserProfile = $derived(() => {
		if ($user?.email) {
			return profiles.find(p => p.email === $user.email);
		}
		return null;
	});

	function handleWidgetView(widgetId: string) {
		widgetRegistry.recordView(widgetId);
	}

	function handleWidgetInteraction(widgetId: string) {
		widgetRegistry.recordInteraction(widgetId);
	}

	async function loadWidgets() {
		widgets = widgetRegistry.getSorted();
		
		// Load components for enabled widgets
		const componentPromises = widgets.map(async (widget) => {
			try {
				// Widget component is a function that returns a promise with the component
				const componentModule = await (widget.component as () => Promise<{default: any}>)();
				return { 
					config: widget, 
					component: componentModule.default
				};
			} catch (error) {
				console.error(`Failed to load widget ${widget.id}:`, error);
				return null;
			}
		});

		const results = await Promise.all(componentPromises);
		loadedWidgets = results.filter(result => result !== null) as { config: WidgetConfig, component: any }[];
		
		// Initialize widget states after loading
		initializeWidgetStates(widgets);
	}

	async function loadData() {
		if (!$session?.user?.id) {
			goto('/');
			return;
		}

		try {
			loading = true;

			// Load items
			const { data: itemsData, error: itemsError } = await supabase
				.from('items')
				.select('*')
				.order('created_at', { ascending: false });

			if (itemsError) throw itemsError;
			items = itemsData || [];

			// Load interactions
			const { data: interactionsData, error: interactionsError } = await supabase
				.from('interactions')
				.select('*')
				.order('created_at', { ascending: false });

			if (interactionsError) throw interactionsError;
			interactions = interactionsData || [];

			// Load widgets
			await loadWidgets();

		} catch (error) {
			console.error('Error loading dashboard data:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>Family Dashboard | FamilyNest</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
	<!-- Header -->
	<header class="bg-white border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<HeartHandshake class="w-8 h-8 text-primary-600" aria-hidden="true" />
					<div>
						<h1 class="text-2xl font-bold text-gray-900">FamilyNest</h1>
						<p class="text-sm text-gray-600">Your family's sacred space</p>
					</div>
				</div>
				
				<div class="flex items-center gap-4">
					<div class="text-right">
						<p class="text-sm font-medium text-gray-900">
							🌿 Salam {userName}
						</p>
						<p class="text-xs text-gray-500">Welcome back</p>
					</div>
					
					{#if currentUserProfile()}
						{@const profile = currentUserProfile()}
						{#if profile}
							<Avatar 
								src={getAuthorAvatar(profile)} 
								alt={profile.display_name || 'User avatar'}
								size="md"
							/>
						{/if}
					{:else}
						<div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
							<User class="w-6 h-6 text-gray-600" aria-hidden="true" />
						</div>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if loading}
			<Loading skeleton={true} skeletonCount={4} />
		{:else}
			<!-- ANCHOR WIDGETS - Maximum 3-4 visible at first load -->
			<div class="space-y-8 mb-12">
				<div class="text-center mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-2">Today's Family Connection</h2>
					<p class="text-gray-600">Your daily anchors for staying close</p>
				</div>
				
				{#each loadedWidgets.filter(w => ['reflectionMood', 'ayah', 'birthday', 'quiz', 'scenario'].includes(w.config.id)) as { config: widget, component: Component } (widget.id)}
					<div class="w-full max-w-2xl mx-auto">
						<button
							type="button"
							class="w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg transition-transform hover:scale-[1.02]"
							onmouseenter={() => handleWidgetView(widget.id)}
							onclick={() => handleWidgetInteraction(widget.id)}
							aria-label="View {widget.name} widget"
						>
							<Component 
								session={$session}
								{profiles}
								{items}
								{interactions}
								{widget}
							/>
						</button>
					</div>
				{/each}
			</div>

			<!-- CLOSING RITUAL - Always visible -->
			<div class="w-full max-w-2xl mx-auto mb-12">
				{#each loadedWidgets.filter(w => w.config.id === 'closingRitual') as { config: widget, component: Component } (widget.id)}
					<button
						type="button"
						class="w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
						onmouseenter={() => handleWidgetView(widget.id)}
						onclick={() => handleWidgetInteraction(widget.id)}
						aria-label="View {widget.name} widget"
					>
						<Component 
							session={$session}
							{profiles}
							{items}
							{interactions}
							{widget}
						/>
					</button>
				{/each}
			</div>

			<!-- QUIET MODE WIDGETS - Collapsed by default, shown in "Explore More" -->
			<div class="w-full max-w-4xl mx-auto">
				<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
					<button
						type="button"
						onclick={() => toggleWidget('quietMode')}
						class="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-gray-50 transition-colors"
						aria-expanded={widgetCollapseStates['quietMode']}
					>
						<div class="flex items-center gap-4">
							<span class="text-3xl">🔍</span>
							<div>
								<h3 class="text-lg font-semibold text-gray-900">Explore More</h3>
								<p class="text-sm text-gray-500">Additional activities, memories, and family insights</p>
							</div>
						</div>
						<ChevronDown 
							class="w-6 h-6 text-gray-400 transition-transform duration-300 ease-in-out {widgetCollapseStates['quietMode'] ? 'rotate-180' : ''}"
							aria-hidden="true"
						/>
					</button>
					
					{#if widgetCollapseStates['quietMode']}
						<div class="px-6 pb-6 border-t border-gray-100 bg-gray-50">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
								{#each loadedWidgets.filter(w => ['wall', 'scenarioDigest', 'profileQuiz', 'agePlayground', 'professionCard', 'islamicQA', 'islamicReflectionDigest', 'weeklyReflectionDigest'].includes(w.config.id)) as { config: widget, component: Component } (widget.id)}
									<div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
										<div class="flex items-center gap-2 mb-4">
											<h4 class="text-sm font-semibold text-gray-900">{widget.name}</h4>
										</div>
										<button
											type="button"
											class="w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
											onmouseenter={() => handleWidgetView(widget.id)}
											onclick={() => handleWidgetInteraction(widget.id)}
											aria-label="View {widget.name} widget"
										>
											<Component 
												session={$session}
												{profiles}
												{items}
												{interactions}
												{widget}
											/>
										</button>
									</div>
								{:else}
									<div class="col-span-2 text-center py-12">
										<Leaf class="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
										<p class="text-gray-500">No additional widgets available at this time.</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>

			{#if loadedWidgets.length === 0}
				<div class="text-center py-16">
					<Leaf class="w-20 h-20 text-gray-300 mx-auto mb-4" aria-hidden="true" />
					<h2 class="text-xl font-semibold text-gray-900 mb-2">No widgets available</h2>
					<p class="text-gray-500">Check your widget settings or reload the page.</p>
				</div>
			{/if}
		{/if}
	</main>
</div>