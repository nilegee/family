<script lang="ts">
	import { page } from '$app/stores';
	import { notificationStore } from '$lib/stores/notificationStore';
	import { Home, FileText, User, Bell } from 'lucide-svelte';

	let currentPath = $derived($page.url.pathname);
	let unreadCount = $derived(notificationStore.getUnreadCount());

	let navItems = $derived([
		{ href: '/dashboard', label: 'Dashboard', icon: Home },
		{ href: '/posts', label: 'Posts', icon: FileText },
		{ href: '/notifications', label: 'Notifications', icon: Bell, unreadCount },
		{ href: '/profile', label: 'Profile', icon: User }
	]);
</script>

<nav 
	class="bg-white border-b border-gray-200 shadow-sm"
	aria-label="Main navigation"
>
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-16">
			<!-- Logo/Brand -->
			<div class="flex items-center">
				<h1 class="text-xl font-bold text-primary-600">Mayo</h1>
			</div>
			
			<!-- Navigation Links -->
			<div class="flex space-x-8">
				{#each navItems as item}
					{@const IconComponent = item.icon}
					<a
						href={item.href}
						class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
						class:text-primary-600={currentPath === item.href}
						class:bg-primary-50={currentPath === item.href}
						class:text-gray-500={currentPath !== item.href}
						class:hover:text-gray-700={currentPath !== item.href}
						aria-label="{item.label} page"
						aria-current={currentPath === item.href ? 'page' : undefined}
					>
						<div class="relative flex items-center">
							<IconComponent class="w-5 h-5 mr-2" aria-hidden="true" />
							<span>{item.label}</span>
							{#if item.unreadCount && item.unreadCount > 0}
								<span class="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-5">
									{item.unreadCount > 99 ? '99+' : item.unreadCount}
								</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</div>
	</div>
</nav>