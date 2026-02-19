<script lang="ts">
	import { centros, estadisticasCentros, estadisticasComunidades } from '$lib/stores';
	import { PRECIO_BOLETO } from '$lib/types';

	$: totalCentros = $centros.length;
	$: totalComunidades = $centros.reduce((acc, c) => acc + c.comunidades.length, 0);
	$: totalBoletos = $estadisticasCentros.reduce((acc, s) => acc + s.totalBoletos, 0);
	$: totalPagado = $estadisticasCentros.reduce((acc, s) => acc + s.boletosPagados, 0);
	$: totalNoPagado = $estadisticasCentros.reduce((acc, s) => acc + s.boletosNoPagados, 0);
	$: totalRegresado = $estadisticasCentros.reduce((acc, s) => acc + s.boletosRegresados, 0);
	$: totalPerdido = $estadisticasCentros.reduce((acc, s) => acc + s.boletosPerdidos, 0);
	$: totalRecaudado = $estadisticasCentros.reduce((acc, s) => acc + s.totalRecaudado, 0);
	$: totalPorCobrar = $estadisticasCentros.reduce((acc, s) => acc + s.totalPorCobrar, 0);
	$: totalRegalos = $estadisticasCentros.reduce((acc, s) => acc + s.totalRegalos, 0);

	$: pctPagado = totalBoletos > 0 ? (totalPagado / totalBoletos) * 100 : 0;
	$: pctNoPagado = totalBoletos > 0 ? (totalNoPagado / totalBoletos) * 100 : 0;
	$: pctRegresado = totalBoletos > 0 ? (totalRegresado / totalBoletos) * 100 : 0;
	$: pctPerdido = totalBoletos > 0 ? (totalPerdido / totalBoletos) * 100 : 0;

	$: topComunidades = [...$estadisticasComunidades]
		.filter(c => c.boletosNoPagados > 0)
		.sort((a, b) => b.boletosNoPagados - a.boletosNoPagados);

	$: topCentros = [...$estadisticasCentros]
		.filter(c => c.boletosNoPagados > 0)
		.sort((a, b) => b.boletosNoPagados - a.boletosNoPagados);

	function mxn(n: number) {
		return '$' + n.toLocaleString('es-MX');
	}
</script>

<svelte:head>
	<title>Inicio · Boletos</title>
</svelte:head>

<div class="dashboard">
	<header class="page-header">
		<div>
			<h1>Resumen general</h1>
			<p class="subtitle">
				{totalCentros} centro{totalCentros !== 1 ? 's' : ''} ·
				{totalComunidades} comunidad{totalComunidades !== 1 ? 'es' : ''} ·
				{totalBoletos} boleto{totalBoletos !== 1 ? 's' : ''}
			</p>
		</div>
		<a href="/centros" class="btn-primary">Administrar centros</a>
	</header>

	<!-- Métricas principales -->
	<div class="metrics">
		<div class="metric-card highlight">
			<span class="metric-label">Total recaudado</span>
			<span class="metric-value">{mxn(totalRecaudado)}</span>
			<span class="metric-sub">{totalPagado} boleto{totalPagado !== 1 ? 's' : ''} pagado{totalPagado !== 1 ? 's' : ''}</span>
		</div>
		<div class="metric-card">
			<span class="metric-label">Por cobrar</span>
			<span class="metric-value">{mxn(totalPorCobrar)}</span>
			<span class="metric-sub">{totalNoPagado} boleto{totalNoPagado !== 1 ? 's' : ''} pendiente{totalNoPagado !== 1 ? 's' : ''}</span>
		</div>
		<div class="metric-card">
			<span class="metric-label">Regalos</span>
			<span class="metric-value num">{totalRegalos}</span>
			<span class="metric-sub">registrados en total</span>
		</div>
		<div class="metric-card">
			<span class="metric-label">Regresados</span>
			<span class="metric-value num">{totalRegresado}</span>
			<span class="metric-sub">boleto{totalRegresado !== 1 ? 's' : ''} sin cargo</span>
		</div>
	</div>

	<!-- Barra de progreso de boletos -->
	{#if totalBoletos > 0}
		<div class="card progress-section">
			<div class="progress-header">
				<span class="section-label">Estado de boletos</span>
				<span class="progress-stat">{Math.round(pctPagado)}% pagados · {totalBoletos} total</span>
			</div>
			<div class="progress-track">
				<div class="progress-fill success" style="width: {pctPagado}%"></div>
				<div class="progress-fill danger" style="width: {pctNoPagado}%"></div>
				<div class="progress-fill neutral" style="width: {pctRegresado}%"></div>
			</div>
			<div class="progress-legend">
				<div class="legend-item">
					<span class="legend-dot success"></span>
					<span>Pagados <strong>{totalPagado}</strong></span>
				</div>
				<div class="legend-item">
					<span class="legend-dot danger"></span>
					<span>No pagados <strong>{totalNoPagado}</strong></span>
				</div>
				<div class="legend-item">
					<span class="legend-dot neutral"></span>
					<span>Regresados <strong>{totalRegresado}</strong></span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Rankings -->
	<div class="rankings">
		<div class="card">
			<h2 class="card-title">Centros · boletos pendientes</h2>
			{#if topCentros.length > 0}
				<div class="ranking-list">
					{#each topCentros as centro, i}
						<div class="ranking-row">
							<span class="rank-pos">{i + 1}</span>
							<span class="rank-name">{centro.nombreCentro}</span>
							<span class="rank-value">{centro.boletosNoPagados} boleto{centro.boletosNoPagados !== 1 ? 's' : ''}</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin datos disponibles</p>
			{/if}
		</div>

		<div class="card">
			<h2 class="card-title">Comunidades · boletos pendientes</h2>
			{#if topComunidades.length > 0}
				<div class="ranking-list">
					{#each topComunidades as com, i}
						<div class="ranking-row">
							<span class="rank-pos">{i + 1}</span>
							<div class="rank-info">
								<span class="rank-name">{com.nombreComunidad}</span>
								<span class="rank-sub">{com.nombreCentro}</span>
							</div>
							<span class="rank-value">{com.boletosNoPagados} boleto{com.boletosNoPagados !== 1 ? 's' : ''}</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin datos disponibles</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #0f0f0f;
		margin-bottom: 0.25rem;
	}

	.subtitle {
		font-size: 0.875rem;
		color: #6b6b6b;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		background: #0f0f0f;
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		border-radius: 8px;
		transition: background 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.btn-primary:hover {
		background: #27272a;
	}

	/* Metrics */
	.metrics {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.75rem;
	}

	.metric-card {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.metric-card.highlight {
		background: #0f0f0f;
		border-color: #0f0f0f;
	}

	.metric-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #a1a1aa;
	}

	.metric-card.highlight .metric-label {
		color: rgba(255, 255, 255, 0.5);
	}

	.metric-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #0f0f0f;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.03em;
		line-height: 1.15;
		margin: 0.2rem 0 0.1rem;
	}

	.metric-card.highlight .metric-value {
		color: #fff;
	}

	.metric-value.num {
		font-size: 2.25rem;
	}

	.metric-sub {
		font-size: 0.75rem;
		color: #a1a1aa;
	}

	.metric-card.highlight .metric-sub {
		color: rgba(255, 255, 255, 0.4);
	}

	/* Card base */
	.card {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 1.25rem;
	}

	/* Progress */
	.progress-section {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #0f0f0f;
	}

	.progress-stat {
		font-size: 0.8125rem;
		color: #6b6b6b;
		font-variant-numeric: tabular-nums;
	}

	.progress-track {
		height: 8px;
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
	.progress-fill.neutral { background: #d4d4d8; }
	.progress-fill.warning { background: #f59e0b; }

	.progress-legend {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: #6b6b6b;
	}

	.legend-item strong {
		color: #0f0f0f;
		font-weight: 600;
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.legend-dot.success { background: #10b981; }
	.legend-dot.danger { background: #ef4444; }
	.legend-dot.neutral { background: #d4d4d8; }
	.legend-dot.warning { background: #f59e0b; }

	/* Rankings */
	.rankings {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.card-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #a1a1aa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 1rem;
	}

	.ranking-list {
		display: flex;
		flex-direction: column;
	}

	.ranking-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0;
		border-bottom: 1px solid #f4f4f5;
	}

	.ranking-row:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.ranking-row:first-child {
		padding-top: 0;
	}

	.rank-pos {
		font-size: 0.75rem;
		font-weight: 600;
		color: #d4d4d8;
		min-width: 1.25rem;
		font-variant-numeric: tabular-nums;
	}

	.rank-name {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 500;
		color: #0f0f0f;
	}

	.rank-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.rank-sub {
		font-size: 0.75rem;
		color: #a1a1aa;
	}

	.rank-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: #10b981;
		font-variant-numeric: tabular-nums;
	}

	.empty-text {
		color: #a1a1aa;
		font-size: 0.875rem;
		text-align: center;
		padding: 2rem 0;
	}

	@media (max-width: 1100px) {
		.metrics {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 900px) {
		.metrics {
			grid-template-columns: repeat(2, 1fr);
		}
		.rankings {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 600px) {
		.page-header {
			flex-direction: column;
		}
		.metrics {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (max-width: 400px) {
		.metrics {
			grid-template-columns: 1fr;
		}
	}
</style>
