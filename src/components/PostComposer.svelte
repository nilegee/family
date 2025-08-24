<script lang="ts">
	import { Camera, Video, BarChart3, Link2, Send, X, Plus, Minus } from 'lucide-svelte';
	import { compressMediaFile, type CompressionProgress, validateMediaFile } from '$lib/utils/mediaCompression';
	import { parseYouTubeUrl, isValidYouTubeUrl } from '$lib/utils/youtubeParser';
	import { supabase } from '$lib/supabase';
	import { session } from '$lib/stores/sessionStore';
	import type { Database } from '$lib/supabase';
	
	interface PostComposerProps {
		onPostCreated?: () => void;
		onCancel?: () => void;
		placeholder?: string;
		embedded?: boolean; // New prop to control styling when embedded in another card
	}
	
	let { onPostCreated, onCancel, placeholder = "What's on your mind? Share something meaningful...", embedded = false }: PostComposerProps = $props();
	
	type ComposerMode = 'text' | 'media' | 'poll' | 'youtube';
	
	let mode: ComposerMode = $state('text');
	let content = $state('');
	let isSubmitting = $state(false);
	let error = $state('');
	
	// Media upload state
	let selectedFiles: File[] = $state([]);
	let uploadProgress: CompressionProgress | null = $state(null);
	let mediaUrls: string[] = $state([]);
	
	// Poll state
	let pollQuestion = $state('');
	let pollOptions = $state(['', '']);
	
	// YouTube state
	let youtubeUrl = $state('');
	let youtubeInfo = $state<ReturnType<typeof parseYouTubeUrl>>(null);
	
	function resetForm() {
		mode = 'text';
		content = '';
		error = '';
		selectedFiles = [];
		uploadProgress = null;
		mediaUrls = [];
		pollQuestion = '';
		pollOptions = ['', ''];
		youtubeUrl = '';
		youtubeInfo = null;
	}
	
	function handleModeChange(newMode: ComposerMode) {
		mode = newMode;
		error = '';
	}
	
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files) return;
		
		const files = Array.from(input.files);
		const validFiles: File[] = [];
		
		for (const file of files) {
			const validation = validateMediaFile(file);
			if (validation.valid) {
				validFiles.push(file);
			} else {
				error = validation.error || 'Invalid file';
				return;
			}
		}
		
		selectedFiles = validFiles;
		error = '';
	}
	
	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}
	
	function addPollOption() {
		if (pollOptions.length < 6) {
			pollOptions = [...pollOptions, ''];
		}
	}
	
	function removePollOption(index: number) {
		if (pollOptions.length > 2) {
			pollOptions = pollOptions.filter((_, i) => i !== index);
		}
	}
	
	function handleYouTubeUrlChange() {
		if (!youtubeUrl.trim()) {
			youtubeInfo = null;
			return;
		}
		
		if (isValidYouTubeUrl(youtubeUrl)) {
			youtubeInfo = parseYouTubeUrl(youtubeUrl);
			error = '';
		} else {
			youtubeInfo = null;
			error = 'Please enter a valid YouTube URL';
		}
	}
	
	async function uploadMediaFiles(): Promise<string[]> {
		const urls: string[] = [];
		
		for (let i = 0; i < selectedFiles.length; i++) {
			const file = selectedFiles[i];
			
			try {
				// Compress the file
				uploadProgress = { phase: 'compressing', progress: 0, message: `Compressing file ${i + 1}/${selectedFiles.length}...` };
				
				const compressedFile = await compressMediaFile(file, (progress) => {
					uploadProgress = { ...progress, message: `${progress.message} (${i + 1}/${selectedFiles.length})` };
				});
				
				// Upload to Supabase storage
				uploadProgress = { phase: 'uploading', progress: 80, message: `Uploading file ${i + 1}/${selectedFiles.length}...` };
				
				const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${compressedFile.name}`;
				const { data, error: uploadError } = await supabase.storage
					.from('post-media')
					.upload(fileName, compressedFile);
				
				if (uploadError) throw uploadError;
				
				// Get signed URL
				const { data: signedUrlData } = await supabase.storage
					.from('post-media')
					.createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1 year
				
				if (signedUrlData?.signedUrl) {
					urls.push(signedUrlData.signedUrl);
				}
				
				uploadProgress = { phase: 'uploading', progress: 90 + (i / selectedFiles.length) * 10, message: `File ${i + 1}/${selectedFiles.length} uploaded` };
				
			} catch (err) {
				console.error('Error uploading file:', err);
				throw new Error(`Failed to upload ${file.name}`);
			}
		}
		
		uploadProgress = { phase: 'done', progress: 100, message: 'All files uploaded successfully' };
		return urls;
	}
	
	async function handleSubmit() {
		if (isSubmitting) return;
		
		if (!$session?.user?.email) {
			error = 'You must be logged in to post';
			return;
		}
		
		try {
			isSubmitting = true;
			error = '';
			
			let postData: any = {
				author_email: $session.user.email,
				author_id: $session.user.id,
				visibility: 'all'
			};
			
			if (mode === 'text') {
				if (!content.trim()) {
					error = 'Please enter some content';
					return;
				}
				
				postData = {
					...postData,
					kind: 'post',
					body: content.trim()
				};
				
			} else if (mode === 'media') {
				if (selectedFiles.length === 0) {
					error = 'Please select at least one file';
					return;
				}
				
				const uploadedUrls = await uploadMediaFiles();
				
				postData = {
					...postData,
					kind: 'post',
					body: content.trim() || null,
					media_urls: uploadedUrls
				};
				
			} else if (mode === 'poll') {
				if (!pollQuestion.trim()) {
					error = 'Please enter a poll question';
					return;
				}
				
				const validOptions = pollOptions.filter(opt => opt.trim()).map(opt => opt.trim());
				if (validOptions.length < 2) {
					error = 'Poll must have at least 2 options';
					return;
				}
				
				postData = {
					...postData,
					kind: 'poll',
					body: pollQuestion.trim(),
					data: {
						type: 'options',
						options: validOptions
					}
				};
				
			} else if (mode === 'youtube') {
				if (!youtubeInfo) {
					error = 'Please enter a valid YouTube URL';
					return;
				}
				
				postData = {
					...postData,
					kind: 'post',
					body: content.trim() || `Shared a video: ${youtubeUrl}`,
					media_urls: [youtubeInfo.embedUrl]
				};
			}
			
			const { error: submitError } = await supabase.from('items').insert(postData as any);
			
			if (submitError) throw submitError;
			
			resetForm();
			onPostCreated?.();
			
		} catch (err) {
			console.error('Error creating post:', err);
			error = err instanceof Error ? err.message : 'Failed to create post. Please try again.';
		} finally {
			isSubmitting = false;
			uploadProgress = null;
		}
	}
	
	function handleCancel() {
		resetForm();
		onCancel?.();
	}
	
	$effect(() => {
		if (mode === 'youtube') {
			handleYouTubeUrlChange();
		}
	});
</script>

<div class="space-y-4" class:card={!embedded}>
	{#if !embedded}
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-900">Share with your family</h3>
			<button
				onclick={handleCancel}
				class="text-gray-400 hover:text-gray-600 transition-colors"
				aria-label="Cancel"
			>
				<X class="w-5 h-5" />
			</button>
		</div>
	{/if}
	
	<!-- Mode selector -->
	<div class="flex gap-2 border-b border-gray-200 pb-3">
		<button
			onclick={() => handleModeChange('text')}
			aria-label="Text post mode"
			class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
			class:bg-primary-100={mode === 'text'}
			class:text-primary-700={mode === 'text'}
			class:text-gray-600={mode !== 'text'}
			class:hover:bg-gray-100={mode !== 'text'}
		>
			Text
		</button>
		
		<button
			onclick={() => handleModeChange('media')}
			aria-label="Photo or video post mode"
			class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
			class:bg-primary-100={mode === 'media'}
			class:text-primary-700={mode === 'media'}
			class:text-gray-600={mode !== 'media'}
			class:hover:bg-gray-100={mode !== 'media'}
		>
			<Camera class="w-4 h-4" aria-hidden="true" />
			Photo/Video
		</button>
		
		<button
			onclick={() => handleModeChange('poll')}
			aria-label="Poll post mode"
			class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
			class:bg-primary-100={mode === 'poll'}
			class:text-primary-700={mode === 'poll'}
			class:text-gray-600={mode !== 'poll'}
			class:hover:bg-gray-100={mode !== 'poll'}
		>
			<BarChart3 class="w-4 h-4" aria-hidden="true" />
			Poll
		</button>
		
		<button
			onclick={() => handleModeChange('youtube')}
			aria-label="YouTube video post mode"
			class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
			class:bg-primary-100={mode === 'youtube'}
			class:text-primary-700={mode === 'youtube'}
			class:text-gray-600={mode !== 'youtube'}
			class:hover:bg-gray-100={mode !== 'youtube'}
		>
			<Link2 class="w-4 h-4" aria-hidden="true" />
			YouTube
		</button>
	</div>
	
	<!-- Content based on mode -->
	{#if mode === 'text'}
		<label for="text-content" class="sr-only">Post content</label>
		<textarea
			id="text-content"
			bind:value={content}
			{placeholder}
			rows="4"
			aria-label="Post content"
			class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
		></textarea>
		
	{:else if mode === 'media'}
		<div class="space-y-3">
			<label for="media-caption" class="sr-only">Media caption</label>
			<textarea
				id="media-caption"
				bind:value={content}
				placeholder="Add a caption (optional)..."
				rows="3"
				aria-label="Media caption"
				class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
			></textarea>
			
			<div class="space-y-2">
				<label for="media-files" class="block text-sm font-medium text-gray-700">
					Select photos or videos
				</label>
				<input
					id="media-files"
					type="file"
					multiple
					accept="image/*,video/*"
					onchange={handleFileSelect}
					class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
				/>
			</div>
			
			{#if selectedFiles.length > 0}
				<div class="space-y-2">
					<p class="text-sm font-medium text-gray-700">Selected files:</p>
					<div class="space-y-1">
						{#each selectedFiles as file, index}
							<div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
								<span class="text-sm text-gray-700">{file.name}</span>
								<button
									onclick={() => removeFile(index)}
									class="text-red-500 hover:text-red-700"
									aria-label="Remove file"
								>
									<X class="w-4 h-4" />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
		
	{:else if mode === 'poll'}
		<div class="space-y-3">
			<div>
				<label for="poll-question" class="block text-sm font-medium text-gray-700 mb-1">
					Poll Question
				</label>
				<input
					id="poll-question"
					type="text"
					bind:value={pollQuestion}
					placeholder="Ask a question..."
					class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
				/>
			</div>
			
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span class="block text-sm font-medium text-gray-700">Poll Options</span>
					<button
						onclick={addPollOption}
						disabled={pollOptions.length >= 6}
						aria-label="Add poll option"
						class="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:hover:text-gray-400 min-h-[44px] px-2 py-2"
					>
						<Plus class="w-4 h-4" />
						Add Option
					</button>
				</div>
				
				{#each pollOptions as option, index}
					<div class="flex items-center gap-2">
						<label for="poll-option-{index}" class="sr-only">Poll option {index + 1}</label>
						<input
							id="poll-option-{index}"
							type="text"
							bind:value={pollOptions[index]}
							placeholder={`Option ${index + 1}`}
							aria-label="Poll option {index + 1}"
							class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						/>
						{#if pollOptions.length > 2}
							<button
								onclick={() => removePollOption(index)}
								class="text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
								aria-label="Remove poll option {index + 1}"
							>
								<Minus class="w-4 h-4" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
		
	{:else if mode === 'youtube'}
		<div class="space-y-3">
			<div>
				<label for="youtube-url" class="block text-sm font-medium text-gray-700 mb-1">
					YouTube URL
				</label>
				<input
					id="youtube-url"
					type="url"
					bind:value={youtubeUrl}
					placeholder="https://www.youtube.com/watch?v=..."
					class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
				/>
			</div>
			
			{#if youtubeInfo}
				<div class="bg-gray-50 rounded-lg p-3">
					<p class="text-sm font-medium text-gray-700 mb-2">Video Preview:</p>
					<div class="aspect-video bg-gray-200 rounded-lg overflow-hidden">
						<img
							src={youtubeInfo.thumbnailUrl}
							alt="YouTube video thumbnail"
							class="w-full h-full object-cover"
						/>
					</div>
				</div>
			{/if}
			
			<label for="youtube-description" class="sr-only">YouTube video description</label>
			<textarea
				id="youtube-description"
				bind:value={content}
				placeholder="Add a description (optional)..."
				rows="3"
				aria-label="YouTube video description"
				class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
			></textarea>
		</div>
	{/if}
	
	<!-- Upload Progress -->
	{#if uploadProgress}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium text-blue-800">{uploadProgress.message}</span>
				<span class="text-sm text-blue-600">{Math.round(uploadProgress.progress)}%</span>
			</div>
			<div class="w-full bg-blue-200 rounded-full h-2">
				<div 
					class="bg-blue-600 h-2 rounded-full transition-all duration-300"
					style="width: {uploadProgress.progress}%"
				></div>
			</div>
		</div>
	{/if}
	
	<!-- Error Message -->
	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-3">
			<p class="text-sm text-red-700">{error}</p>
		</div>
	{/if}
	
	<!-- Submit Button -->
	<div class="flex justify-end">
		<button
			onclick={handleSubmit}
			disabled={isSubmitting}
			class="btn btn-primary disabled:opacity-50 flex items-center gap-2"
		>
			{#if isSubmitting}
				<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
				{uploadProgress ? uploadProgress.message : 'Posting...'}
			{:else}
				<Send class="w-4 h-4" />
				Post
			{/if}
		</button>
	</div>
</div>