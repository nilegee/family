<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { Gamepad2, Users, ArrowRight, Clock } from 'lucide-svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import { profileStore } from '$lib/stores/profileStore';
	import { 
		calculateFamilyAges, 
		getFamilyMemberDisplayNames, 
		hasRequiredDobs, 
		getChildrenProfiles 
	} from '$lib/utils/age';

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	// Subscribe to profileStore
	let profiles = $derived($profileStore);
	
	// Get children profiles for the base selector
	let childrenProfiles = $derived(getChildrenProfiles(profiles));
	
	// Check if we have enough DOB data
	let hasEnoughData = $derived(hasRequiredDobs(profiles));
	
	// Get display names
	let displayNames = $derived(getFamilyMemberDisplayNames(profiles));
	
	// State for the playground
	let selectedBaseChild = $state('');
	let targetAge = $state(10);
	let familyAges = $state<{ [email: string]: number }>({});

	// Calculate family ages when inputs change
	$effect(() => {
		if (selectedBaseChild && targetAge && profiles.length > 0) {
			familyAges = calculateFamilyAges(profiles, selectedBaseChild, targetAge);
		} else {
			familyAges = {};
		}
	});

	// Calculate max age based on user
	let maxAge = $derived(() => {
		// Ghassan can reach age 70, others limited to 18
		if (session?.user?.email === 'nilezat@gmail.com') {
			return 70;
		}
		return 18;
	});

	let maxAgeLabel = $derived(() => {
		return maxAge() === 70 ? '70 years' : '18 years';
	});

	// Auto-select first child if none selected
	$effect(() => {
		if (childrenProfiles.length > 0 && !selectedBaseChild) {
			selectedBaseChild = childrenProfiles[0].email;
		}
	});
</script>

<ComponentErrorBoundary componentName="AgePlaygroundCard">
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<Gamepad2 class="w-6 h-6 text-blue-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">Age Playground</h3>
	</div>

	{#if !hasEnoughData}
		<div class="text-center py-8">
			<Users class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-gray-500 text-sm mb-3">
				Not enough family birthdays recorded to play with ages.
			</p>
			<a 
				href="/profile" 
				class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
			>
				<Clock class="w-4 h-4" aria-hidden="true" />
				Add Birthdays
				<ArrowRight class="w-4 h-4" aria-hidden="true" />
			</a>
		</div>
	{:else if childrenProfiles.length === 0}
		<div class="text-center py-8">
			<Users class="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
			<p class="text-gray-500 text-sm">
				No children profiles found to use as base age.
			</p>
		</div>
	{:else}
		<div class="space-y-6">
			<!-- Base Child Selector -->
			<div>
				<label for="base-child" class="block text-sm font-medium text-gray-700 mb-2">
					Set age for:
				</label>
				<select
					id="base-child"
					bind:value={selectedBaseChild}
					class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
				>
					{#each childrenProfiles as child (child.email)}
						<option value={child.email}>
							{displayNames[child.email]}
						</option>
					{/each}
				</select>
			</div>

			<!-- Age Slider -->
			<div>
				<label for="target-age" class="block text-sm font-medium text-gray-700 mb-2">
					Target age: <span class="font-semibold text-primary-600">{targetAge} years old</span>
				</label>
				<input
					id="target-age"
					type="range"
					min="1"
					max="{maxAge()}"
					step="1"
					bind:value={targetAge}
					class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
				/>
				<div class="flex justify-between text-xs text-gray-500 mt-1">
					<span>1 year</span>
					<span>{maxAgeLabel()}</span>
				</div>
			</div>

			<!-- Family Ages Display -->
			{#if Object.keys(familyAges).length > 0}
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<h4 class="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
						<Users class="w-4 h-4" aria-hidden="true" />
						Family Ages
					</h4>
					
					<div class="grid grid-cols-1 gap-2">
						{#each Object.entries(familyAges) as [email, age] (email)}
							<div class="flex justify-between items-center py-1">
								<span class="text-sm text-blue-800">
									{displayNames[email] || email.split('@')[0]}
								</span>
								<span class="text-sm font-semibold text-blue-900">
									{age} years old
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Fun Note -->
			<div class="bg-gray-50 rounded-lg p-3">
				<div class="flex items-center justify-center gap-2">
					<Gamepad2 class="w-4 h-4 text-purple-500" aria-hidden="true" />
					<p class="text-xs text-gray-600 text-center">
						Explore "what if" scenarios by adjusting ages!
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
</ComponentErrorBoundary>

<style>
	.slider::-webkit-slider-thumb {
		appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #0ea5e9;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.slider::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: #0ea5e9;
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style>