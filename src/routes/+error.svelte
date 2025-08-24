<script lang="ts">
	import { page } from '$app/stores';
	import { AlertTriangle, Home, RefreshCw } from 'lucide-svelte';

	let errorMessage = $derived($page.error?.message || 'An unexpected error occurred');
	let errorCode = $derived($page.status || 500);
</script>

<svelte:head>
	<title>Error {errorCode} - Family</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
	<div class="max-w-md w-full text-center">
		<div class="bg-white rounded-lg shadow-lg p-8">
			<div class="mb-6">
				<AlertTriangle class="w-16 h-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
				<h1 class="text-2xl font-bold text-gray-900 mb-2">
					Oops! Something went wrong
				</h1>
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
					<p class="text-red-800 font-medium text-sm">
						Error {errorCode}
					</p>
					<p class="text-red-700 text-sm mt-1">
						{errorMessage}
					</p>
				</div>
			</div>

			<div class="space-y-3">
				<button
					onclick={() => window.location.reload()}
					class="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
				>
					<RefreshCw class="w-4 h-4" aria-hidden="true" />
					Try Again
				</button>

				<a
					href="/dashboard"
					class="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
				>
					<Home class="w-4 h-4" aria-hidden="true" />
					Go Home
				</a>
			</div>

			<div class="mt-6 pt-6 border-t border-gray-200">
				<p class="text-xs text-gray-500">
					If this problem persists, please contact your family administrator.
				</p>
			</div>
		</div>
	</div>
</div>