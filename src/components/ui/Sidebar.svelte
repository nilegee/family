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
		{ href: '/dashboard', label: 'Dashboard', icon: Home, description: 'Smart widgets & overview' },
		{ href: '/posts', label: 'Wall', icon: FileText, description: 'Family posts & memories' },
		{ href: '#', label: 'Quick Post', icon: Plus, action: 'composer', description: 'Share something new' },
		{ href: '/notifications', label: 'Notifications', icon: Bell, unreadCount, description: 'Stay updated' },
		{ href: '/profile', label: 'Profile', icon: User, description: 'Your settings & info' }
	]);

	function handleItemClick(item: typeof navItems[0], event: Event) {
		if (item.action === 'composer') {
			event.preventDefault();
			onComposerOpen?.();
		}
	}
</script>

<aside 
	class="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40 flex flex-col"
	aria-label="Main navigation"
>
	<!-- Header -->
	<div class="p-6 border-b border-gray-200">
		<div class="flex items-center">
			<div class="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 w-8 h-8 flex items-center justify-center text-white font-bold mr-3" aria-label="Family (Ghassan & Mariem)">
				GM
			</div>
			<h1 class="text-xl font-bold text-gray-900">Family</h1>
		</div>
		<p class="text-sm text-gray-500 mt-1">Family Connection Hub</p>
	</div>
	
	<!-- Navigation Items -->
	<nav class="flex-1 p-4">
		<ul class="space-y-2">
			{#each navItems as item}
				{@const IconComponent = item.icon}
				<li>
					<a 
						href={item.href}
						onclick={(e) => handleItemClick(item, e)}
						class="flex items-center p-3 text-sm rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 group"
						class:bg-primary-50={currentPath === item.href}
						class:text-primary-700={currentPath === item.href}
						class:border-l-4={currentPath === item.href}
						class:border-primary-500={currentPath === item.href}
						class:text-gray-600={currentPath !== item.href}
						class:hover:bg-gray-50={currentPath !== item.href}
						class:hover:text-gray-900={currentPath !== item.href}
						aria-label="{item.label} - {item.description}"
						aria-current={currentPath === item.href ? 'page' : undefined}
					>
						<div class="relative flex items-center min-w-0 flex-1">
							<IconComponent 
								class="w-5 h-5 mr-3 flex-shrink-0 {currentPath === item.href ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}" 
								aria-hidden="true" 
							/>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between">
									<span class="font-medium truncate">{item.label}</span>
									{#if item.unreadCount && item.unreadCount > 0}
										<span class="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-5 ml-2">
											{item.unreadCount > 99 ? '99+' : item.unreadCount}
										</span>
									{/if}
								</div>
								<p class="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
							</div>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
	
	<!-- Footer -->
	<div class="p-4 border-t border-gray-200">
		<div class="text-xs text-gray-500 text-center">
			<p>Family App</p>
			<p class="mt-1">Stay connected, grow together</p>
		</div>
	</div>
</aside>