<script lang="ts">
	import { onMount } from 'svelte';
	import { session, user } from '$lib/stores/sessionStore';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import type { Database } from '$lib/supabase';
	import Loading from '$lib/../components/ui/Loading.svelte';
	import imageCompression from 'browser-image-compression';
	import { getUserRole, getRoleDisplayName, getSeededDisplayName, type AllowedEmail } from '$lib/utils/roles';
	import { profileStore } from '$lib/stores/profileStore';
	import { notificationStore } from '$lib/stores/notificationStore';

	let profile: Database['public']['Tables']['profiles']['Row'] | null = $state(null);
	let loading = $state(true);
	let saving = $state(false);
	let uploading = $state(false);

	// Form fields
	let displayName = $state('');
	let avatarUrl = $state('');
	let role = $state('member');
	let dob = $state('');

	// Computed read-only role based on email
	let computedRole = $derived(() => {
		if ($user?.email) {
			return getUserRole($user.email as AllowedEmail);
		}
		return 'member';
	});

	// Computed role display name for UI
	let roleDisplayName = $derived(() => {
		if ($user?.email) {
			return getRoleDisplayName($user.email);
		}
		return 'Member';
	});

	// Check if DOB is already set (read-only once set)
	let isDobSet = $derived(() => {
		return Boolean(profile?.dob && profile.dob.trim() !== '');
	});

	// File upload
	let fileInput = $state() as HTMLInputElement;

	onMount(async () => {
		if (!$session) {
			goto('/');
			return;
		}

		await loadProfile();
		loading = false;
	});

	async function loadProfile() {
		if (!$user?.email) return;

		const { data } = await supabase
			.from('profiles')
			.select('*')
			.eq('email', $user.email)
			.single();

		if (data) {
			profile = data as Database['public']['Tables']['profiles']['Row'];
			displayName = (data as any).display_name || getSeededDisplayName($user.email) || '';
			avatarUrl = (data as any).avatar_url || '';
			role = computedRole(); // Use computed role instead of stored role
			dob = (data as any).dob || '';
		} else {
			// No profile exists, use seeded display name
			displayName = getSeededDisplayName($user.email) || '';
		}
	}

	async function saveProfile() {
		if (!$user?.email) return;

		try {
			saving = true;
			const profileData = {
				user_id: $user.id,
				email: $user.email,
				display_name: displayName || getSeededDisplayName($user.email) || null,
				avatar_url: avatarUrl || null,
				role: computedRole(), // Always use computed role
				dob: dob || null,
				updated_at: new Date().toISOString()
			};

			if (profile) {
				const { error } = await supabase
					.from('profiles')
					.update(profileData as Database['public']['Tables']['profiles']['Update'])
					.eq('user_id', $user.id);
				
				if (error) throw error;
			} else {
				const { error } = await supabase
					.from('profiles')
					.insert({
						...profileData,
						created_at: new Date().toISOString()
					} as Database['public']['Tables']['profiles']['Insert']);
				
				if (error) throw error;
			}

			await loadProfile();
		} catch (error) {
			console.error('Error saving profile:', error);
		} finally {
			saving = false;
		}
	}

	async function signOut() {
		await supabase.auth.signOut();
		goto('/');
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;
		
		// Validate file type
		if (!file.type.startsWith('image/')) {
			notificationStore.add({
				type: 'error',
				title: 'Invalid File',
				message: 'Please select an image file'
			});
			return;
		}
		
		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			notificationStore.add({
				type: 'error',
				title: 'File Too Large',
				message: 'Image size must be less than 5MB'
			});
			return;
		}
		
		try {
			uploading = true;
			
			// Compress image
			const options = {
				maxSizeMB: 1,
				maxWidthOrHeight: 800,
				useWebWorker: true,
			};
			
			const compressedFile = await imageCompression(file, options);
			
			// Generate consistent filename for avatar (overwrite existing)
			const path = `avatars/${$user?.id}-avatar.png`;
			
			// Upload to Supabase Storage with upsert to overwrite existing
			const { data, error: uploadError } = await supabase.storage
				.from('post-media')
				.upload(path, compressedFile, { upsert: true });
			
			if (uploadError) throw uploadError;
			
			// Update the profiles table with the new avatar path (must include .select())
			const { data: updateData, error: updateError } = await supabase
				.from('profiles')
				.update({ avatar_url: data.path })
				.eq('user_id', $user!.id)
				.select();
			
			if (updateError) throw updateError;
			
			// Get a fresh signed URL for immediate display
			const { data: signedUrlData, error: urlError } = await supabase.storage
				.from('post-media')
				.createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1 year
			
			if (urlError) throw urlError;
			
			if (signedUrlData?.signedUrl) {
				// Update local state immediately for UI refresh
				avatarUrl = signedUrlData.signedUrl;
				
				// Update the profile store to reflect the change across the app
				await profileStore.updateProfile($user!.id, { 
					avatar_url: data.path 
				});
				
				// Auto-save the complete profile
				await saveProfile();
				
				// Show success notification
				notificationStore.add({
					type: 'success',
					title: 'Profile Updated',
					message: 'Profile picture updated successfully!'
				});
			}
			
		} catch (error: any) {
			console.error('Error uploading image:', error);
			if (error?.message?.includes('413')) {
				notificationStore.add({
					type: 'error',
					title: 'Upload Failed',
					message: 'Upload failed. Please try a smaller image.'
				});
			} else if (error?.message?.includes('storage')) {
				notificationStore.add({
					type: 'error',
					title: 'Upload Failed',
					message: 'Upload failed. Please check your connection and try again.'
				});
			} else {
				notificationStore.add({
					type: 'error',
					title: 'Upload Failed',
					message: 'Upload failed. Please try again.'
				});
			}
		} finally {
			uploading = false;
		}
	}
</script>

<svelte:head>
	<title>Profile - Family</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-20">
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<h1 class="text-xl font-semibold text-gray-900">Profile</h1>
				<div class="flex items-center gap-4">
					{#if getUserRole($user?.email) === 'parent'}
						<button
							type="button"
							onclick={() => goto('/settings')}
							class="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
							aria-label="Settings"
						>
							⚙️ Settings
						</button>
					{/if}
					<button
						type="button"
						onclick={signOut}
						class="text-red-600 hover:text-red-700 font-medium"
					>
						Sign Out
					</button>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{#if loading}
			<Loading text="Loading profile..." />
		{:else}
			<div class="card">
				<h2 class="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>

				<form onsubmit={async (e) => { e.preventDefault(); await saveProfile(); }} class="space-y-6">
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
							Email Address
						</label>
						<input
							type="email"
							id="email"
							value={$user?.email || ''}
							disabled
							class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
						/>
						<p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
					</div>

					<div>
						<label for="displayName" class="block text-sm font-medium text-gray-700 mb-2">
							Display Name
						</label>
						<input
							type="text"
							id="displayName"
							bind:value={displayName}
							placeholder="Enter your display name"
							class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
					</div>

					<div>
						<label for="avatar-upload" class="block text-sm font-medium text-gray-700 mb-2">
							Profile Picture
						</label>
						
						<!-- Current avatar preview -->
						{#if avatarUrl}
							<div class="mb-4">
								<img 
									src={avatarUrl} 
									alt={displayName ? `${displayName}'s profile picture` : 'Profile picture'}
									loading="lazy"
									class="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
									onerror={() => avatarUrl = ''}
								/>
							</div>
						{/if}
						
						<!-- File upload -->
						<div class="space-y-3">
							<input
								type="file"
								bind:this={fileInput}
								onchange={handleFileSelect}
								accept="image/*"
								class="hidden"
								id="avatar-upload"
							/>
							
							<button
								type="button"
								onclick={() => fileInput.click()}
								disabled={uploading}
								aria-label="Upload profile picture"
								class="btn btn-secondary disabled:opacity-50 flex items-center gap-2"
							>
								{#if uploading}
									<div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
									Uploading...
								{:else}
									📷 Upload Photo
								{/if}
							</button>
							
							<!-- URL input as fallback -->
							<details class="text-sm">
								<summary class="cursor-pointer text-gray-600 hover:text-gray-800">
									Or enter image URL manually
								</summary>
								<div class="mt-2">
									<label for="avatar-url" class="sr-only">Avatar image URL</label>
									<input
										id="avatar-url"
										type="url"
										bind:value={avatarUrl}
										placeholder="https://example.com/avatar.jpg"
										aria-label="Avatar image URL"
										class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
									/>
								</div>
							</details>
						</div>
						
						<p class="text-xs text-gray-500 mt-2">
							Supported formats: JPG, PNG, GIF. Max size: 5MB.
						</p>
					</div>

					<div>
						<label for="role" class="block text-sm font-medium text-gray-700 mb-2">
							Role
						</label>
						<div class="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
							{roleDisplayName()}
						</div>
						<p class="text-xs text-gray-500 mt-1">Role is determined by your email and cannot be changed</p>
					</div>

					<div>
						<label for="dob" class="block text-sm font-medium text-gray-700 mb-2">
							Date of Birth
						</label>
						<input
							type="date"
							id="dob"
							bind:value={dob}
							disabled={isDobSet()}
							class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
							class:bg-gray-50={isDobSet()}
							class:text-gray-500={isDobSet()}
						/>
						{#if isDobSet()}
							<p class="text-xs text-gray-500 mt-1">Date of birth is locked to prevent accidental changes</p>
						{/if}
					</div>

					<div class="pt-4">
						<button
							type="submit"
							disabled={saving}
							class="w-full btn btn-primary disabled:opacity-50"
						>
							{saving ? 'Saving...' : 'Save Profile'}
						</button>
					</div>
				</form>
			</div>
		{/if}
	</main>
</div>