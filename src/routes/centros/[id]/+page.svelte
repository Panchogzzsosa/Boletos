<script lang="ts">
	import { page } from '$app/stores';
	import { centros, estadisticasCentros, estadisticasComunidades } from '$lib/stores';
	import { puedeEditar } from '$lib/auth';
	import { goto } from '$app/navigation';
	import Modal from '$lib/components/Modal.svelte';
	import BoletoItem from '$lib/components/BoletoItem.svelte';
	import RegaloItem from '$lib/components/RegaloItem.svelte';

	$: centroId = $page.params.id as string;
	$: centro = $centros.find(c => c.id === centroId);
	$: stats = $estadisticasCentros.find(s => s.centroId === centroId);

	// Modal para agregar comunidad
	let modalNuevaCom = { show: false, nombre: '' };

	function abrirNuevaCom() {
		modalNuevaCom = { show: true, nombre: '' };
	}
	function cerrarNuevaCom() {
		modalNuevaCom.show = false;
	}
	function guardarNuevaCom() {
		if (modalNuevaCom.nombre.trim()) {
			centros.agregarComunidad(centroId, modalNuevaCom.nombre.trim());
			cerrarNuevaCom();
		}
	}

	// Modal de gestión de boletos/regalos de una comunidad
	let comunidadSel = {
		show: false,
		comunidadId: '',
		nombre: '',
		tab: 'boletos' as 'boletos' | 'regalos'
	};

	let boletoInput = { rangoInicio: '', rangoFin: '', single: '' };
	let regaloDescripcion = '';

	function abrirComunidad(comunidadId: string, nombre: string, tab: 'boletos' | 'regalos' = 'boletos') {
		comunidadSel = { show: true, comunidadId, nombre, tab };
		boletoInput = { rangoInicio: '', rangoFin: '', single: '' };
		regaloDescripcion = '';
	}
	function cerrarComunidad() {
		comunidadSel.show = false;
	}

	function agregarRango() {
		const inicio = parseInt(boletoInput.rangoInicio);
		const fin = parseInt(boletoInput.rangoFin);
		if (inicio && fin && inicio <= fin) {
			const nums: number[] = [];
			for (let i = inicio; i <= fin; i++) nums.push(i);
			centros.agregarBoletos(centroId, comunidadSel.comunidadId, nums);
			boletoInput.rangoInicio = '';
			boletoInput.rangoFin = '';
		}
	}

	function agregarIndividual() {
		const num = parseInt(boletoInput.single);
		if (num) {
			centros.agregarBoletos(centroId, comunidadSel.comunidadId, [num]);
			boletoInput.single = '';
		}
	}

	function cambiarEstado(boletoId: string, estado: 'pagado' | 'no_pagado' | 'regresado' | 'perdido') {
		centros.cambiarEstadoBoleto(centroId, comunidadSel.comunidadId, boletoId, estado);
	}

	function eliminarBoleto(boletoId: string) {
		if (confirm('¿Eliminar este boleto?'))
			centros.eliminarBoleto(centroId, comunidadSel.comunidadId, boletoId);
	}

	function agregarRegalo() {
		if (regaloDescripcion.trim()) {
			centros.agregarRegalo(centroId, comunidadSel.comunidadId, regaloDescripcion.trim());
			regaloDescripcion = '';
		}
	}

	function eliminarRegalo(regaloId: string) {
		if (confirm('¿Eliminar este regalo?'))
			centros.eliminarRegalo(centroId, comunidadSel.comunidadId, regaloId);
	}

	function eliminarComunidad(comunidadId: string) {
		if (confirm('¿Eliminar esta comunidad? Se perderán todos sus boletos y regalos.'))
			centros.eliminarComunidad(centroId, comunidadId);
	}

	function editarComunidad(comunidadId: string, nombre: string) {
		const nuevo = prompt('Nuevo nombre:', nombre);
		if (nuevo?.trim())
			centros.editarComunidad(centroId, comunidadId, nuevo.trim());
	}

	$: comunidadActual = centro?.comunidades.find(c => c.id === comunidadSel.comunidadId);
	$: boletos = [...(comunidadActual?.boletos ?? [])].sort((a, b) => a.numero - b.numero);
	$: regalos = [...(comunidadActual?.regalos ?? [])].sort(
		(a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
	);
</script>

<svelte:head>
	<title>{centro?.nombre ?? 'Centro'} · Boletos</title>
</svelte:head>

{#if centro}
	<div class="page">

		<!-- Encabezado -->
		<header class="page-header">
			<button class="back-btn" on:click={() => goto('/centros')}>
				<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
					<path d="M9.78 12.78a.75.75 0 01-1.06 0L4.47 8.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L6.06 8l3.72 3.72a.75.75 0 010 1.06z" fill="currentColor"/>
				</svg>
				Centros
			</button>
			<h1>{centro.nombre}</h1>
		</header>

		<!-- Resumen del centro -->
		{#if stats}
			<div class="centro-stats">
				<div class="stat-block">
					<span class="stat-num">{stats.totalBoletos}</span>
					<span class="stat-lbl">Total boletos</span>
				</div>
				<div class="stat-block success">
					<span class="stat-num">{stats.boletosPagados}</span>
					<span class="stat-lbl">Pagados</span>
				</div>
				<div class="stat-block danger">
					<span class="stat-num">{stats.boletosNoPagados}</span>
					<span class="stat-lbl">No pagados</span>
				</div>
				<div class="stat-block neutral">
					<span class="stat-num">{stats.boletosRegresados}</span>
					<span class="stat-lbl">Regresados</span>
				</div>
				<div class="stat-block warning">
					<span class="stat-num">{stats.boletosPerdidos}</span>
					<span class="stat-lbl">Perdidos</span>
				</div>
				<div class="stat-block money">
					<span class="stat-num">${stats.totalRecaudado.toLocaleString()}</span>
					<span class="stat-lbl">Recaudado</span>
				</div>
				<div class="stat-block">
					<span class="stat-num muted">${stats.totalPorCobrar.toLocaleString()}</span>
					<span class="stat-lbl">Por cobrar</span>
				</div>
			</div>
		{/if}

		<!-- Barra de progreso global del centro -->
		{#if stats && stats.totalBoletos > 0}
			<div class="progress-card">
				<div class="progress-header">
					<span class="progress-label">Progreso general</span>
					<span class="progress-pct">{Math.round((stats.boletosPagados / stats.totalBoletos) * 100)}% pagado</span>
				</div>
				<div class="progress-track">
					<div class="progress-fill success" style="width: {(stats.boletosPagados / stats.totalBoletos) * 100}%"></div>
					<div class="progress-fill danger" style="width: {(stats.boletosNoPagados / stats.totalBoletos) * 100}%"></div>
					<div class="progress-fill neutral" style="width: {(stats.boletosRegresados / stats.totalBoletos) * 100}%"></div>
					<div class="progress-fill warning" style="width: {(stats.boletosPerdidos / stats.totalBoletos) * 100}%"></div>
				</div>
			</div>
		{/if}

		<!-- Comunidades -->
		<div class="section-header">
			<div>
				<h2>Comunidades</h2>
				<p class="section-sub">{centro.comunidades.length} comunidad{centro.comunidades.length !== 1 ? 'es' : ''} en este centro</p>
			</div>
			{#if $puedeEditar}
				<button class="btn-add-com" on:click={abrirNuevaCom}>
					+ Agregar comunidad
				</button>
			{/if}
		</div>

		{#if centro.comunidades.length > 0}
			<div class="com-grid">
				{#each centro.comunidades as com}
					{@const pagados = com.boletos.filter(b => b.estado === 'pagado').length}
					{@const noPagados = com.boletos.filter(b => b.estado === 'no_pagado').length}
					{@const regresados = com.boletos.filter(b => b.estado === 'regresado').length}
					{@const perdidos = com.boletos.filter(b => b.estado === 'perdido').length}
					{@const pct = com.boletos.length > 0 ? Math.round((pagados / com.boletos.length) * 100) : 0}

					<div class="com-card">
						<!-- Header tarjeta -->
						<div class="com-card-header">
							<h3 class="com-name">{com.nombre}</h3>
							{#if $puedeEditar}
							<div class="com-actions">
								<button class="icon-btn" on:click={() => editarComunidad(com.id, com.nombre)} title="Editar">
									<svg width="13" height="13" viewBox="0 0 16 16" fill="none">
										<path d="M11.013 1.427a1.75 1.75 0 012.474 2.474L4.402 12.986l-3.098.687.687-3.098L11.013 1.427z" fill="currentColor"/>
									</svg>
								</button>
								<button class="icon-btn danger" on:click={() => eliminarComunidad(com.id)} title="Eliminar">
									<svg width="13" height="13" viewBox="0 0 16 16" fill="none">
										<path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" fill="currentColor"/>
									</svg>
								</button>
							</div>
							{/if}
						</div>

						<!-- Stats de la comunidad -->
						<div class="com-stats">
							<div class="com-stat">
								<span class="com-stat-val success">{pagados}</span>
								<span class="com-stat-lbl">Pagados</span>
							</div>
							<div class="com-stat">
								<span class="com-stat-val danger">{noPagados}</span>
								<span class="com-stat-lbl">No pagados</span>
							</div>
							<div class="com-stat">
								<span class="com-stat-val muted">{regresados}</span>
								<span class="com-stat-lbl">Regresados</span>
							</div>
							<div class="com-stat">
								<span class="com-stat-val warning">{perdidos}</span>
								<span class="com-stat-lbl">Perdidos</span>
							</div>
						</div>

						<!-- Barra de progreso -->
						{#if com.boletos.length > 0}
							<div class="com-progress-row">
								<div class="com-progress-track">
									<div class="com-progress-fill success" style="width: {(pagados / com.boletos.length) * 100}%"></div>
									<div class="com-progress-fill danger" style="width: {(noPagados / com.boletos.length) * 100}%"></div>
									<div class="com-progress-fill neutral" style="width: {(regresados / com.boletos.length) * 100}%"></div>
									<div class="com-progress-fill warning" style="width: {(perdidos / com.boletos.length) * 100}%"></div>
								</div>
								<span class="com-pct">{pct}%</span>
							</div>
						{/if}

						<!-- Dinero y regalos -->
						<div class="com-money-row">
							<div class="com-money">
								<span class="com-money-val">${(pagados * 560).toLocaleString()}</span>
								<span class="com-money-lbl">Recaudado</span>
							</div>
							<div class="com-sep"></div>
							<div class="com-money">
								<span class="com-money-val muted">{com.regalos.length}</span>
								<span class="com-money-lbl">Regalo{com.regalos.length !== 1 ? 's' : ''}</span>
							</div>
						</div>

						<!-- Botones -->
						<div class="com-footer">
							<button class="btn-outline" on:click={() => abrirComunidad(com.id, com.nombre, 'regalos')}>
								Ver regalos
							</button>
							<button class="btn-dark" on:click={() => abrirComunidad(com.id, com.nombre, 'boletos')}>
								Ver boletos
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<p class="empty-title">Sin comunidades</p>
				<p class="empty-hint">Agrega la primera comunidad con el botón de arriba</p>
				<button class="btn-dark" on:click={abrirNuevaCom}>+ Agregar comunidad</button>
			</div>
		{/if}
	</div>

	<!-- Modal: nueva comunidad -->
	<Modal show={modalNuevaCom.show} title="Nueva comunidad" onClose={cerrarNuevaCom}>
		<div class="modal-form">
			<label class="field">
				<span class="field-label">Nombre de la comunidad</span>
				<input
					type="text"
					class="field-input"
					placeholder="Ej. Norte, Sur, Centro..."
					bind:value={modalNuevaCom.nombre}
					on:keypress={(e) => e.key === 'Enter' && guardarNuevaCom()}
				/>
			</label>
			<div class="modal-actions">
				<button class="btn-ghost" on:click={cerrarNuevaCom}>Cancelar</button>
				<button class="btn-dark" on:click={guardarNuevaCom}>Agregar</button>
			</div>
		</div>
	</Modal>

	<!-- Modal: gestión boletos/regalos -->
	<Modal show={comunidadSel.show} title={comunidadSel.nombre} onClose={cerrarComunidad}>
		<div class="com-modal">
			<div class="tabs">
				<button class="tab" class:active={comunidadSel.tab === 'boletos'} on:click={() => comunidadSel.tab = 'boletos'}>
					Boletos {#if boletos.length > 0}<span class="tab-count">{boletos.length}</span>{/if}
				</button>
				<button class="tab" class:active={comunidadSel.tab === 'regalos'} on:click={() => comunidadSel.tab = 'regalos'}>
					Regalos {#if regalos.length > 0}<span class="tab-count">{regalos.length}</span>{/if}
				</button>
			</div>

			{#if comunidadSel.tab === 'boletos'}
				<div class="tab-content">
					{#if $puedeEditar}
					<div class="add-panel">
						<p class="add-label">Agregar por rango</p>
						<div class="inline-row">
							<input type="number" class="num-input" placeholder="Desde" bind:value={boletoInput.rangoInicio} />
							<span class="sep">—</span>
							<input type="number" class="num-input" placeholder="Hasta" bind:value={boletoInput.rangoFin} />
							<button class="btn-dark sm" on:click={agregarRango}>Agregar</button>
						</div>
						<p class="add-label" style="margin-top:0.75rem">Número individual</p>
						<div class="inline-row">
							<input
								type="number"
								class="num-input flex"
								placeholder="Número..."
								bind:value={boletoInput.single}
								on:keypress={(e) => e.key === 'Enter' && agregarIndividual()}
							/>
							<button class="btn-dark sm" on:click={agregarIndividual}>+</button>
						</div>
					</div>
					{/if}
					{#if boletos.length > 0}
						<div class="items-list">
							{#each boletos as boleto (boleto.id)}
								<BoletoItem
									{boleto}
									onChangeEstado={(estado) => cambiarEstado(boleto.id, estado)}
									onDelete={() => eliminarBoleto(boleto.id)}
									puedeEditar={$puedeEditar}
								/>
							{/each}
						</div>
					{:else}
						<p class="empty-text">Sin boletos registrados</p>
					{/if}
				</div>
			{/if}

			{#if comunidadSel.tab === 'regalos'}
				<div class="tab-content">
					{#if $puedeEditar}
					<div class="add-panel">
						<p class="add-label">Agregar regalo</p>
						<div class="inline-row">
							<input
								type="text"
								class="num-input flex"
								placeholder="Descripción del regalo..."
								bind:value={regaloDescripcion}
								on:keypress={(e) => e.key === 'Enter' && agregarRegalo()}
							/>
							<button class="btn-dark sm" on:click={agregarRegalo}>Agregar</button>
						</div>
					</div>
					{/if}
					{#if regalos.length > 0}
						<div class="items-list">
							{#each regalos as regalo (regalo.id)}
								<RegaloItem {regalo} onDelete={() => eliminarRegalo(regalo.id)} puedeEditar={$puedeEditar} />
							{/each}
						</div>
					{:else}
						<p class="empty-text">Sin regalos registrados</p>
					{/if}
				</div>
			{/if}
		</div>
	</Modal>

{:else}
	<div class="not-found">
		<p>Centro no encontrado</p>
		<button class="btn-dark" on:click={() => goto('/centros')}>Ir a Centros</button>
	</div>
{/if}

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* Header */
	.page-header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: transparent;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #6b6b6b;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		flex-shrink: 0;
	}
	.back-btn:hover { background: #f4f4f5; color: #0f0f0f; }

	h1 {
		font-size: 1.375rem;
		font-weight: 700;
		color: #0f0f0f;
	}

	/* Stats del centro */
	.centro-stats {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		display: flex;
		overflow: hidden;
	}

	.stat-block {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem 0.75rem;
		gap: 0.25rem;
	}

	.stat-block:not(:last-child) { border-right: 1px solid #f4f4f5; }

	.stat-num {
		font-size: 1.25rem;
		font-weight: 700;
		color: #0f0f0f;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.02em;
	}

	.stat-num.muted { color: #a1a1aa; }
	.stat-block.success .stat-num { color: #10b981; }
	.stat-block.danger .stat-num { color: #ef4444; }
	.stat-block.neutral .stat-num { color: #a1a1aa; }
	.stat-block.warning .stat-num { color: #f59e0b; }

	.stat-lbl {
		font-size: 0.6875rem;
		color: #a1a1aa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	/* Barra de progreso del centro */
	.progress-card {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.progress-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #0f0f0f;
	}

	.progress-pct {
		font-size: 0.8125rem;
		color: #6b6b6b;
		font-variant-numeric: tabular-nums;
	}

	.progress-track {
		height: 7px;
		background: #f4f4f5;
		border-radius: 100px;
		display: flex;
		overflow: hidden;
	}

	.progress-fill { height: 100%; transition: width 0.4s ease; }
	.progress-fill.success { background: #10b981; }
	.progress-fill.danger { background: #ef4444; }
	.progress-fill.neutral { background: #e4e4e7; }
	.progress-fill.warning { background: #f59e0b; }

	/* Sección comunidades */
	.section-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
	}

	h2 {
		font-size: 1rem;
		font-weight: 700;
		color: #0f0f0f;
		margin-bottom: 0.125rem;
	}

	.section-sub {
		font-size: 0.8125rem;
		color: #a1a1aa;
	}

	.btn-add-com {
		padding: 0.5rem 1rem;
		background: #0f0f0f;
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.btn-add-com:hover { background: #27272a; }

	/* Grid de comunidades */
	.com-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
	}

	/* Tarjeta comunidad */
	.com-card {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 1.125rem;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		transition: box-shadow 0.2s, border-color 0.2s;
	}
	.com-card:hover {
		box-shadow: 0 4px 20px rgba(0,0,0,0.08);
		border-color: #d4d4d8;
	}

	.com-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.com-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #0f0f0f;
		letter-spacing: -0.01em;
	}

	.com-actions { display: flex; gap: 0.125rem; }

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
	.icon-btn:hover { background: #f4f4f5; color: #6b6b6b; }
	.icon-btn.danger:hover { background: #fef2f2; color: #ef4444; }

	/* Stats dentro de la tarjeta */
	.com-stats { display: flex; }

	.com-stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.5rem 0;
	}
	.com-stat:not(:last-child) { border-right: 1px solid #f4f4f5; }

	.com-stat-val {
		font-size: 1.375rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.03em;
		line-height: 1;
	}
	.com-stat-val.success { color: #10b981; }
	.com-stat-val.danger { color: #ef4444; }
	.com-stat-val.muted { color: #d4d4d8; }
	.com-stat-val.warning { color: #f59e0b; }

	.com-stat-lbl {
		font-size: 0.6875rem;
		color: #a1a1aa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	/* Barra de progreso de la tarjeta */
	.com-progress-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.com-progress-track {
		flex: 1;
		height: 5px;
		background: #f4f4f5;
		border-radius: 100px;
		display: flex;
		overflow: hidden;
	}

	.com-progress-fill { height: 100%; transition: width 0.4s ease; }
	.com-progress-fill.success { background: #10b981; }
	.com-progress-fill.danger { background: #ef4444; }
	.com-progress-fill.neutral { background: #e4e4e7; }
	.com-progress-fill.warning { background: #f59e0b; }

	.com-pct {
		font-size: 0.75rem;
		color: #6b6b6b;
		font-variant-numeric: tabular-nums;
		min-width: 2.5rem;
		text-align: right;
	}

	/* Dinero */
	.com-money-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.625rem 0;
		border-top: 1px solid #f4f4f5;
		border-bottom: 1px solid #f4f4f5;
	}

	.com-money { display: flex; flex-direction: column; gap: 0.125rem; }

	.com-money-val {
		font-size: 0.9375rem;
		font-weight: 700;
		color: #0f0f0f;
		font-variant-numeric: tabular-nums;
	}
	.com-money-val.muted { color: #6b6b6b; font-size: 1rem; }

	.com-money-lbl {
		font-size: 0.6875rem;
		color: #a1a1aa;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	.com-sep { width: 1px; height: 2rem; background: #f4f4f5; flex-shrink: 0; }

	/* Botones tarjeta */
	.com-footer { display: flex; gap: 0.5rem; }

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
	.btn-outline:hover { background: #f4f4f5; color: #0f0f0f; }

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
	.btn-dark:hover { background: #27272a; }

	/* Empty state */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.empty-title {
		font-size: 1rem;
		font-weight: 600;
		color: #0f0f0f;
	}

	.empty-hint {
		font-size: 0.875rem;
		color: #a1a1aa;
		margin-bottom: 0.75rem;
	}

	.empty-state .btn-dark {
		flex: none;
		padding: 0.5rem 1.25rem;
	}

	/* Modal form */
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.field { display: flex; flex-direction: column; gap: 0.375rem; }

	.field-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #6b6b6b;
	}

	.field-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		font-size: 0.9375rem;
		color: #0f0f0f;
		outline: none;
		transition: border-color 0.15s;
		background: #fff;
	}
	.field-input:focus { border-color: #0f0f0f; }

	.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }

	.btn-ghost {
		padding: 0.5rem 1rem;
		background: transparent;
		color: #6b6b6b;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}
	.btn-ghost:hover { background: #f4f4f5; color: #0f0f0f; }

	/* Modal gestión */
	.com-modal { display: flex; flex-direction: column; gap: 1rem; }

	.tabs {
		display: flex;
		gap: 0.125rem;
		background: #f4f4f5;
		border-radius: 10px;
		padding: 3px;
	}

	.tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b6b6b;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}
	.tab:hover { color: #0f0f0f; }
	.tab.active { background: #fff; color: #0f0f0f; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

	.tab-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.25rem;
		background: #f4f4f5;
		border-radius: 100px;
		font-size: 0.6875rem;
		font-weight: 600;
		color: #6b6b6b;
	}
	.tab.active .tab-count { background: #e5e5e5; }

	.tab-content { display: flex; flex-direction: column; gap: 1rem; }

	.add-panel {
		background: #f7f7f8;
		border: 1px solid #f0f0f0;
		border-radius: 10px;
		padding: 0.875rem;
	}

	.add-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b6b6b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.inline-row { display: flex; align-items: center; gap: 0.5rem; }
	.sep { color: #a1a1aa; }

	.num-input {
		width: 80px;
		padding: 0.5rem 0.625rem;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #0f0f0f;
		outline: none;
		background: #fff;
		font-variant-numeric: tabular-nums;
		transition: border-color 0.15s;
	}
	.num-input.flex { flex: 1; width: auto; }
	.num-input:focus { border-color: #0f0f0f; }

	.btn-dark.sm { padding: 0.5rem 0.875rem; flex: none; }

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		max-height: 380px;
		overflow-y: auto;
		padding-right: 2px;
	}

	.empty-text {
		color: #a1a1aa;
		font-size: 0.875rem;
		text-align: center;
		padding: 2.5rem 1rem;
	}

	/* Not found */
	.not-found {
		text-align: center;
		padding: 6rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	@media (max-width: 768px) {
		.centro-stats { flex-wrap: wrap; }
		.stat-block { min-width: 33%; }
		.stat-block:nth-child(3) { border-right: none; }
		.com-grid { grid-template-columns: 1fr; }
		.section-header { flex-direction: column; align-items: flex-start; }
	}
</style>
