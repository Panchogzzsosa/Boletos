<script lang="ts">
	import { centros, estadisticasCentros } from '$lib/stores';
	import { puedeEditar } from '$lib/auth';
	import CentroCard from '$lib/components/CentroCard.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let nuevoCentroNombre = '';
	let centroEditando: { id: string; nombre: string } | null = null;
	let nuevoNombreCentro = '';

	let comunidadModal = {
		show: false,
		centroId: '',
		nombre: ''
	};

	function agregarCentro() {
		if (nuevoCentroNombre.trim()) {
			centros.agregarCentro(nuevoCentroNombre.trim());
			nuevoCentroNombre = '';
		}
	}

	function iniciarEdicion(centro: { id: string; nombre: string }) {
		centroEditando = { ...centro };
		nuevoNombreCentro = centro.nombre;
	}

	function guardarEdicion() {
		if (centroEditando && nuevoNombreCentro.trim()) {
			centros.editarCentro(centroEditando.id, nuevoNombreCentro.trim());
			centroEditando = null;
			nuevoNombreCentro = '';
		}
	}

	function cancelarEdicion() {
		centroEditando = null;
		nuevoNombreCentro = '';
	}

	function abrirModalComunidad(centroId: string) {
		comunidadModal = { show: true, centroId, nombre: '' };
	}

	function cerrarModalComunidad() {
		comunidadModal.show = false;
		comunidadModal.nombre = '';
	}

	function agregarComunidad() {
		if (comunidadModal.nombre.trim()) {
			centros.agregarComunidad(comunidadModal.centroId, comunidadModal.nombre.trim());
			cerrarModalComunidad();
		}
	}

	function eliminarCentro(id: string) {
		if (confirm('¿Eliminar este centro? Se perderán todas sus comunidades, boletos y regalos.')) {
			centros.eliminarCentro(id);
		}
	}
</script>

<svelte:head>
	<title>Centros · Boletos</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<div>
			<h1>Centros</h1>
			<p class="subtitle">{$centros.length} centro{$centros.length !== 1 ? 's' : ''} registrado{$centros.length !== 1 ? 's' : ''}</p>
		</div>
	</header>

	{#if $puedeEditar}
	<div class="add-bar">
		<input
			type="text"
			class="add-input"
			placeholder="Nombre del nuevo centro..."
			bind:value={nuevoCentroNombre}
			on:keypress={(e) => e.key === 'Enter' && agregarCentro()}
		/>
		<button class="btn-add" on:click={agregarCentro}>Agregar</button>
	</div>
	{/if}

	{#if $centros.length > 0}
		<div class="centros-grid">
			{#each $centros as centro (centro.id)}
				{@const stats = $estadisticasCentros.find(s => s.centroId === centro.id)}
				<CentroCard
					{centro}
					{stats}
					onEdit={() => iniciarEdicion(centro)}
					onDelete={() => eliminarCentro(centro.id)}
					onSelect={() => window.location.href = `/centros/${centro.id}`}
					puedeEditar={$puedeEditar}
				onAddComunidad={() => abrirModalComunidad(centro.id)}
				/>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<p class="empty-title">Sin centros</p>
			<p class="empty-hint">Agrega el primer centro usando el campo de arriba</p>
		</div>
	{/if}
</div>

<!-- Modal editar -->
<Modal show={centroEditando !== null} title="Editar centro" onClose={cancelarEdicion}>
	<div class="modal-form">
		<label class="field">
			<span class="field-label">Nombre</span>
			<input
				type="text"
				class="field-input"
				bind:value={nuevoNombreCentro}
				on:keypress={(e) => e.key === 'Enter' && guardarEdicion()}
			/>
		</label>
		<div class="modal-actions">
			<button class="btn-ghost" on:click={cancelarEdicion}>Cancelar</button>
			<button class="btn-dark" on:click={guardarEdicion}>Guardar</button>
		</div>
	</div>
</Modal>

<!-- Modal nueva comunidad -->
<Modal show={comunidadModal.show} title="Nueva comunidad" onClose={cerrarModalComunidad}>
	<div class="modal-form">
		<label class="field">
			<span class="field-label">Nombre</span>
			<input
				type="text"
				class="field-input"
				bind:value={comunidadModal.nombre}
				on:keypress={(e) => e.key === 'Enter' && agregarComunidad()}
			/>
		</label>
		<div class="modal-actions">
			<button class="btn-ghost" on:click={cerrarModalComunidad}>Cancelar</button>
			<button class="btn-dark" on:click={agregarComunidad}>Agregar</button>
		</div>
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

	.add-bar {
		display: flex;
		gap: 0.5rem;
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 0.75rem 1rem;
		transition: border-color 0.15s;
	}

	.add-bar:focus-within {
		border-color: #0f0f0f;
	}

	.add-input {
		flex: 1;
		border: none;
		outline: none;
		font-size: 0.9375rem;
		color: #0f0f0f;
		background: transparent;
		min-width: 0;
	}

	.add-input::placeholder {
		color: #a1a1aa;
	}

	.btn-add {
		padding: 0.4375rem 0.875rem;
		background: #0f0f0f;
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: background 0.15s;
		flex-shrink: 0;
	}

	.btn-add:hover {
		background: #27272a;
	}

	.centros-grid {
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

	/* Modal */
	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

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

	.field-input:focus {
		border-color: #0f0f0f;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

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

	.btn-ghost:hover {
		background: #f4f4f5;
		color: #0f0f0f;
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
	}

	.btn-dark:hover {
		background: #27272a;
	}

	@media (max-width: 600px) {
		.centros-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
