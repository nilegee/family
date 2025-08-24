<script lang="ts">
	import { Heart, MessageCircle, Share2, Play, Vote, Trash2 } from 'lucide-svelte';
	import { supabase } from '$lib/supabase';
	import { session } from '$lib/stores/sessionStore';
	import { profileStore } from '$lib/stores/profileStore';
	import { parseYouTubeUrl, getYouTubeEmbedUrl, extractYouTubeVideoId } from '$lib/utils/youtubeParser';
	import LiteYouTubeEmbed from './LiteYouTubeEmbed.svelte';
	import { getAuthorAvatar } from '$lib/utils/avatar';
	import SafeText from './ui/SafeText.svelte';
	import type { Database, PollData } from '$lib/supabase';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	
	dayjs.extend(relativeTime);
	
	interface PostCardProps {
		post: Database['public']['Tables']['items']['Row'];
		interactions: Database['public']['Tables']['interactions']['Row'][];
		onInteraction?: () => void;
		showComments?: boolean;
		level?: number; // For comment threading (0 = post, 1 = comment, 2 = reply)
	}
	
	let { 
		post, 
		interactions = [], 
		onInteraction, 
		showComments = true, 
		level = 0 
	}: PostCardProps = $props();
	
	let profiles = $derived($profileStore);
	let showReplyComposer = $state(false);
	let replyContent = $state('');
	let submittingReply = $state(false);
	let selectedPollOption = $state<number | null>(null);
	let hasVoted = $state(false);
	let deleting = $state(false);
	let showDeleteConfirm = $state(false);
	
	// Check if current user can delete this post
	let canDelete = $derived($session?.user?.email === post.author_email);
	
	// Get author info
	let authorProfile = $derived(() => {
		const profile = profiles.find(p => p.email === post.author_email);
		return profile || { email: post.author_email, display_name: null } as const;
	});
	let authorName = $derived(authorProfile().display_name || post.author_email.split('@')[0]);
	let authorAvatar = $derived(getAuthorAvatar(authorProfile()));
	
	// Interaction counts and status
	let likeCount = $derived(interactions.filter(i => i.item_id === post.id && i.type === 'like').length);
	let isLiked = $derived(interactions.some(i => 
		i.item_id === post.id && 
		i.type === 'like' && 
		i.user_email === $session?.user?.email
	));
	
	// Poll-specific data
	let pollData = $derived(() => {
		if (post.kind !== 'poll' || !post.data) return null;
		
		// Type guard for PollData
		const data = post.data;
		if (typeof data === 'object' && !Array.isArray(data) && data && 
		    'type' in data && data.type === 'options') {
			return data as unknown as PollData;
		}
		
		return null;
	});
	
	let pollVotes = $derived(() => {
		if (!pollData) return [];
		return interactions.filter(i => i.item_id === post.id && i.type === 'poll_vote');
	});
	
	let userVote = $derived(() => {
		if (!pollData) return null;
		return pollVotes().find(v => v.user_email === $session?.user?.email) || null;
	});
	
	// Check if user has already voted
	$effect(() => {
		hasVoted = !!userVote();
		if (userVote()) {
			selectedPollOption = userVote()?.answer_index || null;
		}
	});
	
	// Media rendering helpers
	function isYouTubeUrl(url: string): boolean {
		return url.includes('youtube.com/embed/') || 
		       url.includes('youtube.com/watch?') || 
		       url.includes('youtu.be/');
	}
	
	function isImageUrl(url: string): boolean {
		return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
	}
	
	function isVideoUrl(url: string): boolean {
		return /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
	}
	
	async function toggleLike() {
		if (!$session?.user?.email) return;
		
		// Optimistic update
		const wasLiked = isLiked;
		
		try {
			if (wasLiked) {
				await supabase
					.from('interactions')
					.delete()
					.eq('item_id', post.id)
					.eq('user_email', $session.user.email)
					.eq('type', 'like');
			} else {
				await supabase.from('interactions').insert({
					item_id: post.id,
					user_email: $session.user.email,
					type: 'like'
				} as Database['public']['Tables']['interactions']['Insert']);
			}
			
			onInteraction?.();
		} catch (error) {
			console.error('Error toggling like:', error);
			// Show error to user
			alert(`Failed to ${wasLiked ? 'unlike' : 'like'} post. Please try again.`);
		}
	}
	
	async function submitVote(optionIndex: number) {
		if (!$session?.user?.email || hasVoted || !pollData()) return;
		
		try {
			const { error } = await supabase.from('interactions').insert({
				item_id: post.id,
				user_email: $session.user.email,
				type: 'poll_vote',
				answer_index: optionIndex
			} as Database['public']['Tables']['interactions']['Insert']);
			
			if (error) throw error;
			
			selectedPollOption = optionIndex;
			hasVoted = true;
			onInteraction?.();
		} catch (error) {
			console.error('Error submitting vote:', error);
			// Show user-friendly error message
			alert('Failed to submit vote. Please try again.');
		}
	}
	
	async function submitReply() {
		if (!replyContent.trim() || !$session?.user?.email || submittingReply) return;
		
		try {
			submittingReply = true;
			
			const { error } = await supabase.from('items').insert({
				kind: 'comment',
				author_email: $session.user.email,
				author_id: $session.user.id,
				body: replyContent.trim(),
				parent_id: post.id,
				visibility: 'all'
			} as Database['public']['Tables']['items']['Insert']);
			
			if (error) throw error;
			
			replyContent = '';
			showReplyComposer = false;
			onInteraction?.();
		} catch (error) {
			console.error('Error submitting reply:', error);
		} finally {
			submittingReply = false;
		}
	}
	
	function getPollResults() {
		const data = pollData();
		if (!data || !data.options) return [];
		
		const totalVotes = pollVotes().length;
		return data.options.map((option, index) => {
			const votes = pollVotes().filter(v => v.answer_index === index).length;
			const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
			return {
				option,
				votes,
				percentage: Math.round(percentage)
			};
		});
	}

	async function deletePost() {
		if (!canDelete || deleting) return;
		
		try {
			deleting = true;
			
			// Hard delete the post
			const { error } = await supabase
				.from('items')
				.delete()
				.eq('id', post.id);
			
			if (error) throw error;
			
			// Hide the confirmation dialog
			showDeleteConfirm = false;
			
			// Trigger refresh
			onInteraction?.();
		} catch (error) {
			console.error('Error deleting post:', error);
			alert('Failed to delete post. Please try again.');
		} finally {
			deleting = false;
		}
	}
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4" style="margin-left: {level * 1.5}rem">
	<!-- Author info -->
	<div class="flex items-center gap-3 mb-3">
		<img src={authorAvatar} alt="{authorName}'s profile picture" loading="lazy" class="w-8 h-8 rounded-full object-cover" />
		
		<div>
			<p class="font-medium text-gray-900">{authorName}</p>
			<p class="text-sm text-gray-500">{dayjs(post.created_at).fromNow()}</p>
		</div>
		
		{#if post.kind !== 'post'}
			<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full uppercase">
				{post.kind}
			</span>
		{/if}
	</div>
	
	<!-- Content -->
	{#if post.body}
		<div class="mb-3">
			<SafeText text={post.body} />
		</div>
	{/if}
	
	<!-- Media content -->
	{#if post.media_urls && post.media_urls.length > 0}
		<div class="mb-3 space-y-3">
			{#each post.media_urls as mediaUrl}
				{#if isYouTubeUrl(mediaUrl)}
					{@const videoId = extractYouTubeVideoId(mediaUrl)}
					{#if videoId}
						<LiteYouTubeEmbed {videoId} title="Shared YouTube video" />
					{:else}
						<!-- Fallback for invalid YouTube URL -->
						<div class="aspect-video bg-gray-100 rounded-lg overflow-hidden">
							<iframe
								src={getYouTubeEmbedUrl(mediaUrl) || mediaUrl}
								title="YouTube video"
								class="w-full h-full"
								frameborder="0"
								allow="autoplay; encrypted-media; picture-in-picture; web-share"
								referrerpolicy="strict-origin-when-cross-origin"
								allowfullscreen
							></iframe>
						</div>
					{/if}
				{:else if isImageUrl(mediaUrl)}
					<div class="rounded-lg overflow-hidden">
						<img src={mediaUrl} alt="" loading="lazy" class="w-full h-auto object-cover" />
					</div>
				{:else if isVideoUrl(mediaUrl)}
					<div class="rounded-lg overflow-hidden">
						<video controls class="w-full h-auto">
							<source src={mediaUrl} type="video/mp4" />
							<track kind="captions" src="" srclang="en" label="English" />
							Your browser does not support the video tag.
						</video>
					</div>
				{:else}
					<!-- Display raw URL as clickable link for other media types -->
					<div class="p-3 bg-gray-50 rounded-lg border">
						<a 
							href={mediaUrl} 
							target="_blank" 
							rel="noopener noreferrer"
							class="text-primary-600 hover:text-primary-700 text-sm font-medium break-all"
						>
							{mediaUrl}
						</a>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
	
	<!-- Poll content -->
	{#if post.kind === 'poll' && pollData()}
		<div class="mb-3 space-y-2">
			{#if hasVoted}
				<!-- Show results -->
				{#each getPollResults() as result, index}
					<div class="space-y-1">
						<div class="flex justify-between items-center">
							<span class="text-sm font-medium text-gray-700">{result.option}</span>
							<span class="text-sm text-gray-500">{result.percentage}% ({result.votes})</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-2">
							<div 
								class="h-2 rounded-full transition-all duration-500"
								class:bg-primary-600={index === selectedPollOption}
								class:bg-gray-400={index !== selectedPollOption}
								style="width: {result.percentage}%"
							></div>
						</div>
					</div>
				{/each}
				<p class="text-xs text-gray-500 mt-2">Total votes: {pollVotes().length}</p>
			{:else}
				<!-- Show voting options -->
				<div class="space-y-2">
					{#each pollData()?.options || [] as option, index}
						<button
							onclick={() => submitVote(index)}
							class="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
							disabled={hasVoted}
						>
							<span class="text-sm font-medium text-gray-900">{option}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Actions -->
	<div class="flex items-center gap-4 pt-3 border-t border-gray-100">
		<button
			onclick={toggleLike}
			class="flex items-center gap-2 text-sm transition-colors rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
			class:text-red-600={isLiked}
			class:text-gray-500={!isLiked}
			class:hover:text-red-600={!isLiked}
		>
			<Heart class="w-4 h-4 {isLiked ? 'fill-current' : ''}" aria-hidden="true" />
			{likeCount > 0 ? likeCount : 'Like'}
		</button>
		
		{#if showComments && level < 2}
			<button
				onclick={() => showReplyComposer = !showReplyComposer}
				class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
			>
				<MessageCircle class="w-4 h-4" aria-hidden="true" />
				Reply
			</button>
		{/if}
		
		<button
			class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
		>
			<Share2 class="w-4 h-4" aria-hidden="true" />
			Share
		</button>
		
		{#if canDelete}
			<button
				onclick={() => showDeleteConfirm = true}
				class="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
			>
				<Trash2 class="w-4 h-4" aria-hidden="true" />
				Delete
			</button>
		{/if}
	</div>
	
	<!-- Delete confirmation dialog -->
	{#if showDeleteConfirm}
		<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
			<p class="text-sm text-red-800 mb-3">
				Are you sure you want to delete this post? This action cannot be undone.
			</p>
			<div class="flex gap-2">
				<button
					onclick={deletePost}
					disabled={deleting}
					class="btn btn-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
				>
					{deleting ? 'Deleting...' : 'Delete'}
				</button>
				<button
					onclick={() => showDeleteConfirm = false}
					class="btn btn-sm btn-secondary"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}
	
	<!-- Reply composer -->
	{#if showReplyComposer}
		<div class="mt-4 p-3 bg-gray-50 rounded-lg">
			<textarea
				bind:value={replyContent}
				placeholder="Write a reply..."
				rows="3"
				class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
			></textarea>
			<div class="flex justify-end gap-2 mt-2">
				<button
					onclick={() => showReplyComposer = false}
					class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
				>
					Cancel
				</button>
				<button
					onclick={submitReply}
					disabled={!replyContent.trim() || submittingReply}
					class="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
				>
					{submittingReply ? 'Posting...' : 'Reply'}
				</button>
			</div>
		</div>
	{/if}
</div>