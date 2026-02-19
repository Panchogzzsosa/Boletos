<script lang="ts">
	import type { Regalo } from '$lib/types';

	export let regalo: Regalo;
	export let onDelete: () => void;
	export let puedeEditar: boolean = true;

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('es-MX', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<div class="regalo-row">
	<div class="regalo-content">
		<span class="descripcion">{regalo.descripcion}</span>
		<span class="fecha">{formatDate(regalo.fecha)}</span>
	</div>
	{#if puedeEditar}
		<button class="delete-btn" on:click={onDelete} title="Eliminar">
			<svg width="13" height="13" viewBox="0 0 16 16" fill="none">
				<path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" fill="currentColor"/>
			</svg>
		</button>
	{/if}
</div>

<style>
	.regalo-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0.875rem;
		background: #fff;
		border: 1px solid #f4f4f5;
		border-radius: 10px;
		transition: border-color 0.15s;
	}

	.regalo-row:hover {
		border-color: #e5e5e5;
	}

	.regalo-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.descripcion {
		font-size: 0.875rem;
		font-weight: 500;
		color: #0f0f0f;
	}

	.fecha {
		font-size: 0.75rem;
		color: #a1a1aa;
	}

	.delete-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		color: #d4d4d8;
		transition: background 0.15s, color 0.15s;
		flex-shrink: 0;
	}

	.delete-btn:hover {
		background: #fef2f2;
		color: #ef4444;
	}
</style>
