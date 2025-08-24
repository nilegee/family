<script lang="ts">
	import { onMount } from 'svelte';
	import { session } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import { profileStore } from '$lib/stores/profileStore';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import Loading from '$lib/../components/ui/Loading.svelte';

	dayjs.extend(relativeTime);

	interface Notification {
		id: string;
		type: 'info' | 'success' | 'warning' | 'error';
		title: string;
		message: string;
		read: boolean;
		createdAt: string;
		data?: any;
	}

	let notifications = $state<Notification[]>([]);
	let loading = $state(true);
	let error = $state('');
	let profiles = $derived($profileStore);

	onMount(() => {
		if (!$session) {
			goto('/');
			return;
		}

		loadNotifications();
	});

	function getDisplayName(email: string): string {
		const profile = profiles.find(p => p.email === email);
		return profile?.display_name || email.split('@')[0];
	}

	async function loadNotifications() {
		if (!$session?.user?.email) return;
		
		try {
			loading = true;
			error = '';
			
			// Get recent interactions on user's posts (likes, comments)
			const { data: userItems, error: itemsError } = await supabase
				.from('items')
				.select('id, body, created_at')
				.eq('author_email', $session.user.email)
				.eq('is_deleted', false)
				.order('created_at', { ascending: false })
				.limit(20);

			if (itemsError) throw itemsError;

			const { data: interactions, error: interactionsError } = await supabase
				.from('interactions')
				.select('*')
				.in('item_id', userItems?.map(item => item.id) || [])
				.neq('user_email', $session.user.email) // Exclude user's own interactions
				.order('created_at', { ascending: false })
				.limit(50);

			if (interactionsError) throw interactionsError;

			// Get recent comments on user's posts
			const { data: comments, error: commentsError } = await supabase
				.from('items')
				.select('*, parent:parent_id(body, author_email)')
				.eq('kind', 'comment')
				.neq('author_email', $session.user.email)
				.in('parent_id', userItems?.map(item => item.id) || [])
				.order('created_at', { ascending: false })
				.limit(20);

			if (commentsError) throw commentsError;

			// Convert to notifications
			const newNotifications: Notification[] = [];

			// Add interaction notifications
			interactions?.forEach(interaction => {
				const item = userItems?.find(i => i.id === interaction.item_id);
				if (item) {
					const actorName = getDisplayName(interaction.user_email);
					let message = '';
					
					switch (interaction.type) {
						case 'like':
							message = `${actorName} liked your post`;
							break;
						case 'vote':
							message = `${actorName} voted on your poll`;
							break;
						default:
							message = `${actorName} interacted with your post`;
					}

					newNotifications.push({
						id: `interaction-${interaction.item_id}-${interaction.user_email}-${interaction.type}`,
						type: 'success',
						title: 'New Interaction',
						message,
						read: false,
						createdAt: interaction.created_at || '',
						data: { itemId: interaction.item_id, type: interaction.type }
					});
				}
			});

			// Add comment notifications
			comments?.forEach(comment => {
				const actorName = getDisplayName(comment.author_email);
				newNotifications.push({
					id: `comment-${comment.id}`,
					type: 'info',
					title: 'New Comment',
					message: `${actorName} commented on your post`,
					read: false,
					createdAt: comment.created_at || '',
					data: { commentId: comment.id, parentId: comment.parent_id }
				});
			});

			// Sort by creation date
			notifications = newNotifications.sort((a, b) => 
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);

		} catch (err) {
			console.error('Error loading notifications:', err);
			error = 'Failed to load notifications. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function markAllAsRead() {
		notifications = notifications.map(n => ({ ...n, read: true }));
	}

	async function markAsRead(notificationId: string) {
		notifications = notifications.map(n => 
			n.id === notificationId ? { ...n, read: true } : n
		);
	}

	async function clearNotifications() {
		notifications = [];
	}

	async function retryLoad() {
		await loadNotifications();
	}

	import { CheckCircle, AlertTriangle, XCircle, Info, Bell, X, MessageCircle, Heart, RefreshCw } from 'lucide-svelte';

	function getNotificationIcon(type: Notification['type']) {
		switch (type) {
			case 'success': return CheckCircle;
			case 'warning': return AlertTriangle;
			case 'error': return XCircle;
			default: return Info;
		}
	}

	function getNotificationColor(type: Notification['type']) {
		switch (type) {
			case 'success': return 'text-green-600 bg-green-50 border-green-200';
			case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'error': return 'text-red-600 bg-red-50 border-red-200';
			default: return 'text-blue-600 bg-blue-50 border-blue-200';
		}
	}

	function getActivityIcon(notification: Notification) {
		if (notification.data?.type === 'like') return Heart;
		if (notification.title === 'New Comment') return MessageCircle;
		return Info;
	}
</script>

<svelte:head>
	<title>Notifications - Family</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<h1 class="text-xl font-semibold text-gray-900">Notifications</h1>
				<div class="flex gap-2">
					{#if notifications.some(n => !n.read)}
						<button
							type="button"
							onclick={markAllAsRead}
							class="text-primary-600 hover:text-primary-700 font-medium text-sm"
						>
							Mark all as read
						</button>
					{/if}
					<button
						type="button"
						onclick={retryLoad}
						disabled={loading}
						class="text-gray-600 hover:text-gray-700 font-medium text-sm flex items-center gap-1"
					>
						<RefreshCw class="w-4 h-4" aria-hidden="true" />
						Refresh
					</button>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4">
				<p class="text-red-700">{error}</p>
				<button 
					type="button"
					onclick={retryLoad}
					class="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
				>
					Try again
				</button>
			</div>
		{:else if loading}
			<Loading text="Loading notifications..." />
		{:else if notifications.length === 0}
			<div class="text-center py-12">
				<Bell class="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
				<h2 class="text-xl font-semibold text-gray-900 mb-2">No notifications yet</h2>
				<p class="text-gray-500">When something happens in your family, you'll see it here.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each notifications as notification (notification.id)}
					{@const ActivityIcon = getActivityIcon(notification)}
					<div 
						class="p-4 border rounded-lg {getNotificationColor(notification.type)}"
						class:opacity-60={notification.read}
					>
						<div class="flex items-start gap-3">
							<ActivityIcon 
								class="w-5 h-5 mt-0.5 flex-shrink-0" 
								aria-hidden="true"
							/>
							<div class="flex-1">
								<div class="flex items-center justify-between mb-1">
									<h3 class="font-semibold">{notification.title}</h3>
									<div class="flex items-center gap-2">
										<span class="text-xs opacity-75">
											{dayjs(notification.createdAt).fromNow()}
										</span>
										{#if !notification.read}
											<button
												type="button"
												onclick={() => markAsRead(notification.id)}
												class="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
											>
												Mark read
											</button>
										{/if}
									</div>
								</div>
								<p class="text-sm opacity-90">{notification.message}</p>
							</div>
							<button
								type="button"
								onclick={() => {
									notifications = notifications.filter(n => n.id !== notification.id);
								}}
								class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
								aria-label="Remove notification"
							>
								<X class="w-4 h-4" aria-hidden="true" />
							</button>
						</div>
					</div>
				{/each}
			</div>

			{#if notifications.length > 0}
				<div class="mt-8 text-center">
					<button
						type="button"
						onclick={clearNotifications}
						class="text-red-600 hover:text-red-700 font-medium text-sm"
					>
						Clear all notifications
					</button>
				</div>
			{/if}
		{/if}
	</main>
</div>