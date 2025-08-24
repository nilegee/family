<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { eventBus } from '$lib/eventBus';
	import type { Database } from '$lib/supabase';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import PostComposer from '$lib/../components/PostComposer.svelte';
	import PostCard from '$lib/../components/PostCard.svelte';
	import ErrorBoundary from '$lib/../components/ui/ErrorBoundary.svelte';
	import ComponentErrorBoundary from '$lib/../components/ui/ComponentErrorBoundary.svelte';
	import { profileStore } from '$lib/stores/profileStore';
	import { getAuthorAvatar, getAuthorName, findProfileByEmail } from '$lib/utils/avatar';

	dayjs.extend(relativeTime);

	let posts: Database['public']['Tables']['items']['Row'][] = $state([]);
	let allItems: Database['public']['Tables']['items']['Row'][] = $state([]); // Include posts and comments
	let interactions: Database['public']['Tables']['interactions']['Row'][] = $state([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let error = $state<string | null>(null);
	let page = $state(0);
	const postsPerPage = 10;

	// Use profileStore instead of local profiles state
	let profiles = $derived($profileStore);

	// Post composer state
	let showComposer = $state(false);
	
	// Get comments for each post
	let commentsMap = $derived(() => {
		const map = new Map<string, Database['public']['Tables']['items']['Row'][]>();
		
		allItems
			.filter(item => item.kind === 'comment' && item.parent_id)
			.forEach(comment => {
				const parentId = comment.parent_id!;
				if (!map.has(parentId)) {
					map.set(parentId, []);
				}
				map.get(parentId)!.push(comment);
			});
			
		// Sort comments by creation date
		map.forEach((comments, postId) => {
			comments.sort((a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix());
		});
		
		return map;
	});

	onMount(async () => {
		if (!$session) {
			goto('/');
			return;
		}

		await loadData();
		loading = false;
	});

	async function loadData() {
		try {
			error = null;
			await Promise.all([
				loadPosts(),
				loadAllItems(),
				loadInteractions()
			]);
		} catch (err) {
			console.error('Error loading posts data:', err);
			error = 'Failed to load posts. Please try again.';
		}
	}

	async function loadPosts(append = false) {
		try {
			const { data, error: fetchError } = await supabase
				.from('items')
				.select('*')
				.eq('kind', 'post')
				.eq('is_deleted', false)
				.order('created_at', { ascending: false })
				.range(page * postsPerPage, (page + 1) * postsPerPage - 1);

			if (fetchError) throw fetchError;

			if (data) {
				if (append) {
					posts = [...posts, ...data];
				} else {
					posts = data;
				}
			}
		} catch (error) {
			console.error('Error loading posts:', error);
			throw error;
		}
	}

	async function loadAllItems() {
		try {
			const { data, error: fetchError } = await supabase
				.from('items')
				.select('*')
				.eq('is_deleted', false)
				.order('created_at', { ascending: false });

			if (fetchError) throw fetchError;
			allItems = data || [];
		} catch (error) {
			console.error('Error loading all items:', error);
			throw error;
		}
	}

	async function loadInteractions() {
		try {
			const { data, error: fetchError } = await supabase
				.from('interactions')
				.select('*');
			
			if (fetchError) throw fetchError;
			interactions = data || [];
		} catch (error) {
			console.error('Error loading interactions:', error);
			throw error;
		}
	}

	async function loadMorePosts() {
		if (loadingMore) return;
		
		loadingMore = true;
		page++;
		await loadPosts(true);
		loadingMore = false;
	}

	function handlePostCreated() {
		showComposer = false;
		// Refresh all data
		loadData();
	}

	async function retryLoad() {
		error = null;
		loading = true;
		try {
			await loadData();
		} catch (err) {
			console.error('Retry failed:', err);
			error = 'Failed to load posts. Please check your connection and try again.';
		} finally {
			loading = false;
		}
	}

	// Interaction helper functions
	function isLiked(postId: string): boolean {
		return interactions.some(i => 
			i.item_id === postId && 
			i.type === 'like' && 
			i.user_email === $session?.user?.email
		);
	}

	function getLikeCount(postId: string): number {
		return interactions.filter(i => i.item_id === postId && i.type === 'like').length;
	}

	async function toggleLike(postId: string) {
		if (!$session?.user?.email) return;
		
		try {
			if (isLiked(postId)) {
				await supabase
					.from('interactions')
					.delete()
					.eq('item_id', postId)
					.eq('user_email', $session.user.email)
					.eq('type', 'like');
			} else {
				await supabase.from('interactions').insert({
					item_id: postId,
					user_email: $session.user.email,
					type: 'like'
				} as Database['public']['Tables']['interactions']['Insert']);
			}
			
			// Refresh interactions
			await loadInteractions();
		} catch (error) {
			console.error('Error toggling like:', error);
		}
	}
</script>

<svelte:head>
	<title>Posts - Family</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<header class="bg-white shadow-sm border-b sticky top-0 z-40">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<h1 class="text-xl font-semibold text-gray-900">Family Posts</h1>
				<button
					type="button"
					onclick={() => showComposer = !showComposer}
					class="btn btn-primary"
				>
					{showComposer ? 'Cancel' : '+ New Post'}
				</button>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		<ErrorBoundary>
			{#if showComposer}
				<div class="mb-6">
					<PostComposer 
						onPostCreated={handlePostCreated}
						onCancel={() => showComposer = false}
						placeholder="What's on your mind? Share something meaningful..."
					/>
				</div>
			{/if}

			{#if loading}
				<Loading text="Loading posts..." />
			{:else if error}
				<div class="text-center py-12">
					<div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
						<div class="text-red-600 text-lg font-medium mb-2">
							Couldn't load family posts
						</div>
						<p class="text-red-500 text-sm mb-4">{error}</p>
						<button
							type="button"
							onclick={retryLoad}
							class="btn btn-primary"
						>
							Try again
						</button>
					</div>
				</div>
			{:else}
			<div class="space-y-6">
				{#if posts.length === 0}
					<div class="text-center py-12">
						<p class="text-gray-500 mb-4">No posts yet!</p>
						<button
							type="button"
							onclick={() => showComposer = true}
							class="btn btn-primary"
						>
							Share the first post
						</button>
					</div>
				{:else}
					{#each posts as post (post.id)}
						<ComponentErrorBoundary componentName="Post">
							<PostCard 
								{post}
								{interactions}
								onInteraction={() => loadInteractions()}
							/>
						</ComponentErrorBoundary>
					{/each}
					
					{#if posts.length >= postsPerPage}
						<div class="text-center py-6">
							<button
								type="button"
								onclick={loadMorePosts}
								disabled={loadingMore}
								class="btn btn-secondary disabled:opacity-50"
							>
								{loadingMore ? 'Loading...' : 'Load More Posts'}
							</button>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
		</ErrorBoundary>
	</main>
</div>