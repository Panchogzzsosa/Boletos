<script lang="ts">
	import { centros, estadisticasComunidades } from '$lib/stores';
	import ComunidadCard from '$lib/components/ComunidadCard.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import BoletoItem from '$lib/components/BoletoItem.svelte';
	import RegaloItem from '$lib/components/RegaloItem.svelte';

	let modal = {
		show: false,
		centroId: '',
		comunidadId: '',
		nombre: '',
		centroNombre: '',
		tab: 'boletos' as 'boletos' | 'regalos'
	};

	let boletoInput = { rangoInicio: '', rangoFin: '', single: '' };
	let regaloDescripcion = '';

	$: todasComunidades = $centros.flatMap(c =>
		c.comunidades.map(com => ({ ...com, centroNombre: c.nombre, centroId: c.id }))
	);

	function abrirModal(com: typeof todasComunidades[0], tab: 'boletos' | 'regalos' = 'boletos') {
		modal = {
			show: true,
			centroId: com.centroId,
			comunidadId: com.id,
			nombre: com.nombre,
			centroNombre: com.centroNombre,
			tab
		};
		boletoInput = { rangoInicio: '', rangoFin: '', single: '' };
		regaloDescripcion = '';
	}

	function cerrar() {
		modal.show = false;
	}

	function agregarRango() {
		const inicio = parseInt(boletoInput.rangoInicio);
		const fin = parseInt(boletoInput.rangoFin);
		if (inicio && fin && inicio <= fin) {
			const nums: number[] = [];
			for (let i = inicio; i <= fin; i++) nums.push(i);
			centros.agregarBoletos(modal.centroId, modal.comunidadId, nums);
			boletoInput.rangoInicio = '';
			boletoInput.rangoFin = '';
		}
	}

	function agregarIndividual() {
		const num = parseInt(boletoInput.single);
		if (num) {
			centros.agregarBoletos(modal.centroId, modal.comunidadId, [num]);
			boletoInput.single = '';
		}
	}

	function cambiarEstado(boletoId: string, estado: 'pagado' | 'no_pagado' | 'regresado') {
		centros.cambiarEstadoBoleto(modal.centroId, modal.comunidadId, boletoId, estado);
	}

	function eliminarBoleto(boletoId: string) {
		if (confirm('¿Eliminar este boleto?'))
			centros.eliminarBoleto(modal.centroId, modal.comunidadId, boletoId);
	}

	function agregarRegalo() {
		if (regaloDescripcion.trim()) {
			centros.agregarRegalo(modal.centroId, modal.comunidadId, regaloDescripcion.trim());
			regaloDescripcion = '';
		}
	}

	function eliminarRegalo(regaloId: string) {
		if (confirm('¿Eliminar este regalo?'))
			centros.eliminarRegalo(modal.centroId, modal.comunidadId, regaloId);
	}

	function eliminarComunidad(centroId: string, comunidadId: string) {
		if (confirm('¿Eliminar esta comunidad?'))
			centros.eliminarComunidad(centroId, comunidadId);
	}

	function editarComunidad(centroId: string, comunidadId: string, nombre: string) {
		const nuevo = prompt('Nuevo nombre:', nombre);
		if (nuevo?.trim()) centros.editarComunidad(centroId, comunidadId, nuevo.trim());
	}

	$: comunidadActual = todasComunidades.find(c => c.id === modal.comunidadId);
	$: boletos = [...(comunidadActual?.boletos ?? [])].sort((a, b) => a.numero - b.numero);
	$: regalos = [...(comunidadActual?.regalos ?? [])].sort(
		(a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
	);
</script>

<svelte:head>
	<title>Comunidades · Boletos</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<div>
			<h1>Comunidades</h1>
			<p class="subtitle">{todasComunidades.length} comunidad{todasComunidades.length !== 1 ? 'es' : ''} en total</p>
		</div>
	</header>

	{#if todasComunidades.length > 0}
		<div class="com-grid">
			{#each todasComunidades as com}
				{@const stats = $estadisticasComunidades.find(s => s.comunidadId === com.id)}
				<ComunidadCard
					comunidad={{ ...com, boletos: com.boletos, regalos: com.regalos }}
					{stats}
					nombreCentro={com.centroNombre}
					onEdit={() => editarComunidad(com.centroId, com.id, com.nombre)}
					onDelete={() => eliminarComunidad(com.centroId, com.id)}
					onManageBoletos={() => abrirModal(com, 'boletos')}
					onManageRegalos={() => abrirModal(com, 'regalos')}
				/>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<p class="empty-title">Sin comunidades</p>
			<p class="empty-hint">Ve a <a href="/centros">Centros</a> para agregar comunidades</p>
		</div>
	{/if}
</div>

<!-- Modal de gestión -->
<Modal
	show={modal.show}
	title="{modal.nombre} · {modal.centroNombre}"
	onClose={cerrar}
>
	<div class="com-modal">
		<div class="tabs">
			<button
				class="tab"
				class:active={modal.tab === 'boletos'}
				on:click={() => modal.tab = 'boletos'}
			>
				Boletos {#if boletos.length > 0}<span class="tab-count">{boletos.length}</span>{/if}
			</button>
			<button
				class="tab"
				class:active={modal.tab === 'regalos'}
				on:click={() => modal.tab = 'regalos'}
			>
				Regalos {#if regalos.length > 0}<span class="tab-count">{regalos.length}</span>{/if}
			</button>
		</div>

		{#if modal.tab === 'boletos'}
			<div class="tab-content">
				<div class="add-panel">
					<p class="add-label">Agregar por rango</p>
					<div class="rango-row">
						<input type="number" class="num-input" placeholder="Desde" bind:value={boletoInput.rangoInicio} />
						<span class="sep">—</span>
						<input type="number" class="num-input" placeholder="Hasta" bind:value={boletoInput.rangoFin} />
						<button class="btn-dark sm" on:click={agregarRango}>Agregar</button>
					</div>
					<p class="add-label" style="margin-top: 0.75rem">Número individual</p>
					<div class="single-row">
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

				<div class="list-wrap">
					{#if boletos.length > 0}
						<div class="items-list">
							{#each boletos as boleto (boleto.id)}
								<BoletoItem
									{boleto}
									onChangeEstado={(estado) => cambiarEstado(boleto.id, estado)}
									onDelete={() => eliminarBoleto(boleto.id)}
								/>
							{/each}
						</div>
					{:else}
						<p class="empty-text">Sin boletos registrados</p>
					{/if}
				</div>
			</div>
		{/if}

		{#if modal.tab === 'regalos'}
			<div class="tab-content">
				<div class="add-panel">
					<p class="add-label">Agregar regalo</p>
					<div class="single-row">
						<input
							type="text"
							class="text-input flex"
							placeholder="Descripción del regalo..."
							bind:value={regaloDescripcion}
							on:keypress={(e) => e.key === 'Enter' && agregarRegalo()}
						/>
						<button class="btn-dark sm" on:click={agregarRegalo}>Agregar</button>
					</div>
				</div>

				<div class="list-wrap">
					{#if regalos.length > 0}
						<div class="items-list">
							{#each regalos as regalo (regalo.id)}
								<RegaloItem
									{regalo}
									onDelete={() => eliminarRegalo(regalo.id)}
								/>
							{/each}
						</div>
					{:else}
						<p class="empty-text">Sin regalos registrados</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</Modal>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
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

	.com-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 0.75rem;
	}

	.empty-state {
		text-align: center;
		padding: 5rem 2rem;
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
	}

	.empty-title {
		font-size: 1rem;
		font-weight: 600;
		color: #0f0f0f;
		margin-bottom: 0.375rem;
	}

	.empty-hint {
		font-size: 0.875rem;
		color: #a1a1aa;
	}

	.empty-hint a {
		color: #0f0f0f;
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* Modal */
	.com-modal {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

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

	.tab.active {
		background: #fff;
		color: #0f0f0f;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

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

	.tab.active .tab-count {
		background: #e5e5e5;
	}

	.tab-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

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

	.rango-row, .single-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sep {
		color: #a1a1aa;
		font-size: 0.875rem;
	}

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

	.num-input.flex {
		flex: 1;
		width: auto;
	}

	.text-input {
		padding: 0.5rem 0.625rem;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #0f0f0f;
		outline: none;
		background: #fff;
		transition: border-color 0.15s;
	}

	.text-input.flex { flex: 1; }

	.num-input:focus, .text-input:focus {
		border-color: #0f0f0f;
	}

	.btn-dark {
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

	.btn-dark.sm { padding: 0.5rem 0.875rem; }
	.btn-dark:hover { background: #27272a; }

	.list-wrap { min-height: 60px; }

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

	@media (max-width: 600px) {
		.com-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
