<script lang="ts">
	import { onMount } from 'svelte';
	import { centros, estadisticasCentros, transacciones, resumenCaja } from '$lib/stores';
	import { PRECIO_BOLETO } from '$lib/types';
	import type { TipoTransaccion, ConceptoTransaccion } from '$lib/types';
	import { auth } from '$lib/auth';
	import Modal from '$lib/components/Modal.svelte';

	let modalActivo: 'nueva-entrada' | 'nueva-salida' | null = null;
	let tipoTransaccion: TipoTransaccion = 'entrada';
	
	// Formulario
	let concepto: ConceptoTransaccion = 'otro';
	let monto: string = '';
	let descripcion: string = '';
	let fecha: string = new Date().toISOString().split('T')[0];
	
	// Filtros
	let filtroTipo: 'todos' | 'entrada' | 'salida' = 'todos';
	let filtroFechaDesde: string = '';
	let filtroFechaHasta: string = '';

	$: puedeEditar = $auth.usuario?.role === 'admin' || $auth.usuario?.role === 'editor';

	// Cargar transacciones al montar
	onMount(() => {
		transacciones.cargarTransacciones();
	});

	// Totales de boletos
	$: totalRecaudado = $estadisticasCentros.reduce((acc, s) => acc + s.totalRecaudado, 0);
	$: totalPorCobrar = $estadisticasCentros.reduce((acc, s) => acc + s.totalPorCobrar, 0);
	$: totalBoletosPagados = $estadisticasCentros.reduce((acc, s) => acc + s.boletosPagados, 0);

	// Transacciones filtradas
	$: transaccionesFiltradas = $transacciones.filter(t => {
		if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false;
		if (filtroFechaDesde && t.fecha < filtroFechaDesde) return false;
		if (filtroFechaHasta && t.fecha > filtroFechaHasta) return false;
		return true;
	});

	// Entradas de boletos como transacciones virtuales
	$: entradasBoletos = totalBoletosPagados > 0 ? [{
		id: 'boletos-auto',
		tipo: 'entrada' as const,
		concepto: 'boletos' as const,
		monto: totalRecaudado,
		descripcion: `Venta de ${totalBoletosPagados} boleto${totalBoletosPagados !== 1 ? 's' : ''}`,
		fecha: new Date().toISOString().split('T')[0],
		createdAt: new Date().toISOString(),
		isVirtual: true
	}] : [];

	// Combinar entradas de boletos con transacciones manuales
	$: todasLasTransacciones = [...entradasBoletos, ...transaccionesFiltradas];

	function mxn(n: number) {
		return '$' + n.toLocaleString('es-MX');
	}

	function abrirModal(tipo: 'entrada' | 'salida') {
		tipoTransaccion = tipo;
		concepto = tipo === 'entrada' ? 'otro' : 'gasto';
		monto = '';
		descripcion = '';
		fecha = new Date().toISOString().split('T')[0];
		modalActivo = tipo === 'entrada' ? 'nueva-entrada' : 'nueva-salida';
	}

	function cerrarModal() {
		modalActivo = null;
	}

	async function guardarTransaccion() {
		const montoNum = parseFloat(monto);
		if (isNaN(montoNum) || montoNum <= 0) return;
		if (!descripcion.trim()) return;

		await transacciones.agregarTransaccion(
			tipoTransaccion,
			concepto,
			montoNum,
			descripcion.trim(),
			fecha
		);

		cerrarModal();
	}

	async function eliminarTransaccion(id: string) {
		if (!confirm('¿Eliminar esta transacción?')) return;
		await transacciones.eliminarTransaccion(id);
	}

	function getConceptoLabel(concepto: ConceptoTransaccion): string {
		const labels: Record<ConceptoTransaccion, string> = {
			boletos: 'Boletos',
			venta: 'Venta',
			donacion: 'Donación',
			otro: 'Otro',
			gasto: 'Gasto',
			compra: 'Compra',
			pago: 'Pago'
		};
		return labels[concepto] || concepto;
	}

	function formatearFecha(fechaStr: string): string {
		const fecha = new Date(fechaStr + 'T00:00:00');
		return fecha.toLocaleDateString('es-MX', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	function resetFiltros() {
		filtroTipo = 'todos';
		filtroFechaDesde = '';
		filtroFechaHasta = '';
	}
</script>

<svelte:head>
	<title>Finanzas · Control de Caja</title>
</svelte:head>

<div class="finanzas">
	<header class="page-header">
		<div>
			<h1>Control de caja</h1>
			<p class="subtitle">Registro de entradas y salidas</p>
		</div>
		{#if puedeEditar}
			<div class="header-actions">
				<button class="btn-success" on:click={() => abrirModal('entrada')}>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" fill="currentColor"/>
					</svg>
					Entrada
				</button>
				<button class="btn-danger" on:click={() => abrirModal('salida')}>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path d="M2.75 8a.75.75 0 01.75-.75h9.5a.75.75 0 010 1.5h-9.5A.75.75 0 012.75 8z" fill="currentColor"/>
					</svg>
					Salida
				</button>
			</div>
		{/if}
	</header>

	<!-- Resumen de caja -->
	<div class="resumen-grid">
		<div class="resumen-card balance">
			<span class="label">Balance actual</span>
			<span class="valor">{mxn($resumenCaja.balance)}</span>
		</div>
		<div class="resumen-card entradas">
			<span class="label">Total entradas</span>
			<span class="valor">{mxn($resumenCaja.totalEntradas)}</span>
			<span class="sub">Boletos: {mxn($resumenCaja.entradasBoletos)}</span>
		</div>
		<div class="resumen-card salidas">
			<span class="label">Total salidas</span>
			<span class="valor">{mxn($resumenCaja.totalSalidas)}</span>
		</div>
	</div>

	<!-- Sección de boletos -->
	<div class="card boletos-section">
		<div class="boletos-header">
			<div>
				<h2 class="section-title">Entradas por boletos</h2>
				<p class="section-subtitle">Se registran automáticamente al marcar boletos como pagados</p>
			</div>
			<div class="precio-badge">
				<span class="label">Precio boleto</span>
				<span class="valor">{mxn(PRECIO_BOLETO)}</span>
			</div>
		</div>
		<div class="boletos-stats">
			<div class="boletos-stat">
				<span class="stat-label">Boletos pagados</span>
				<span class="stat-value">{totalBoletosPagados}</span>
			</div>
			<div class="boletos-stat">
				<span class="stat-label">Recaudado</span>
				<span class="stat-value success">{mxn(totalRecaudado)}</span>
			</div>
			<div class="boletos-stat">
				<span class="stat-label">Por cobrar</span>
				<span class="stat-value warning">{mxn(totalPorCobrar)}</span>
			</div>
		</div>
	</div>

	<!-- Historial de transacciones -->
	<div class="card transacciones-section">
		<div class="transacciones-header">
			<h2 class="section-title">Historial de movimientos</h2>
			<div class="filtros">
				<select bind:value={filtroTipo} class="filtro-select">
					<option value="todos">Todos los tipos</option>
					<option value="entrada">Entradas</option>
					<option value="salida">Salidas</option>
				</select>
				<input 
					type="date" 
					bind:value={filtroFechaDesde} 
					class="filtro-date"
					placeholder="Desde"
				/>
				<input 
					type="date" 
					bind:value={filtroFechaHasta} 
					class="filtro-date"
					placeholder="Hasta"
				/>
				{#if filtroTipo !== 'todos' || filtroFechaDesde || filtroFechaHasta}
					<button class="btn-text" on:click={resetFiltros}>Limpiar</button>
				{/if}
			</div>
		</div>

		{#if todasLasTransacciones.length > 0}
			<div class="transacciones-list">
				<div class="transacciones-header-row">
					<span>Fecha</span>
					<span>Concepto</span>
					<span>Descripción</span>
					<span class="text-right">Monto</span>
					{#if puedeEditar}
						<span></span>
					{/if}
				</div>
				{#each todasLasTransacciones as t}
					<div class="transaccion-row" class:virtual={t.isVirtual}>
						<span class="fecha">{formatearFecha(t.fecha)}</span>
						<span class="concepto">
							<span class="badge" class:entrada={t.tipo === 'entrada'} class:salida={t.tipo === 'salida'}>
								{getConceptoLabel(t.concepto)}
							</span>
						</span>
						<span class="descripcion" title={t.descripcion}>
							{t.isVirtual ? '🔒 ' : ''}{t.descripcion}
						</span>
						<span class="monto text-right" class:entrada={t.tipo === 'entrada'} class:salida={t.tipo === 'salida'}>
							{t.tipo === 'entrada' ? '+' : '-'}{mxn(t.monto)}
						</span>
						{#if puedeEditar}
							<span class="acciones">
								{#if !t.isVirtual}
									<button 
										class="btn-icon danger" 
										on:click={() => eliminarTransaccion(t.id)}
										title="Eliminar"
									>
										<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
											<path d="M3 6h10M5.5 6V4a1.5 1.5 0 011.5-1.5h2A1.5 1.5 0 0110.5 4v2m-7 0v7.5a1.5 1.5 0 001.5 1.5h7a1.5 1.5 0 001.5-1.5V6h-10z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									</button>
								{/if}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<p>No hay transacciones registradas</p>
			</div>
		{/if}
	</div>
</div>

<!-- Modal Nueva Entrada -->
<Modal show={modalActivo === 'nueva-entrada'} title="Registrar Entrada" onClose={cerrarModal}>
	<div class="form-modal">
		<div class="form-group">
			<label for="concepto-entrada">Concepto</label>
			<select id="concepto-entrada" bind:value={concepto} class="form-select">
				<option value="venta">Venta</option>
				<option value="donacion">Donación</option>
				<option value="otro">Otro</option>
			</select>
		</div>
		<div class="form-group">
			<label for="monto-entrada">Monto</label>
			<div class="input-prefix">
				<span class="prefix">$</span>
				<input 
					id="monto-entrada" 
					type="number" 
					bind:value={monto} 
					placeholder="0.00"
					min="0"
					step="0.01"
					class="form-input"
				/>
			</div>
		</div>
		<div class="form-group">
			<label for="descripcion-entrada">Descripción</label>
			<input 
				id="descripcion-entrada" 
				type="text" 
				bind:value={descripcion} 
				placeholder="Descripción de la entrada"
				class="form-input"
			/>
		</div>
		<div class="form-group">
			<label for="fecha-entrada">Fecha</label>
			<input 
				id="fecha-entrada" 
				type="date" 
				bind:value={fecha} 
				class="form-input"
			/>
		</div>
		<div class="form-actions">
			<button class="btn-secondary" on:click={cerrarModal}>Cancelar</button>
			<button 
				class="btn-primary" 
				on:click={guardarTransaccion}
				disabled={!monto || parseFloat(monto) <= 0 || !descripcion.trim()}
			>
				Guardar Entrada
			</button>
		</div>
	</div>
</Modal>

<!-- Modal Nueva Salida -->
<Modal show={modalActivo === 'nueva-salida'} title="Registrar Salida" onClose={cerrarModal}>
	<div class="form-modal">
		<div class="form-group">
			<label for="concepto-salida">Concepto</label>
			<select id="concepto-salida" bind:value={concepto} class="form-select">
				<option value="gasto">Gasto</option>
				<option value="compra">Compra</option>
				<option value="pago">Pago</option>
				<option value="otro">Otro</option>
			</select>
		</div>
		<div class="form-group">
			<label for="monto-salida">Monto</label>
			<div class="input-prefix">
				<span class="prefix">$</span>
				<input 
					id="monto-salida" 
					type="number" 
					bind:value={monto} 
					placeholder="0.00"
					min="0"
					step="0.01"
					class="form-input"
				/>
			</div>
		</div>
		<div class="form-group">
			<label for="descripcion-salida">Descripción</label>
			<input 
				id="descripcion-salida" 
				type="text" 
				bind:value={descripcion} 
				placeholder="Descripción de la salida"
				class="form-input"
			/>
		</div>
		<div class="form-group">
			<label for="fecha-salida">Fecha</label>
			<input 
				id="fecha-salida" 
				type="date" 
				bind:value={fecha} 
				class="form-input"
			/>
		</div>
		<div class="form-actions">
			<button class="btn-secondary" on:click={cerrarModal}>Cancelar</button>
			<button 
				class="btn-primary danger" 
				on:click={guardarTransaccion}
				disabled={!monto || parseFloat(monto) <= 0 || !descripcion.trim()}
			>
				Guardar Salida
			</button>
		</div>
	</div>
</Modal>

<style>
	.finanzas {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
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

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	/* Buttons */
	.btn-success,
	.btn-danger,
	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-success {
		background: #10b981;
		color: #fff;
	}

	.btn-success:hover {
		background: #059669;
	}

	.btn-danger {
		background: #ef4444;
		color: #fff;
	}

	.btn-danger:hover {
		background: #dc2626;
	}

	.btn-primary {
		background: #0f0f0f;
		color: #fff;
	}

	.btn-primary:hover:not(:disabled) {
		background: #27272a;
	}

	.btn-primary.danger {
		background: #ef4444;
	}

	.btn-primary.danger:hover:not(:disabled) {
		background: #dc2626;
	}

	.btn-secondary {
		background: #f4f4f5;
		color: #0f0f0f;
	}

	.btn-secondary:hover {
		background: #e4e4e7;
	}

	.btn-primary:disabled,
	.btn-success:disabled,
	.btn-danger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-text {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #6b6b6b;
		background: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	.btn-text:hover {
		color: #0f0f0f;
		background: #f4f4f5;
	}

	.btn-icon {
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
		transition: all 0.15s ease;
	}

	.btn-icon:hover {
		background: #f4f4f5;
		color: #0f0f0f;
	}

	.btn-icon.danger:hover {
		background: #fef2f2;
		color: #ef4444;
	}

	/* Resumen Grid */
	.resumen-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.resumen-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1.25rem;
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
	}

	.resumen-card.balance {
		background: #0f0f0f;
		border-color: #0f0f0f;
	}

	.resumen-card.balance .label,
	.resumen-card.balance .valor {
		color: #fff;
	}

	.resumen-card.entradas {
		border-left: 4px solid #10b981;
	}

	.resumen-card.salidas {
		border-left: 4px solid #ef4444;
	}

	.resumen-card .label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #a1a1aa;
	}

	.resumen-card .valor {
		font-size: 1.75rem;
		font-weight: 700;
		color: #0f0f0f;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
	}

	.resumen-card .sub {
		font-size: 0.75rem;
		color: #a1a1aa;
	}

	/* Card base */
	.card {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 1.25rem;
	}

	/* Boletos Section */
	.boletos-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		color: #0f0f0f;
		margin-bottom: 0.25rem;
	}

	.section-subtitle {
		font-size: 0.8125rem;
		color: #6b6b6b;
	}

	.precio-badge {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.125rem;
		padding: 0.5rem 0.75rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.precio-badge .label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #a1a1aa;
	}

	.precio-badge .valor {
		font-size: 1rem;
		font-weight: 700;
		color: #0f0f0f;
		font-variant-numeric: tabular-nums;
	}

	.boletos-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.boletos-stat {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #6b6b6b;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: #0f0f0f;
		font-variant-numeric: tabular-nums;
	}

	.stat-value.success {
		color: #10b981;
	}

	.stat-value.warning {
		color: #f59e0b;
	}

	/* Transacciones Section */
	.transacciones-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.filtros {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.filtro-select,
	.filtro-date {
		padding: 0.375rem 0.625rem;
		font-size: 0.8125rem;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		background: #fff;
		color: #0f0f0f;
	}

	.filtro-select:focus,
	.filtro-date:focus {
		outline: none;
		border-color: #0f0f0f;
	}

	.transacciones-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.transacciones-header-row,
	.transaccion-row {
		display: grid;
		grid-template-columns: 100px 100px 1fr 120px 40px;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
	}

	.transacciones-header-row {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #a1a1aa;
		border-bottom: 1px solid #f4f4f5;
	}

	.transaccion-row {
		font-size: 0.875rem;
		border-radius: 8px;
		transition: background 0.15s ease;
	}

	.transaccion-row:hover {
		background: #f9fafb;
	}

	.transaccion-row.virtual {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
	}

	.transaccion-row.virtual:hover {
		background: #dcfce7;
	}

	.fecha {
		color: #6b6b6b;
		font-size: 0.8125rem;
	}

	.concepto .badge {
		display: inline-flex;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 100px;
		background: #f4f4f5;
		color: #6b6b6b;
	}

	.concepto .badge.entrada {
		background: #d1fae5;
		color: #059669;
	}

	.concepto .badge.salida {
		background: #fee2e2;
		color: #dc2626;
	}

	.descripcion {
		color: #0f0f0f;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.monto {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.monto.entrada {
		color: #10b981;
	}

	.monto.salida {
		color: #ef4444;
	}

	.text-right {
		text-align: right;
	}

	.acciones {
		display: flex;
		justify-content: flex-end;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		color: #a1a1aa;
		font-size: 0.875rem;
	}

	/* Form Modal */
	.form-modal {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-group label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #0f0f0f;
	}

	.form-input,
	.form-select {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		background: #fff;
		color: #0f0f0f;
		width: 100%;
	}

	.form-input:focus,
	.form-select:focus {
		outline: none;
		border-color: #0f0f0f;
	}

	.input-prefix {
		display: flex;
		align-items: center;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		background: #fff;
		overflow: hidden;
	}

	.input-prefix:focus-within {
		border-color: #0f0f0f;
	}

	.input-prefix .prefix {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b6b6b;
		background: #f9fafb;
		border-right: 1px solid #e5e5e5;
	}

	.input-prefix .form-input {
		border: none;
		border-radius: 0;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid #f4f4f5;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.resumen-grid {
			grid-template-columns: 1fr;
		}

		.boletos-stats {
			grid-template-columns: 1fr;
		}

		.transacciones-header-row,
		.transaccion-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.transacciones-header-row {
			display: none;
		}

		.transaccion-row {
			padding: 1rem;
		}

		.transaccion-row .fecha::before {
			content: 'Fecha: ';
			font-weight: 500;
			color: #6b6b6b;
		}

		.transaccion-row .concepto::before {
			content: 'Concepto: ';
			font-weight: 500;
			color: #6b6b6b;
		}

		.transaccion-row .descripcion::before {
			content: 'Descripción: ';
			font-weight: 500;
			color: #6b6b6b;
		}

		.transaccion-row .monto {
			text-align: left;
			font-size: 1.125rem;
		}

		.transaccion-row .monto::before {
			content: 'Monto: ';
			font-weight: 500;
			color: #6b6b6b;
		}

		.transacciones-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.filtros {
			width: 100%;
		}

		.filtro-select,
		.filtro-date {
			flex: 1;
			min-width: 120px;
		}
	}
</style>
