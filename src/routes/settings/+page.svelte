<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { getUserRole } from '$lib/utils/roles';
	import dayjs from 'dayjs';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import { notificationStore } from '$lib/stores/notificationStore';

	let loading = $state(true);
	let storageUsage = $state('Loading...');
	let cleaningUp = $state(false);

	// Check if user is a parent (only parents can access settings)
	let isParent = $derived(() => {
		const role = getUserRole($user?.email);
		return role === 'parent';
	});

	onMount(async () => {
		if (!$session) {
			goto('/');
			return;
		}

		// Redirect non-parents to dashboard
		if (!isParent()) {
			goto('/dashboard');
			return;
		}

		await fetchStorageUsage();
		loading = false;
	});

	async function fetchStorageUsage() {
		try {
			const { data: files, error } = await supabase.storage
				.from('post-media')
				.list('items', { limit: 1000 });

			if (error) {
				console.error('Failed to load storage usage:', error.message);
				notificationStore.add({
					type: 'error',
					title: 'Storage Error',
					message: 'Failed to load storage usage: ' + error.message
				});
				storageUsage = 'Error loading storage usage';
				return;
			}

			if (!files) {
				storageUsage = '0.00 GB used of 10 GB';
				return;
			}

			// Supabase Storage list() returns metadata.size (in bytes)
			const totalBytes = files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);
			const totalGB = (totalBytes / (1024 ** 3)).toFixed(2);

			storageUsage = `${totalGB} GB used of 10 GB`;

			// Show warning if storage is nearing limit
			if (parseFloat(totalGB) > 8) {
				// You could add a toast warning here
				console.warn('Storage nearing limit!');
			}
		} catch (error) {
			console.error('Error fetching storage usage:', error);
			storageUsage = 'Error loading storage usage';
		}
	}

	async function clearOldMedia(days = 30) {
		if (!isParent()) {
			notificationStore.add({
				type: 'error',
				title: 'Access Denied',
				message: 'Only parents can clear media.'
			});
			return;
		}

		const cutoff = dayjs().subtract(days, 'day');

		try {
			cleaningUp = true;

			const { data: files, error: listError } = await supabase.storage
				.from('post-media')
				.list('items', { limit: 1000 });

			if (listError) {
				notificationStore.add({
					type: 'error',
					title: 'Storage Error',
					message: 'Failed to list files: ' + listError.message
				});
				return;
			}

			if (!files) {
				notificationStore.add({
					type: 'info',
					title: 'No Files',
					message: 'No files found.'
				});
				return;
			}

			const oldFiles = files
				.filter(f => f.created_at && dayjs(f.created_at).isBefore(cutoff))
				.map(f => `items/${f.name}`);

			if (oldFiles.length === 0) {
				notificationStore.add({
					type: 'info',
					title: 'No Files to Delete',
					message: 'No old files to delete.'
				});
				return;
			}

			if (!confirm(`Delete ${oldFiles.length} files older than ${days} days? This action cannot be undone.`)) {
				return;
			}

			const { error: deleteError } = await supabase.storage
				.from('post-media')
				.remove(oldFiles);

			if (deleteError) {
				notificationStore.add({
					type: 'error',
					title: 'Delete Failed',
					message: 'Failed to delete files: ' + deleteError.message
				});
			} else {
				notificationStore.add({
					type: 'success',
					title: 'Cleanup Complete',
					message: `Successfully deleted ${oldFiles.length} old files.`
				});
				// Refresh storage usage after cleanup
				await fetchStorageUsage();
			}
		} catch (error) {
			console.error('Error clearing old media:', error);
			notificationStore.add({
				type: 'error',
				title: 'Cleanup Failed',
				message: 'An error occurred while clearing old media.'
			});
		} finally {
			cleaningUp = false;
		}
	}

	// Calculate storage usage percentage for progress bar
	let storagePercent = $derived(() => {
		const match = storageUsage.match(/^([\d.]+) GB/);
		if (match) {
			const used = parseFloat(match[1]);
			return Math.min((used / 10) * 100, 100);
		}
		return 0;
	});
</script>

<svelte:head>
	<title>Settings - Family</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<h1 class="text-xl font-semibold text-gray-900">Settings</h1>
				<button
					type="button"
					onclick={() => goto('/dashboard')}
					class="text-blue-600 hover:text-blue-700 font-medium"
				>
					← Back to Dashboard
				</button>
			</div>
		</div>
	</header>

	<main class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if loading}
			<Loading text="Loading settings..." />
		{:else if !isParent()}
			<div class="card text-center">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Access Denied</h2>
				<p class="text-gray-600 mb-4">Only parents can access settings.</p>
				<button
					type="button"
					onclick={() => goto('/dashboard')}
					class="btn btn-primary"
				>
					Go to Dashboard
				</button>
			</div>
		{:else}
			<div class="space-y-6">
				<!-- Storage Usage Section -->
				<div class="card">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h2>
					
					<div class="mb-4 p-3 border rounded bg-gray-50 text-sm">
						<div class="flex justify-between items-center mb-2">
							<strong>Current Usage:</strong>
							<span>{storageUsage}</span>
						</div>
						
						<!-- Progress bar -->
						<div class="w-full bg-gray-200 rounded-full h-3">
							<div 
								class="h-3 rounded-full transition-all duration-300"
								class:bg-green-500={storagePercent() < 70}
								class:bg-yellow-500={storagePercent() >= 70 && storagePercent() < 90}
								class:bg-red-500={storagePercent() >= 90}
								style="width: {storagePercent()}%"
							></div>
						</div>
						
						<div class="text-xs text-gray-500 mt-1">
							{storagePercent().toFixed(1)}% of storage used
						</div>
					</div>

					{#if storagePercent() > 80}
						<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<div class="flex items-center">
								<div class="text-yellow-600 mr-2">⚠️</div>
								<div class="text-sm text-yellow-800">
									Storage is nearing limit. Consider cleaning up old media files.
								</div>
							</div>
						</div>
					{/if}

					<button
						type="button"
						onclick={fetchStorageUsage}
						class="btn btn-secondary w-full sm:w-auto"
					>
						🔄 Refresh Usage
					</button>
				</div>

				<!-- Media Cleanup Section -->
				<div class="card">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Media Cleanup</h2>
					
					<p class="text-gray-600 mb-4">
						Clean up old uploaded media files to free storage space. This will permanently delete photos and videos older than the specified number of days.
					</p>

					<div class="space-y-3">
						<button
							type="button"
							onclick={() => clearOldMedia(30)}
							disabled={cleaningUp}
							class="btn btn-secondary flex items-center gap-2 w-full sm:w-auto"
						>
							{#if cleaningUp}
								<div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
								Cleaning up...
							{:else}
								🗑️ Clear media older than 30 days
							{/if}
						</button>

						<button
							type="button"
							onclick={() => clearOldMedia(60)}
							disabled={cleaningUp}
							class="btn btn-secondary flex items-center gap-2 w-full sm:w-auto"
						>
							{#if cleaningUp}
								<div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
								Cleaning up...
							{:else}
								🗑️ Clear media older than 60 days
							{/if}
						</button>
					</div>

					<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
						<div class="flex items-start">
							<div class="text-red-600 mr-2 mt-0.5">⚠️</div>
							<div class="text-sm text-red-800">
								<strong>Warning:</strong> This action permanently deletes files and cannot be undone. 
								Please make sure you have backups of any important photos or videos.
							</div>
						</div>
					</div>
				</div>

				<!-- Parent-only note -->
				<div class="card">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Settings Access</h2>
					<p class="text-gray-600">
						These settings are only available to parents to help manage family storage and media.
						Children cannot access this page to prevent accidental data loss.
					</p>
				</div>
			</div>
		{/if}
	</main>
</div>