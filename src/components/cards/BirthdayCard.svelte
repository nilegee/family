<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import dayjs from 'dayjs';
	import { Cake, PartyPopper, Gift } from 'lucide-svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import { profileStore } from '$lib/stores/profileStore';

	interface Props extends WidgetProps {}

	let { session, items, interactions }: Props = $props();

	// Subscribe to profileStore instead of using props
	let profiles = $derived($profileStore);

	let upcomingBirthdays = $derived(profiles
		.filter(profile => profile?.dob)
		.map(profile => {
			const birthday = dayjs(profile.dob);
			const thisYear = dayjs().year();
			const birthdayThisYear = birthday.year(thisYear);
			const birthdayNextYear = birthday.year(thisYear + 1);
			
			const daysUntilBirthday = birthdayThisYear.isAfter(dayjs()) 
				? birthdayThisYear.diff(dayjs(), 'day')
				: birthdayNextYear.diff(dayjs(), 'day');

			return {
				...profile,
				birthday: birthdayThisYear.isAfter(dayjs()) ? birthdayThisYear : birthdayNextYear,
				daysUntil: daysUntilBirthday,
				age: birthdayThisYear.isAfter(dayjs()) ? thisYear - birthday.year() : thisYear - birthday.year() + 1,
				isToday: daysUntilBirthday === 0
			};
		})
		.sort((a, b) => a.daysUntil - b.daysUntil)
		.slice(0, 3));
</script>

<ComponentErrorBoundary componentName="BirthdayCard">
<div class="card">
	<div class="flex items-center gap-2 mb-4">
		<Cake class="w-6 h-6 text-pink-500" aria-hidden="true" />
		<h3 class="text-lg font-semibold text-gray-900">Upcoming Birthdays</h3>
	</div>

	{#if !profiles || profiles.length === 0}
		<Loading size="md" text="Loading birthdays..." />
	{:else if upcomingBirthdays.length === 0}
		<div class="text-center py-8">
			<Cake class="w-12 h-12 text-gray-300 mx-auto mb-2" aria-hidden="true" />
			<p class="text-gray-500 text-sm">No upcoming birthdays</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each upcomingBirthdays as person (person.user_id)}
				<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
					<Cake class="w-5 h-5 text-pink-500 flex-shrink-0" aria-hidden="true" />
					
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 flex-wrap">
							<span class="font-medium text-gray-900 text-sm sm:text-base truncate">
								{person.display_name || person.email.split('@')[0]}
							</span>
							<span class="text-gray-600 text-sm sm:text-base flex-shrink-0">
								{#if person.isToday}
									🎉 Today! Turning {person.age}
								{:else if person.daysUntil === 1}
									Tomorrow, turning {person.age}
								{:else if person.daysUntil <= 7}
									In {person.daysUntil} days, turning {person.age}
								{:else}
									{person.birthday.format('MMM D')}, turning {person.age}
								{/if}
							</span>
						</div>
					</div>
					
					{#if person.isToday}
						<PartyPopper class="w-6 h-6 text-yellow-500 animate-bounce flex-shrink-0" aria-hidden="true" />
					{:else if person.daysUntil <= 7}
						<Gift class="w-5 h-5 text-pink-400 flex-shrink-0" aria-hidden="true" />
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
</ComponentErrorBoundary>