<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	async function signOut() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<title>Access Denied - Family</title>
</svelte:head>

<div class="min-h-screen bg-red-50 flex items-center justify-center p-4">
	<div class="max-w-md w-full text-center">
		<div class="bg-white rounded-lg shadow-lg p-8">
			<div class="text-red-500 text-6xl mb-4">🚫</div>
			<h1 class="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
			<p class="text-gray-600 mb-6">
				Sorry, your account doesn't have access to this family platform. 
				This app is restricted to family members only.
			</p>
			<p class="text-sm text-gray-500 mb-8">
				If you believe this is an error, please contact a family administrator.
			</p>
			<button
				type="button"
				on:click={signOut}
				class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
			>
				Sign Out
			</button>
		</div>
	</div>
</div>