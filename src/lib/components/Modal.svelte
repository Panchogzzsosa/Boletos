<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let show: boolean = false;
	export let title: string = '';
	export let onClose: () => void;

	let modalEl: HTMLDivElement;

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === modalEl) onClose();
	}

	onMount(() => document.addEventListener('keydown', handleKey));
	onDestroy(() => document.removeEventListener('keydown', handleKey));
</script>

{#if show}
	<div
		class="backdrop"
		bind:this={modalEl}
		on:click={handleBackdrop}
		role="dialog"
		aria-modal="true"
	>
		<div class="modal">
			<div class="modal-header">
				<h2 class="modal-title">{title}</h2>
				<button class="close-btn" on:click={onClose} aria-label="Cerrar">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" fill="currentColor"/>
					</svg>
				</button>
			</div>
			<div class="modal-body">
				<slot />
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 200;
		padding: 1rem;
		animation: fade-in 0.15s ease;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 16px;
		width: 100%;
		max-width: 560px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		animation: slide-up 0.15s ease;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08);
	}

	@keyframes slide-up {
		from {
			transform: translateY(12px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.125rem 1.25rem;
		border-bottom: 1px solid #f4f4f5;
		flex-shrink: 0;
	}

	.modal-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #0f0f0f;
		letter-spacing: -0.01em;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		color: #a1a1aa;
		transition: background 0.15s, color 0.15s;
	}

	.close-btn:hover {
		background: #f4f4f5;
		color: #6b6b6b;
	}

	.modal-body {
		padding: 1.25rem;
		overflow-y: auto;
		flex: 1;
	}
</style>
