<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { Briefcase, GraduationCap, Wrench, Rocket, Computer, Plane, Truck } from 'lucide-svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import { profileStore } from '$lib/stores/profileStore';

	interface Props extends WidgetProps {}

	let { session }: Props = $props();

	// Subscribe to profileStore
	let profiles = $derived($profileStore);

	// Playful profession descriptions based on profiles
	const professionDescriptions: Record<string, { title: string; description: string; icon: any }> = {
		'ghassan': {
			title: 'Business',
			description: 'Helps people grow at work, Snack Boss at home.',
			icon: Briefcase
		},
		'mariem': {
			title: 'Hacker + Computer',
			description: 'Computer wizard in disguise, bedtime story maker.',
			icon: Computer
		},
		'yazid': {
			title: 'Engineer + Tank/Airplane',
			description: 'Wants to build tanks, airships, rockets.',
			icon: Truck
		},
		'yahya': {
			title: 'Engineer + Airplane',
			description: 'Wants to design rockets, airplanes, flying machines.',
			icon: Plane
		}
	};

	// Get profession info for family members
	let familyProfessions = $derived(() => {
		return profiles.map(profile => {
			const name = profile.display_name?.toLowerCase() || profile.email?.split('@')[0]?.toLowerCase() || '';
			const profession = professionDescriptions[name] || {
				title: 'Family Member',
				description: 'An amazing part of our family!',
				icon: Briefcase
			};
			return {
				profile,
				...profession
			};
		});
	});
</script>

<ComponentErrorBoundary componentName="ProfessionCard">
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<Briefcase class="w-6 h-6 text-purple-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">Family Roles & Dreams</h3>
	</div>

	<div class="space-y-4">
		{#each familyProfessions() as { profile, title, description, icon: Icon }}
			<div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
				<div class="flex-shrink-0">
					<Icon class="w-5 h-5 text-purple-500 mt-0.5" aria-hidden="true" />
				</div>
				<div class="flex-1 min-w-0">
					<h4 class="text-sm font-medium text-gray-900">
						{profile.display_name || profile.email?.split('@')[0] || 'Family Member'}
					</h4>
					<p class="text-xs text-gray-600 font-medium">{title}</p>
					<p class="text-xs text-gray-500 mt-1">{description}</p>
				</div>
			</div>
		{/each}

		{#if familyProfessions().length === 0}
			<div class="text-center py-6">
				<p class="text-gray-500 text-sm">Loading family information...</p>
			</div>
		{/if}
	</div>

	<div class="mt-4 p-3 bg-blue-50 rounded-lg">
		<p class="text-xs text-blue-600 font-medium">
			💡 Everyone has a special role that makes our family amazing!
		</p>
	</div>
</div>
</ComponentErrorBoundary>