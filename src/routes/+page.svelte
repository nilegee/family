<script lang="ts">
	import { session, user } from '$lib/stores/sessionStore';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Loading from '$lib/../components/ui/Loading.svelte';

	let loading = false;
	let error = '';

	const ALLOWED_EMAILS = [
		'nilezat@gmail.com',
		'abdessamia.mariem@gmail.com',
		'yazidgeemail@gmail.com',
		'yahyageemail@gmail.com'
	];

	async function signInWithGoogle() {
		try {
			loading = true;
			error = '';
			
			const { error: signInError } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${window.location.origin}/dashboard`
				}
			});

			if (signInError) {
				throw signInError;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred during sign-in';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// If user is already signed in, redirect to dashboard or access-denied
		if ($session) {
			const userEmail = $user?.email;
			if (userEmail && ALLOWED_EMAILS.includes(userEmail)) {
				goto('/dashboard');
			} else {
				goto('/access-denied');
			}
		}
	});
</script>

<svelte:head>
	<title>Family - Sign In</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
	<div class="max-w-md w-full">
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-primary-800 mb-2">Family</h1>
			<p class="text-primary-600">Family Engagement Platform</p>
		</div>

		<div class="bg-white rounded-lg shadow-lg p-8">
			<h2 class="text-2xl font-semibold text-gray-900 text-center mb-6">Welcome Back</h2>
			
			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
					{error}
				</div>
			{/if}

			<button
				type="button"
				on:click={signInWithGoogle}
				disabled={loading}
				class="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if loading}
					<Loading size="sm" text="" />
					Signing in...
				{:else}
					<svg class="w-5 h-5" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					Continue with Google
				{/if}
			</button>

			<div class="mt-6 text-center">
				<p class="text-sm text-gray-600">
					Access is restricted to family members only.
				</p>
			</div>
		</div>
	</div>
</div>
