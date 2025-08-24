<script lang="ts">
	import type { WidgetProps } from '$lib/types/widget';
	import { supabase } from '$lib/supabase';
	import { eventBus } from '$lib/eventBus';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import { Home, Plus, X, Heart, MessageCircle, Share2 } from 'lucide-svelte';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import PostComposer from '$lib/../components/PostComposer.svelte';
	import PostCard from '$lib/../components/PostCard.svelte';
	import { profileStore } from '$lib/stores/profileStore';

	dayjs.extend(relativeTime);

	interface Props extends WidgetProps {}

	let { session, items, interactions }: Props = $props();

	// Subscribe to profileStore instead of using props
	let profiles = $derived($profileStore);

	let recentPosts = $derived(items
		.filter(item => item.kind === 'post' && !item.is_deleted)
		.sort((a, b) => dayjs(b.created_at).unix() - dayjs(a.created_at).unix())
		.slice(0, 3));

	let showComposer = $state(false);

	function handlePostCreated() {
		showComposer = false;
		// Trigger data refresh
		eventBus.emit('postCreated', { itemId: '', authorEmail: session?.user?.email || '', content: '' });
		location.reload(); // Simple refresh for now
	}
</script>

<ComponentErrorBoundary componentName="WallCard">
<div class="card">
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<Home class="w-6 h-6 text-blue-500" aria-hidden="true" />
			<h3 class="text-lg font-semibold text-gray-900">Family Wall</h3>
		</div>
		<button
			onclick={() => showComposer = !showComposer}
			class="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
			aria-label={showComposer ? 'Cancel post' : 'Create new post'}
		>
			{#if showComposer}
				<X class="w-4 h-4" aria-hidden="true" />
				Cancel
			{:else}
				<Plus class="w-4 h-4" aria-hidden="true" />
				Post
			{/if}
		</button>
	</div>

	{#if showComposer}
		<div class="mb-4">
			<PostComposer 
				onPostCreated={handlePostCreated}
				onCancel={() => showComposer = false}
				placeholder="Share something with your family..."
				embedded={true}
			/>
		</div>
	{/if}

	<div class="space-y-4">
		{#if recentPosts.length === 0}
			<div class="text-center py-8">
				<Home class="w-12 h-12 text-gray-300 mx-auto mb-2" aria-hidden="true" />
				<p class="text-gray-500 mb-2">No posts yet!</p>
				<button
					onclick={() => showComposer = true}
					class="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
				>
					Be the first to share
				</button>
			</div>
		{:else}
			{#each recentPosts as post (post.id)}
				<ComponentErrorBoundary componentName="Post">
					<PostCard 
						{post} 
						{interactions}
						onInteraction={handlePostCreated}
						showComments={false}
					/>
				</ComponentErrorBoundary>
			{/each}
		{/if}

		{#if recentPosts.length > 0}
			<div class="text-center">
				<a 
					href="/posts" 
					class="text-primary-600 hover:text-primary-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
				>
					View all posts →
				</a>
			</div>
		{/if}
	</div>
</div>
</ComponentErrorBoundary>