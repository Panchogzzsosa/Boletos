<script lang="ts">
	import type { Boleto } from '$lib/types';
	import { PRECIO_BOLETO } from '$lib/types';

	export let boleto: Boleto;
	export let onChangeEstado: (estado: Boleto['estado']) => void;
	export let onDelete: () => void;
	export let puedeEditar: boolean = true;
</script>

<div class="boleto-row" class:pagado={boleto.estado === 'pagado'} class:regresado={boleto.estado === 'regresado'} class:perdido={boleto.estado === 'perdido'}>
	<span class="numero">#{String(boleto.numero).padStart(3, '0')}</span>
	<span class="precio">${PRECIO_BOLETO}</span>

	<div class="segmented">
		<button
			class="seg-btn"
			class:active-success={boleto.estado === 'pagado'}
			on:click={() => puedeEditar && onChangeEstado('pagado')}
			disabled={!puedeEditar}
		>Pagado</button>
		<button
			class="seg-btn"
			class:active-danger={boleto.estado === 'no_pagado'}
			on:click={() => puedeEditar && onChangeEstado('no_pagado')}
			disabled={!puedeEditar}
		>No pagado</button>
		<button
			class="seg-btn"
			class:active-neutral={boleto.estado === 'regresado'}
			on:click={() => puedeEditar && onChangeEstado('regresado')}
			disabled={!puedeEditar}
		>Regresado</button>
		<button
			class="seg-btn"
			class:active-warning={boleto.estado === 'perdido'}
			on:click={() => puedeEditar && onChangeEstado('perdido')}
			disabled={!puedeEditar}
		>Perdido</button>
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
	.boleto-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.875rem;
		background: #fff;
		border: 1px solid #f4f4f5;
		border-radius: 10px;
		transition: border-color 0.15s;
	}

	.boleto-row.pagado {
		border-color: #d1fae5;
		background: #f0fdf4;
	}

	.boleto-row.regresado {
		opacity: 0.6;
	}

	.boleto-row.perdido {
		border-color: #fde68a;
		background: #fef3c7;
	}

	.numero {
		font-size: 0.9375rem;
		font-weight: 700;
		color: #0f0f0f;
		font-variant-numeric: tabular-nums;
		min-width: 3.5rem;
		letter-spacing: -0.01em;
	}

	.precio {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #a1a1aa;
		font-variant-numeric: tabular-nums;
		min-width: 2.75rem;
	}

	.segmented {
		flex: 1;
		display: flex;
		background: #f4f4f5;
		border-radius: 8px;
		padding: 2px;
		gap: 2px;
	}

	.seg-btn {
		flex: 1;
		padding: 0.3125rem 0.5rem;
		background: transparent;
		border: none;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 500;
		color: #a1a1aa;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.seg-btn:hover {
		color: #6b6b6b;
		background: rgba(255, 255, 255, 0.6);
	}

	.seg-btn.active-success {
		background: #10b981;
		color: #fff;
	}

	.seg-btn.active-danger {
		background: #ef4444;
		color: #fff;
	}

	.seg-btn.active-neutral {
		background: #6b6b6b;
		color: #fff;
	}

	.seg-btn.active-warning {
		background: #f59e0b;
		color: #fff;
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

	@media (max-width: 480px) {
		.precio {
			display: none;
		}
	}
</style>
