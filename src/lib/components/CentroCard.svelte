<script lang="ts">
	import type { Centro, EstadisticasCentro } from '$lib/types';

	export let centro: Centro;
	export let stats: EstadisticasCentro | undefined = undefined;
	export let onEdit: () => void;
	export let onDelete: () => void;
	export let onSelect: () => void;
	export let onAddComunidad: () => void;
	export let puedeEditar: boolean = true;

	$: pct = stats && stats.totalBoletos > 0
		? Math.round((stats.boletosPagados / stats.totalBoletos) * 100)
		: 0;
</script>

<div class="card">
	<div class="card-header">
		<h3 class="card-name">{centro.nombre}</h3>
		{#if puedeEditar}
			<div class="header-actions">
				<button class="icon-btn" on:click={onEdit} title="Editar">
					<svg width="13" height="13" viewBox="0 0 16 16" fill="none">
						<path d="M11.013 1.427a1.75 1.75 0 012.474 2.474L4.402 12.986l-3.098.687.687-3.098L11.013 1.427z" fill="currentColor"/>
					</svg>
				</button>
				<button class="icon-btn danger" on:click={onDelete} title="Eliminar">
					<svg width="13" height="13" viewBox="0 0 16 16" fill="none">
						<path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.41 15h5.18a1.75 1.75 0 001.746-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225H5.41a.25.25 0 01-.249-.225l-.66-6.6z" fill="currentColor"/>
					</svg>
				</button>
			</div>
		{/if}
	</div>

	{#if stats}
		<div class="stats-row">
			<div class="stat">
				<span class="stat-val success">{stats.boletosPagados}</span>
				<span class="stat-lbl">Pagados</span>
			</div>
			<div class="stat">
				<span class="stat-val danger">{stats.boletosNoPagados}</span>
				<span class="stat-lbl">No pagados</span>
			</div>
			<div class="stat">
				<span class="stat-val muted">{stats.boletosRegresados}</span>
				<span class="stat-lbl">Regresados</span>
			</div>
		</div>

		{#if stats.totalBoletos > 0}
			<div class="progress-wrap">
				<div class="progress-track">
					<div class="progress-fill success" style="width: {(stats.boletosPagados / stats.totalBoletos) * 100}%"></div>
					<div class="progress-fill danger" style="width: {(stats.boletosNoPagados / stats.totalBoletos) * 100}%"></div>
					<div class="progress-fill neutral" style="width: {(stats.boletosRegresados / stats.totalBoletos) * 100}%"></div>
				</div>
				<span class="pct-lbl">{pct}%</span>
			</div>
		{/if}

		<div class="money-row">
			<div class="money-item">
				<span class="money-val">${stats.totalRecaudado.toLocaleString()}</span>
				<span class="money-lbl">Recaudado</span>
			</div>
			<div class="money-sep"></div>
			<div class="money-item">
				<span class="money-val muted">${stats.totalPorCobrar.toLocaleString()}</span>
				<span class="money-lbl">Por cobrar</span>
			</div>
		</div>
	{/if}

	<div class="meta-row">
		<span class="chip">{centro.comunidades.length} comunidad{centro.comunidades.length !== 1 ? 'es' : ''}</span>
		{#if stats}
			<span class="chip">{stats.totalRegalos} regalo{stats.totalRegalos !== 1 ? 's' : ''}</span>
		{/if}
	</div>

	<div class="card-footer">
		<button class="btn-dark" on:click={onSelect}>Ver comunidades</button>
	</div>
</div>

<style>
	.card {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 1.125rem;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		transition: box-shadow 0.2s, border-color 0.2s;
	}

	.card:hover {
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		border-color: #d4d4d8;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.card-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #0f0f0f;
		letter-spacing: -0.01em;
	}

	.header-actions {
		display: flex;
		gap: 0.125rem;
	}

	.icon-btn {
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
	}

	.icon-btn:hover {
		background: #f4f4f5;
		color: #6b6b6b;
	}

	.icon-btn.danger:hover {
		background: #fef2f2;
		color: #ef4444;
	}

	.stats-row {
		display: flex;
		gap: 0;
	}

	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.625rem 0;
	}

	.stat:not(:last-child) {
		border-right: 1px solid #f4f4f5;
	}

	.stat-val {
		font-size: 1.375rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.03em;
		line-height: 1;
	}

	.stat-val.success { color: #10b981; }
	.stat-val.danger { color: #ef4444; }
	.stat-val.muted { color: #d4d4d8; }

	.stat-lbl {
		font-size: 0.6875rem;
		color: #a1a1aa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	.progress-wrap {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.progress-track {
		flex: 1;
		height: 5px;
		background: #f4f4f5;
		border-radius: 100px;
		display: flex;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.4s ease;
	}

	.progress-fill.success { background: #10b981; }
	.progress-fill.danger { background: #ef4444; }
	.progress-fill.neutral { background: #e4e4e7; }

	.pct-lbl {
		font-size: 0.75rem;
		color: #6b6b6b;
		font-variant-numeric: tabular-nums;
		min-width: 2.5rem;
		text-align: right;
	}

	.money-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.625rem 0;
		border-top: 1px solid #f4f4f5;
		border-bottom: 1px solid #f4f4f5;
	}

	.money-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.money-val {
		font-size: 0.9375rem;
		font-weight: 700;
		color: #0f0f0f;
		font-variant-numeric: tabular-nums;
	}

	.money-val.muted {
		color: #a1a1aa;
		font-weight: 600;
	}

	.money-lbl {
		font-size: 0.6875rem;
		color: #a1a1aa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	.money-sep {
		width: 1px;
		height: 2rem;
		background: #f4f4f5;
	}

	.meta-row {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.625rem;
		background: #f4f4f5;
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b6b6b;
	}

	.card-footer {
		display: flex;
		gap: 0.5rem;
	}

	.btn-outline {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: transparent;
		color: #6b6b6b;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.btn-outline:hover {
		background: #f4f4f5;
		color: #0f0f0f;
	}

	.btn-dark {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: #0f0f0f;
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-dark:hover {
		background: #27272a;
	}
</style>
