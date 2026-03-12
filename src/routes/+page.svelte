<script lang="ts">
	import { centros, estadisticasCentros, estadisticasComunidades } from '$lib/stores';
	import { PRECIO_BOLETO } from '$lib/types';
	import type { Boleto } from '$lib/types';
	import { auth } from '$lib/auth';
	import Modal from '$lib/components/Modal.svelte';

	let modalActivo: 'pagados' | 'pendientes' | 'regalos' | 'regresados' | 'perdidos' | 'busqueda' | null = null;
	
	// Búsqueda de boleto
	let numeroBoletoBusqueda: string = '';
	let resultadoBusqueda: {
		numero: number;
		centro: string;
		centroId: string;
		comunidad: string;
		comunidadId: string;
		boletoId: string;
		estado: Boleto['estado'];
		found: boolean;
	} | null = null;
	
	$: puedeEditar = $auth.usuario?.role === 'admin' || $auth.usuario?.role === 'editor';
	
	function buscarBoleto() {
		const numero = parseInt(numeroBoletoBusqueda);
		if (isNaN(numero) || numero <= 0) {
			resultadoBusqueda = null;
			return;
		}

		for (const centro of $centros) {
			for (const com of centro.comunidades) {
				const boleto = com.boletos.find(b => b.numero === numero);
				if (boleto) {
					resultadoBusqueda = {
						numero: boleto.numero,
						centro: centro.nombre,
						centroId: centro.id,
						comunidad: com.nombre,
						comunidadId: com.id,
						boletoId: boleto.id,
						estado: boleto.estado,
						found: true
					};
					abrirModal('busqueda');
					return;
				}
			}
		}

		// No encontrado
		resultadoBusqueda = {
			numero,
			centro: '',
			centroId: '',
			comunidad: '',
			comunidadId: '',
			boletoId: '',
			estado: 'no_pagado',
			found: false
		};
		abrirModal('busqueda');
	}
	
	function getEstadoLabel(estado: Boleto['estado']): string {
		const labels: Record<Boleto['estado'], string> = {
			'pagado': 'Pagado',
			'no_pagado': 'No pagado',
			'regresado': 'Regresado',
			'perdido': 'Perdido'
		};
		return labels[estado];
	}
	
	function getEstadoColor(estado: Boleto['estado']): string {
		const colors: Record<Boleto['estado'], string> = {
			'pagado': '#10b981',
			'no_pagado': '#ef4444',
			'regresado': '#6b7280',
			'perdido': '#f59e0b'
		};
		return colors[estado];
	}
	
	async function cambiarEstadoBoleto(nuevoEstado: Boleto['estado']) {
		if (!resultadoBusqueda || !resultadoBusqueda.found || !puedeEditar) return;
		if (nuevoEstado === resultadoBusqueda.estado) return;
		
		await centros.cambiarEstadoBoleto(
			resultadoBusqueda.centroId,
			resultadoBusqueda.comunidadId,
			resultadoBusqueda.boletoId,
			nuevoEstado
		);
		
		// Actualizar el resultado de búsqueda con el nuevo estado
		resultadoBusqueda = {
			...resultadoBusqueda,
			estado: nuevoEstado
		};
	}
	
	// Estado para controlar qué items están expandidos en cada modal
	let expandidosPagadosCentros: Set<string> = new Set();
	let expandidosPagadosComunidades: Set<string> = new Set();
	let expandidosPendientesCentros: Set<string> = new Set();
	let expandidosPendientesComunidades: Set<string> = new Set();
	let expandidosRegresadosCentros: Set<string> = new Set();
	let expandidosRegresadosComunidades: Set<string> = new Set();
	let expandidosPerdidosCentros: Set<string> = new Set();
	let expandidosPerdidosComunidades: Set<string> = new Set();
	let expandidosRegalosCentros: Set<string> = new Set();
	let expandidosRegalosComunidades: Set<string> = new Set();

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

	// Datos para los modales - filtrados por estado
	$: centrosConPagados = $estadisticasCentros.filter(c => c.boletosPagados > 0).sort((a, b) => b.boletosPagados - a.boletosPagados);
	$: comunidadesConPagados = $estadisticasComunidades.filter(c => c.boletosPagados > 0).sort((a, b) => b.boletosPagados - a.boletosPagados);
	
	$: centrosConPendientes = $estadisticasCentros.filter(c => c.boletosNoPagados > 0).sort((a, b) => b.boletosNoPagados - a.boletosNoPagados);
	$: comunidadesConPendientes = $estadisticasComunidades.filter(c => c.boletosNoPagados > 0).sort((a, b) => b.boletosNoPagados - a.boletosNoPagados);
	
	$: centrosConRegresados = $estadisticasCentros.filter(c => c.boletosRegresados > 0).sort((a, b) => b.boletosRegresados - a.boletosRegresados);
	$: comunidadesConRegresados = $estadisticasComunidades.filter(c => c.boletosRegresados > 0).sort((a, b) => b.boletosRegresados - a.boletosRegresados);
	
	$: centrosConPerdidos = $estadisticasCentros.filter(c => c.boletosPerdidos > 0).sort((a, b) => b.boletosPerdidos - a.boletosPerdidos);
	$: comunidadesConPerdidos = $estadisticasComunidades.filter(c => c.boletosPerdidos > 0).sort((a, b) => b.boletosPerdidos - a.boletosPerdidos);
	
	$: centrosConRegalos = $estadisticasCentros.filter(c => c.totalRegalos > 0).sort((a, b) => b.totalRegalos - a.totalRegalos);
	$: comunidadesConRegalos = $estadisticasComunidades.filter(c => c.totalRegalos > 0).sort((a, b) => b.totalRegalos - a.totalRegalos);

	function mxn(n: number) {
		return '$' + n.toLocaleString('es-MX');
	}

	function abrirModal(tipo: typeof modalActivo) {
		modalActivo = tipo;
		// Resetear expandidos al abrir modal
		expandidosPagadosCentros = new Set();
		expandidosPagadosComunidades = new Set();
		expandidosPendientesCentros = new Set();
		expandidosPendientesComunidades = new Set();
		expandidosRegresadosCentros = new Set();
		expandidosRegresadosComunidades = new Set();
		expandidosPerdidosCentros = new Set();
		expandidosPerdidosComunidades = new Set();
		expandidosRegalosCentros = new Set();
		expandidosRegalosComunidades = new Set();
	}

	function cerrarModal() {
		modalActivo = null;
	}

	function toggleExpandido(set: Set<string>, id: string) {
		const nuevo = new Set(set);
		if (nuevo.has(id)) {
			nuevo.delete(id);
		} else {
			nuevo.add(id);
		}
		return nuevo;
	}

	// Funciones para obtener boletos específicos
	function getBoletosCentro(centroId: string, estado: Boleto['estado']): number[] {
		const centro = $centros.find(c => c.id === centroId);
		if (!centro) return [];
		return centro.comunidades
			.flatMap(com => com.boletos)
			.filter(b => b.estado === estado)
			.map(b => b.numero)
			.sort((a, b) => a - b);
	}

	function getBoletosComunidad(comunidadId: string, estado: Boleto['estado']): number[] {
		for (const centro of $centros) {
			const com = centro.comunidades.find(c => c.id === comunidadId);
			if (com) {
				return com.boletos
					.filter(b => b.estado === estado)
					.map(b => b.numero)
					.sort((a, b) => a - b);
			}
		}
		return [];
	}

	function getRegalosCentro(centroId: string): { descripcion: string; comunidad: string }[] {
		const centro = $centros.find(c => c.id === centroId);
		if (!centro) return [];
		return centro.comunidades.flatMap(com => 
			com.regalos.map(r => ({ descripcion: r.descripcion, comunidad: com.nombre }))
		);
	}

	function getRegalosComunidad(comunidadId: string): string[] {
		for (const centro of $centros) {
			const com = centro.comunidades.find(c => c.id === comunidadId);
			if (com) {
				return com.regalos.map(r => r.descripcion);
			}
		}
		return [];
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

	<!-- Búsqueda de boleto -->
	<div class="card busqueda-section">
		<div class="busqueda-content">
			<div class="busqueda-icon">
				<svg width="20" height="20" viewBox="0 0 16 16" fill="none">
					<path d="M11.7422 10.3439C12.5329 9.2673 13 7.9382 13 6.5C13 2.91015 10.0899 0 6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13C7.9382 13 9.2673 12.5329 10.3439 11.7422L14.1464 15.5446C14.3417 15.7399 14.6583 15.7399 14.8536 15.5446L15.5446 14.8536C15.7399 14.6583 15.7399 14.3417 15.5446 14.1464L11.7422 10.3439ZM6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 8.98528 8.98528 11 6.5 11Z" fill="currentColor"/>
				</svg>
			</div>
			<div class="busqueda-input-wrapper">
				<label for="busqueda-boleto">Buscar boleto por número</label>
				<div class="busqueda-input-group">
					<input
						id="busqueda-boleto"
						type="number"
						placeholder="Ingresa el número de boleto..."
						bind:value={numeroBoletoBusqueda}
						on:keypress={(e) => e.key === 'Enter' && buscarBoleto()}
						min="1"
						class="busqueda-input"
					/>
					<button 
						class="btn-buscar"
						on:click={buscarBoleto}
						disabled={!numeroBoletoBusqueda || parseInt(numeroBoletoBusqueda) <= 0}
					>
						Buscar
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Métricas principales -->
	<div class="metrics">
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="metric-card highlight clickable" on:click={() => abrirModal('pagados')}>
			<span class="metric-label">Total recaudado</span>
			<span class="metric-value">{mxn(totalRecaudado)}</span>
			<span class="metric-sub">{totalPagado} boleto{totalPagado !== 1 ? 's' : ''} pagado{totalPagado !== 1 ? 's' : ''}</span>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="metric-card clickable" on:click={() => abrirModal('pendientes')}>
			<span class="metric-label">Por cobrar</span>
			<span class="metric-value">{mxn(totalPorCobrar)}</span>
			<span class="metric-sub">{totalNoPagado} boleto{totalNoPagado !== 1 ? 's' : ''} pendiente{totalNoPagado !== 1 ? 's' : ''}</span>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="metric-card clickable" on:click={() => abrirModal('regalos')}>
			<span class="metric-label">Regalos</span>
			<span class="metric-value num">{totalRegalos}</span>
			<span class="metric-sub">registrados en total</span>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="metric-card clickable" on:click={() => abrirModal('regresados')}>
			<span class="metric-label">Regresados</span>
			<span class="metric-value num">{totalRegresado}</span>
			<span class="metric-sub">boleto{totalRegresado !== 1 ? 's' : ''} sin cargo</span>
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="metric-card clickable" on:click={() => abrirModal('perdidos')}>
			<span class="metric-label">Perdidos</span>
			<span class="metric-value num">{totalPerdido}</span>
			<span class="metric-sub">boleto{totalPerdido !== 1 ? 's' : ''} perdido{totalPerdido !== 1 ? 's' : ''}</span>
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
				<div class="progress-fill warning" style="width: {pctPerdido}%"></div>
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
				<div class="legend-item">
					<span class="legend-dot warning"></span>
					<span>Perdidos <strong>{totalPerdido}</strong></span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Rankings -->
	<div class="rankings">
		<div class="card">
			<h2 class="card-title"><span>Centros</span> · boletos pendientes de pagar</h2>
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
			<h2 class="card-title"><span>Comunidades</span> · boletos pendientes de pagar</h2>
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

<!-- Modal Boletos Pagados -->
<Modal show={modalActivo === 'pagados'} title="Boletos Pagados · {totalPagado} total · {mxn(totalRecaudado)}" onClose={cerrarModal}>
	<div class="modal-content">
		<section class="modal-section">
			<h3 class="section-title">Por Centro</h3>
			{#if centrosConPagados.length > 0}
				<div class="detail-list">
					{#each centrosConPagados as centro}
						{@const boletos = getBoletosCentro(centro.centroId, 'pagado')}
						{@const expandido = expandidosPagadosCentros.has(centro.centroId)}
						<div class="detail-item">
							<button 
								class="expand-btn" 
								class:expanded={expandido}
								on:click={() => expandidosPagadosCentros = toggleExpandido(expandidosPagadosCentros, centro.centroId)}
								aria-label={expandido ? 'Colapsar' : 'Expandir'}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
							<div class="detail-row-content">
								<div class="detail-main">
									<span class="detail-name">{centro.nombreCentro}</span>
									<span class="detail-count success">{centro.boletosPagados} boleto{centro.boletosPagados !== 1 ? 's' : ''} · {mxn(centro.totalRecaudado)}</span>
								</div>
								{#if expandido}
									<div class="detail-expanded">
										<div class="boletos-grid">
											{#each boletos as num}
												<span class="boleto-num">{num}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin boletos pagados</p>
			{/if}
		</section>
		
		<section class="modal-section">
			<h3 class="section-title">Por Comunidad</h3>
			{#if comunidadesConPagados.length > 0}
				<div class="detail-list">
					{#each comunidadesConPagados as com}
						{@const boletos = getBoletosComunidad(com.comunidadId, 'pagado')}
						{@const expandido = expandidosPagadosComunidades.has(com.comunidadId)}
						<div class="detail-item">
							<button 
								class="expand-btn" 
								class:expanded={expandido}
								on:click={() => expandidosPagadosComunidades = toggleExpandido(expandidosPagadosComunidades, com.comunidadId)}
								aria-label={expandido ? 'Colapsar' : 'Expandir'}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
							<div class="detail-row-content">
								<div class="detail-main">
									<div class="detail-info">
										<span class="detail-name">{com.nombreComunidad}</span>
										<span class="detail-sub">{com.nombreCentro}</span>
									</div>
									<span class="detail-count success">{com.boletosPagados} boleto{com.boletosPagados !== 1 ? 's' : ''} · {mxn(com.totalRecaudado)}</span>
								</div>
								{#if expandido}
									<div class="detail-expanded">
										<div class="boletos-grid">
											{#each boletos as num}
												<span class="boleto-num">{num}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin boletos pagados</p>
			{/if}
		</section>
	</div>
</Modal>

<!-- Modal Boletos Pendientes -->
<Modal show={modalActivo === 'pendientes'} title="Boletos Pendientes · {totalNoPagado} total · {mxn(totalPorCobrar)}" onClose={cerrarModal}>
	<div class="modal-content">
		<section class="modal-section">
			<h3 class="section-title">Por Centro</h3>
			{#if centrosConPendientes.length > 0}
				<div class="detail-list">
					{#each centrosConPendientes as centro}
						{@const boletos = getBoletosCentro(centro.centroId, 'no_pagado')}
						{@const expandido = expandidosPendientesCentros.has(centro.centroId)}
						<div class="detail-item">
							<button 
								class="expand-btn" 
								class:expanded={expandido}
								on:click={() => expandidosPendientesCentros = toggleExpandido(expandidosPendientesCentros, centro.centroId)}
								aria-label={expandido ? 'Colapsar' : 'Expandir'}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
							<div class="detail-row-content">
								<div class="detail-main">
									<span class="detail-name">{centro.nombreCentro}</span>
									<span class="detail-count danger">{centro.boletosNoPagados} boleto{centro.boletosNoPagados !== 1 ? 's' : ''} · {mxn(centro.totalPorCobrar)}</span>
								</div>
								{#if expandido}
									<div class="detail-expanded">
										<div class="boletos-grid">
											{#each boletos as num}
												<span class="boleto-num danger">{num}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin boletos pendientes</p>
			{/if}
		</section>
		
		<section class="modal-section">
			<h3 class="section-title">Por Comunidad</h3>
			{#if comunidadesConPendientes.length > 0}
				<div class="detail-list">
					{#each comunidadesConPendientes as com}
						{@const boletos = getBoletosComunidad(com.comunidadId, 'no_pagado')}
						{@const expandido = expandidosPendientesComunidades.has(com.comunidadId)}
						<div class="detail-item">
							<button 
								class="expand-btn" 
								class:expanded={expandido}
								on:click={() => expandidosPendientesComunidades = toggleExpandido(expandidosPendientesComunidades, com.comunidadId)}
								aria-label={expandido ? 'Colapsar' : 'Expandir'}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
							<div class="detail-row-content">
								<div class="detail-main">
									<div class="detail-info">
										<span class="detail-name">{com.nombreComunidad}</span>
										<span class="detail-sub">{com.nombreCentro}</span>
									</div>
									<span class="detail-count danger">{com.boletosNoPagados} boleto{com.boletosNoPagados !== 1 ? 's' : ''} · {mxn(com.totalPorCobrar)}</span>
								</div>
								{#if expandido}
									<div class="detail-expanded">
										<div class="boletos-grid">
											{#each boletos as num}
												<span class="boleto-num danger">{num}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin boletos pendientes</p>
			{/if}
		</section>
	</div>
</Modal>

<!-- Modal Regalos -->
<Modal show={modalActivo === 'regalos'} title="Regalos Registrados · {totalRegalos} total" onClose={cerrarModal}>
	<div class="modal-content">
		<section class="modal-section">
			<h3 class="section-title">Por Centro</h3>
			{#if centrosConRegalos.length > 0}
				<div class="detail-list">
					{#each centrosConRegalos as centro}
						{@const regalos = getRegalosCentro(centro.centroId)}
						{@const expandido = expandidosRegalosCentros.has(centro.centroId)}
						<div class="detail-item">
							<button 
								class="expand-btn" 
								class:expanded={expandido}
								on:click={() => expandidosRegalosCentros = toggleExpandido(expandidosRegalosCentros, centro.centroId)}
								aria-label={expandido ? 'Colapsar' : 'Expandir'}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
							<div class="detail-row-content">
								<div class="detail-main">
									<span class="detail-name">{centro.nombreCentro}</span>
									<span class="detail-count accent">{centro.totalRegalos} regalo{centro.totalRegalos !== 1 ? 's' : ''}</span>
								</div>
								{#if expandido}
									<div class="detail-expanded">
										<div class="regalos-list">
											{#each regalos as regalo}
												<div class="regalo-item">
													<span class="regalo-desc">{regalo.descripcion}</span>
													<span class="regalo-comunidad">{regalo.comunidad}</span>
												</div>
												{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin regalos registrados</p>
			{/if}
		</section>
		
		<section class="modal-section">
			<h3 class="section-title">Por Comunidad</h3>
			{#if comunidadesConRegalos.length > 0}
				<div class="detail-list">
					{#each comunidadesConRegalos as com}
						{@const regalos = getRegalosComunidad(com.comunidadId)}
						{@const expandido = expandidosRegalosComunidades.has(com.comunidadId)}
						<div class="detail-item">
							<button 
								class="expand-btn" 
								class:expanded={expandido}
								on:click={() => expandidosRegalosComunidades = toggleExpandido(expandidosRegalosComunidades, com.comunidadId)}
								aria-label={expandido ? 'Colapsar' : 'Expandir'}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
							<div class="detail-row-content">
								<div class="detail-main">
									<div class="detail-info">
										<span class="detail-name">{com.nombreComunidad}</span>
										<span class="detail-sub">{com.nombreCentro}</span>
									</div>
									<span class="detail-count accent">{com.totalRegalos} regalo{com.totalRegalos !== 1 ? 's' : ''}</span>
								</div>
								{#if expandido}
									<div class="detail-expanded">
										<div class="regalos-list">
											{#each regalos as regalo}
												<div class="regalo-item">
													<span class="regalo-desc">{regalo}</span>
												</div>
												{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin regalos registrados</p>
			{/if}
		</section>
	</div>
</Modal>

<!-- Modal Boletos Regresados -->
<Modal show={modalActivo === 'regresados'} title="Boletos Regresados · {totalRegresado} total" onClose={cerrarModal}>
	<div class="modal-content">
		<section class="modal-section">
			<h3 class="section-title">Por Centro</h3>
			{#if centrosConRegresados.length > 0}
				<div class="detail-list">
					{#each centrosConRegresados as centro}
						{@const boletos = getBoletosCentro(centro.centroId, 'regresado')}
						{@const expandido = expandidosRegresadosCentros.has(centro.centroId)}
						<div class="detail-item">
							<button 
								class="expand-btn" 
								class:expanded={expandido}
								on:click={() => expandidosRegresadosCentros = toggleExpandido(expandidosRegresadosCentros, centro.centroId)}
								aria-label={expandido ? 'Colapsar' : 'Expandir'}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
							<div class="detail-row-content">
								<div class="detail-main">
									<span class="detail-name">{centro.nombreCentro}</span>
									<span class="detail-count neutral">{centro.boletosRegresados} boleto{centro.boletosRegresados !== 1 ? 's' : ''}</span>
								</div>
								{#if expandido}
									<div class="detail-expanded">
										<div class="boletos-grid">
											{#each boletos as num}
												<span class="boleto-num neutral">{num}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin boletos regresados</p>
			{/if}
		</section>
		
		<section class="modal-section">
			<h3 class="section-title">Por Comunidad</h3>
			{#if comunidadesConRegresados.length > 0}
				<div class="detail-list">
					{#each comunidadesConRegresados as com}
						{@const boletos = getBoletosComunidad(com.comunidadId, 'regresado')}
						{@const expandido = expandidosRegresadosComunidades.has(com.comunidadId)}
						<div class="detail-item">
							<button 
								class="expand-btn" 
								class:expanded={expandido}
								on:click={() => expandidosRegresadosComunidades = toggleExpandido(expandidosRegresadosComunidades, com.comunidadId)}
								aria-label={expandido ? 'Colapsar' : 'Expandir'}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
							<div class="detail-row-content">
								<div class="detail-main">
									<div class="detail-info">
										<span class="detail-name">{com.nombreComunidad}</span>
										<span class="detail-sub">{com.nombreCentro}</span>
									</div>
									<span class="detail-count neutral">{com.boletosRegresados} boleto{com.boletosRegresados !== 1 ? 's' : ''}</span>
								</div>
								{#if expandido}
									<div class="detail-expanded">
										<div class="boletos-grid">
											{#each boletos as num}
												<span class="boleto-num neutral">{num}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin boletos regresados</p>
			{/if}
		</section>
	</div>
</Modal>

<!-- Modal Boletos Perdidos -->
<Modal show={modalActivo === 'perdidos'} title="Boletos Perdidos · {totalPerdido} total" onClose={cerrarModal}>
	<div class="modal-content">
		<section class="modal-section">
			<h3 class="section-title">Por Centro</h3>
			{#if centrosConPerdidos.length > 0}
				<div class="detail-list">
					{#each centrosConPerdidos as centro}
						{@const boletos = getBoletosCentro(centro.centroId, 'perdido')}
						{@const expandido = expandidosPerdidosCentros.has(centro.centroId)}
						<div class="detail-item">
							<button 
								class="expand-btn" 
								class:expanded={expandido}
								on:click={() => expandidosPerdidosCentros = toggleExpandido(expandidosPerdidosCentros, centro.centroId)}
								aria-label={expandido ? 'Colapsar' : 'Expandir'}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
							<div class="detail-row-content">
								<div class="detail-main">
									<span class="detail-name">{centro.nombreCentro}</span>
									<span class="detail-count warning">{centro.boletosPerdidos} boleto{centro.boletosPerdidos !== 1 ? 's' : ''}</span>
								</div>
								{#if expandido}
									<div class="detail-expanded">
										<div class="boletos-grid">
											{#each boletos as num}
												<span class="boleto-num warning">{num}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin boletos perdidos</p>
			{/if}
		</section>
		
		<section class="modal-section">
			<h3 class="section-title">Por Comunidad</h3>
			{#if comunidadesConPerdidos.length > 0}
				<div class="detail-list">
					{#each comunidadesConPerdidos as com}
						{@const boletos = getBoletosComunidad(com.comunidadId, 'perdido')}
						{@const expandido = expandidosPerdidosComunidades.has(com.comunidadId)}
						<div class="detail-item">
							<button 
								class="expand-btn" 
								class:expanded={expandido}
								on:click={() => expandidosPerdidosComunidades = toggleExpandido(expandidosPerdidosComunidades, com.comunidadId)}
								aria-label={expandido ? 'Colapsar' : 'Expandir'}
							>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
							<div class="detail-row-content">
								<div class="detail-main">
									<div class="detail-info">
										<span class="detail-name">{com.nombreComunidad}</span>
										<span class="detail-sub">{com.nombreCentro}</span>
									</div>
									<span class="detail-count warning">{com.boletosPerdidos} boleto{com.boletosPerdidos !== 1 ? 's' : ''}</span>
								</div>
								{#if expandido}
									<div class="detail-expanded">
										<div class="boletos-grid">
											{#each boletos as num}
												<span class="boleto-num warning">{num}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Sin boletos perdidos</p>
			{/if}
		</section>
	</div>
</Modal>


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

	.metric-card.clickable {
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
	}

	.metric-card.clickable:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
		border-color: #0f0f0f;
	}

	.metric-card.highlight.clickable:hover {
		border-color: #fff;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
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

	.card-title span {
		font-weight: 800;
		color: #0f0f0f;
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

	/* Modal Content Styles */
	.modal-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.modal-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modal-section .section-title {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #a1a1aa;
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #f4f4f5;
	}

	.detail-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 280px;
		overflow-y: auto;
	}

	.detail-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f4f4f5;
	}

	.detail-item:last-child {
		border-bottom: none;
	}

	.expand-btn {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		color: #a1a1aa;
		transition: all 0.15s ease;
		margin-top: 2px;
	}

	.expand-btn:hover {
		background: #f4f4f5;
		color: #0f0f0f;
	}

	.expand-btn svg {
		transition: transform 0.2s ease;
	}

	.expand-btn.expanded svg {
		transform: rotate(90deg);
	}

	.detail-row-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
	}

	.detail-main {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.detail-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.detail-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #0f0f0f;
	}

	.detail-sub {
		font-size: 0.75rem;
		color: #a1a1aa;
	}

	.detail-count {
		font-size: 0.8125rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.detail-count.success { color: #10b981; }
	.detail-count.danger { color: #ef4444; }
	.detail-count.neutral { color: #6b6b6b; }
	.detail-count.warning { color: #f59e0b; }
	.detail-count.accent { color: #8b5cf6; }

	.detail-expanded {
		padding: 0.5rem;
		background: #f9fafb;
		border-radius: 6px;
		animation: slide-down 0.2s ease;
	}

	@keyframes slide-down {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.boletos-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.boleto-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 36px;
		padding: 0.25rem 0.5rem;
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		color: #0f0f0f;
		font-variant-numeric: tabular-nums;
	}

	.boleto-num.danger {
		border-color: #fecaca;
		color: #dc2626;
	}

	.boleto-num.neutral {
		border-color: #d4d4d8;
		color: #52525b;
	}

	.boleto-num.warning {
		border-color: #fde68a;
		color: #d97706;
	}

	.regalos-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.regalo-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.375rem 0.5rem;
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 4px;
	}

	.regalo-desc {
		font-size: 0.8125rem;
		color: #0f0f0f;
	}

	.regalo-comunidad {
		font-size: 0.75rem;
		color: #a1a1aa;
	}

	/* Búsqueda Section */
	.busqueda-section {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 1rem 1.25rem;
	}

	.busqueda-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.busqueda-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: #f4f4f5;
		border-radius: 10px;
		color: #6b6b6b;
		flex-shrink: 0;
	}

	.busqueda-input-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.busqueda-input-wrapper label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #0f0f0f;
	}

	.busqueda-input-group {
		display: flex;
		gap: 0.5rem;
	}

	.busqueda-input {
		flex: 1;
		padding: 0.625rem 0.875rem;
		font-size: 0.9375rem;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		background: #fff;
		color: #0f0f0f;
		min-width: 0;
	}

	.busqueda-input:focus {
		outline: none;
		border-color: #0f0f0f;
	}

	.busqueda-input::placeholder {
		color: #a1a1aa;
	}

	.btn-buscar {
		display: inline-flex;
		align-items: center;
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		background: #0f0f0f;
		color: #fff;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.15s ease;
		white-space: nowrap;
	}

	.btn-buscar:hover:not(:disabled) {
		background: #27272a;
	}

	.btn-buscar:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Modal Búsqueda */
	.busqueda-modal {
		padding: 0.5rem 0;
	}

	.resultado-encontrado {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: center;
		text-align: center;
	}

	.resultado-numero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.resultado-numero .numero {
		font-size: 3rem;
		font-weight: 800;
		letter-spacing: -0.03em;
	}

	.estado-badge {
		display: inline-flex;
		padding: 0.375rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 100px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.resultado-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 320px;
		padding: 1.25rem;
		background: #f9fafb;
		border-radius: 12px;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		text-align: left;
	}

	.info-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #a1a1aa;
	}

	.info-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: #0f0f0f;
	}

	.resultado-no-encontrado {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
		padding: 1rem 0;
	}

	.no-encontrado-icon {
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f4f4f5;
		border-radius: 50%;
	}

	.no-encontrado-texto {
		font-size: 1rem;
		color: #0f0f0f;
		margin: 0;
	}

	.no-encontrado-texto strong {
		font-weight: 700;
	}

	.no-encontrado-sub {
		font-size: 0.875rem;
		color: #6b6b6b;
		margin: 0;
	}

	/* Estado Editor */
	.estado-editor {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		max-width: 400px;
		padding-top: 1rem;
		border-top: 1px solid #f4f4f5;
	}

	.editor-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #0f0f0f;
		text-align: center;
	}

	.estado-botones {
		display: flex;
		gap: 0.5rem;
		flex-wrap: nowrap;
		justify-content: center;
	}

	.estado-btn {
		padding: 0.5rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border: 1px solid #e5e5e5;
		border-radius: 100px;
		background: #fff;
		color: #6b6b6b;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.estado-btn:hover {
		border-color: #0f0f0f;
		color: #0f0f0f;
	}

	.estado-btn.active.pagado {
		background: #10b981;
		border-color: #10b981;
		color: #fff;
	}

	.estado-btn.active.no-pagado {
		background: #ef4444;
		border-color: #ef4444;
		color: #fff;
	}

	.estado-btn.active.regresado {
		background: #6b7280;
		border-color: #6b7280;
		color: #fff;
	}

	.estado-btn.active.perdido {
		background: #f59e0b;
		border-color: #f59e0b;
		color: #fff;
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
		.busqueda-content {
			flex-direction: column;
			align-items: stretch;
		}
		.busqueda-icon {
			align-self: flex-start;
		}
		.busqueda-input-group {
			flex-direction: column;
		}
		.btn-buscar {
			width: 100%;
			justify-content: center;
		}
		.estado-btn {
			padding: 0.5rem 0.625rem;
			font-size: 0.75rem;
		}
	}

	@media (max-width: 400px) {
		.metrics {
			grid-template-columns: 1fr;
		}
	}
</style>
<!-- Modal Resultado Búsqueda -->
<Modal show={modalActivo === 'busqueda'} title={resultadoBusqueda?.found ? `Boleto #${resultadoBusqueda.numero} encontrado` : 'Boleto no encontrado'} onClose={cerrarModal}>
	<div class="modal-content busqueda-modal">
		{#if resultadoBusqueda}
			{#if resultadoBusqueda.found}
				<div class="resultado-encontrado">
					<div class="resultado-numero" style="color: {getEstadoColor(resultadoBusqueda.estado)}">
						<span class="numero">#{resultadoBusqueda.numero}</span>
						<span class="estado-badge" style="background: {getEstadoColor(resultadoBusqueda.estado)}20; color: {getEstadoColor(resultadoBusqueda.estado)}">
							{getEstadoLabel(resultadoBusqueda.estado)}
						</span>
					</div>
					
					<div class="resultado-info">
						<div class="info-item">
							<span class="info-label">Centro</span>
							<span class="info-value">{resultadoBusqueda.centro}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Comunidad</span>
							<span class="info-value">{resultadoBusqueda.comunidad}</span>
						</div>
					</div>
					
					{#if puedeEditar}
						<div class="estado-editor">
							<span class="editor-label">Cambiar estado:</span>
							<div class="estado-botones">
								<button
									class="estado-btn"
									class:active={resultadoBusqueda.estado === 'pagado'}
									class:pagado={resultadoBusqueda.estado === 'pagado'}
									on:click={() => cambiarEstadoBoleto('pagado')}
								>
									Pagado
								</button>
								<button
									class="estado-btn"
									class:active={resultadoBusqueda.estado === 'no_pagado'}
									class:no-pagado={resultadoBusqueda.estado === 'no_pagado'}
									on:click={() => cambiarEstadoBoleto('no_pagado')}
								>
									No pagado
								</button>
								<button
									class="estado-btn"
									class:active={resultadoBusqueda.estado === 'regresado'}
									class:regresado={resultadoBusqueda.estado === 'regresado'}
									on:click={() => cambiarEstadoBoleto('regresado')}
								>
									Regresado
								</button>
								<button
									class="estado-btn"
									class:active={resultadoBusqueda.estado === 'perdido'}
									class:perdido={resultadoBusqueda.estado === 'perdido'}
									on:click={() => cambiarEstadoBoleto('perdido')}
								>
									Perdido
								</button>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="resultado-no-encontrado">
					<div class="no-encontrado-icon">
						<svg width="48" height="48" viewBox="0 0 16 16" fill="none">
							<path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 12a1 1 0 110-2 1 1 0 010 2zm0-3a1 1 0 01-1-1V4a1 1 0 012 0v4a1 1 0 01-1 1z" fill="#d4d4d8"/>
					</svg>
					</div>
					<p class="no-encontrado-texto">El boleto <strong>#{resultadoBusqueda.numero}</strong> no está registrado en el sistema.</p>
					<p class="no-encontrado-sub">Verifica que el número sea correcto o que el boleto haya sido agregado.</p>
				</div>
			{/if}
		{/if}
	</div>
</Modal>
