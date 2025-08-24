<script lang="ts">
	import { page } from '$app/stores';
	import { notificationStore } from '$lib/stores/notificationStore';
	import { Home, FileText, User, Plus, Bell } from 'lucide-svelte';

	let currentPath = $derived($page.url.pathname);
	let unreadCount = $derived(notificationStore.getUnreadCount());

	// Props for handling composer action
	interface Props {
		onComposerOpen?: () => void;
	}
	
	let { onComposerOpen }: Props = $props();

	let navItems = $derived([
		{ href: '/dashboard', label: 'Home', icon: Home },
		{ href: '/posts', label: 'Posts', icon: FileText },
		{ href: '#', label: 'Add', icon: Plus, action: 'composer' },
		{ href: '/notifications', label: 'Notifications', icon: Bell, unreadCount },
		{ href: '/profile', label: 'Profile', icon: User }
	]);

	function handleItemClick(item: typeof navItems[0], event: Event) {
		if (item.action === 'composer') {
			event.preventDefault();
			onComposerOpen?.();
		}
	}
</script>

<nav 
	class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe"
	style="padding-bottom: env(safe-area-inset-bottom);"
	aria-label="Main navigation"
>
	<div class="flex justify-around items-center h-16">
		{#each navItems as item}
			{@const IconComponent = item.icon}
			<a 
				href={item.href}
				onclick={(e) => handleItemClick(item, e)}
				class="flex flex-col items-center justify-center p-2 text-xs relative min-h-11 min-w-11 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
				class:text-primary-600={currentPath === item.href}
				class:text-gray-500={currentPath !== item.href}
				class:bg-primary-50={currentPath === item.href}
				aria-label="{item.label} page"
				aria-current={currentPath === item.href ? 'page' : undefined}
			>
				<div class="relative">
					<IconComponent class="w-6 h-6 mb-1" aria-hidden="true" />
					{#if item.unreadCount && item.unreadCount > 0}
						<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-5">
							{item.unreadCount > 99 ? '99+' : item.unreadCount}
						</span>
					{/if}
				</div>
				<span class="font-medium">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>