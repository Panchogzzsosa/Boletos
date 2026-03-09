<script lang="ts">
	import { onMount } from 'svelte';

	export let message: string;
	export let type: 'error' | 'success' | 'info' = 'error';
	export let duration: number = 3000;
	export let onClose: () => void = () => {};

	let visible = false;

	onMount(() => {
		// Pequeño delay para activar la animación
		requestAnimationFrame(() => {
			visible = true;
		});
		
		const timer = setTimeout(() => {
			visible = false;
			setTimeout(onClose, 300);
		}, duration);
		
		return () => clearTimeout(timer);
	});
</script>

<div class="toast-wrapper" style="z-index: 99999;">
	<div class="toast {type}" class:visible>
		<span class="icon">
			{#if type === 'error'}
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
					<path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
				</svg>
			{:else if type === 'success'}
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
					<path d="M6 10l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			{:else}
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
					<path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
				</svg>
			{/if}
		</span>
		<span class="message">{message}</span>
	</div>
</div>

<style>
	.toast-wrapper {
		position: fixed;
		top: 1rem;
		right: 1rem;
		pointer-events: none;
	}

	.toast {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-left: 4px solid #ef4444;
		border-radius: 8px;
		padding: 1rem 1.25rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 320px;
		max-width: 450px;
		pointer-events: auto;
		
		/* Animación */
		opacity: 0;
		transform: translateX(100px);
		transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	.toast.visible {
		opacity: 1;
		transform: translateX(0);
	}

	.toast.success {
		border-left-color: #10b981;
	}

	.toast.info {
		border-left-color: #3b82f6;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #ef4444;
	}

	.toast.success .icon {
		color: #10b981;
	}

	.toast.info .icon {
		color: #3b82f6;
	}

	.message {
		font-size: 0.875rem;
		font-weight: 500;
		color: #0f0f0f;
		line-height: 1.4;
	}

	@media (max-width: 500px) {
		.toast-wrapper {
			top: auto;
			bottom: 1rem;
			left: 1rem;
			right: 1rem;
		}

		.toast {
			min-width: auto;
			max-width: none;
			transform: translateY(100px);
		}

		.toast.visible {
			transform: translateY(0);
		}
	}
</style>
