<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth, esAdmin } from '$lib/auth';
	import type { Usuario } from '$lib/auth';

	let usuarios: Usuario[] = [];
	let cargando = true;

	let nuevoUsername = '';
	let nuevoRol: Usuario['role'] = 'editor';
	let agregando = false;
	let errorAgregar = '';

	$: if (!$auth.cargando && $auth.usuario && $auth.usuario.role !== 'admin') {
		goto('/');
	}

	onMount(async () => {
		usuarios = await auth.listarUsuarios();
		cargando = false;
	});

	async function agregar() {
		errorAgregar = '';
		agregando = true;
		const err = await auth.agregarUsuario(nuevoUsername, nuevoRol);
		if (err) {
			errorAgregar = err;
		} else {
			nuevoUsername = '';
			nuevoRol = 'editor';
			usuarios = await auth.listarUsuarios();
		}
		agregando = false;
	}

	async function eliminar(id: string) {
		if (!confirm('¿Eliminar este usuario?')) return;
		await auth.eliminarUsuario(id);
		usuarios = await auth.listarUsuarios();
	}

	async function cambiarRol(id: string, role: Usuario['role']) {
		await auth.cambiarRol(id, role);
		usuarios = await auth.listarUsuarios();
	}

	const roleLabels: Record<Usuario['role'], string> = {
		admin: 'Admin',
		editor: 'Editor',
		viewer: 'Solo ver'
	};

	function formatAcceso(iso: string | undefined): string {
		if (!iso) return 'Nunca';
		const fecha = new Date(iso);
		const ahora = new Date();
		const diff = ahora.getTime() - fecha.getTime();
		const mins = Math.floor(diff / 60000);
		const horas = Math.floor(diff / 3600000);
		const dias = Math.floor(diff / 86400000);
		if (mins < 1) return 'Hace un momento';
		if (mins < 60) return `Hace ${mins} min`;
		if (horas < 24) return `Hace ${horas} h`;
		if (dias === 1) return 'Ayer';
		if (dias < 7) return `Hace ${dias} días`;
		return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Usuarios · Boletos</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<div>
			<h1>Usuarios</h1>
			<p class="subtitle">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}</p>
		</div>
	</header>

	<!-- Agregar usuario -->
	<div class="add-card">
		<p class="add-title">Nuevo usuario</p>
		<div class="add-row">
			<input
				type="text"
				class="add-input"
				class:add-error={!!errorAgregar}
				placeholder="Nombre de usuario..."
				bind:value={nuevoUsername}
				on:keypress={(e) => e.key === 'Enter' && agregar()}
				autocomplete="off"
				autocapitalize="none"
				disabled={agregando}
			/>
			<div class="role-tabs">
				{#each Object.entries(roleLabels) as [val, label]}
					<button
						class="role-tab"
						class:active={nuevoRol === val}
						on:click={() => nuevoRol = val as Usuario['role']}
					>{label}</button>
				{/each}
			</div>
			<button class="btn-add" on:click={agregar} disabled={agregando || !nuevoUsername.trim()}>
				{agregando ? '...' : 'Agregar'}
			</button>
		</div>
		{#if errorAgregar}
			<p class="error-text">{errorAgregar}</p>
		{/if}
	</div>

	<!-- Lista de usuarios -->
	{#if cargando}
		<div class="loading-row">
			<div class="spinner"></div>
		</div>
	{:else if usuarios.length > 0}
		<div class="users-list">
			{#each usuarios as u (u.id)}
				<div class="user-row">
					<div class="user-info">
						<span class="user-avatar">{u.username[0].toUpperCase()}</span>
						<div class="user-meta">
							<span class="user-name">{u.username}</span>
							<span class="user-acceso">{formatAcceso(u.ultimo_acceso)}</span>
						</div>
					</div>

					<div class="user-role-tabs">
						{#each Object.entries(roleLabels) as [val, label]}
							<button
								class="role-tab sm"
								class:active={u.role === val}
								on:click={() => cambiarRol(u.id, val as Usuario['role'])}
								disabled={u.id === $auth.usuario?.id && val !== u.role && u.role === 'admin'}
							>{label}</button>
						{/each}
					</div>

					<button
						class="delete-btn"
						on:click={() => eliminar(u.id)}
						disabled={u.id === $auth.usuario?.id}
						title={u.id === $auth.usuario?.id ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
					>
						<svg width="13" height="13" viewBox="0 0 16 16" fill="none">
							<path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" fill="currentColor"/>
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 640px;
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

	/* Add card */
	.add-card {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 1rem 1.125rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.add-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #0f0f0f;
	}

	.add-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.add-input {
		flex: 1;
		min-width: 140px;
		padding: 0.5rem 0.75rem;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		font-size: 0.9375rem;
		color: #0f0f0f;
		outline: none;
		transition: border-color 0.15s;
		background: #fff;
	}

	.add-input:focus {
		border-color: #0f0f0f;
	}

	.add-input.add-error {
		border-color: #ef4444;
	}

	.add-input:disabled {
		opacity: 0.6;
	}

	.error-text {
		font-size: 0.8125rem;
		color: #ef4444;
	}

	.btn-add {
		padding: 0.5rem 1rem;
		background: #0f0f0f;
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, opacity 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.btn-add:hover:not(:disabled) {
		background: #27272a;
	}

	.btn-add:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Role tabs */
	.role-tabs {
		display: flex;
		background: #f4f4f5;
		border-radius: 8px;
		padding: 2px;
		gap: 2px;
		flex-shrink: 0;
	}

	.role-tab {
		padding: 0.375rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #6b6b6b;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.role-tab:hover {
		color: #0f0f0f;
	}

	.role-tab.active {
		background: #fff;
		color: #0f0f0f;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.role-tab.sm {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
	}

	/* Users list */
	.users-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.user-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.875rem 1rem;
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		transition: border-color 0.15s;
	}

	.user-row:hover {
		border-color: #d4d4d8;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		background: #0f0f0f;
		color: #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8125rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.user-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #0f0f0f;
		letter-spacing: -0.01em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-role-tabs {
		display: flex;
		background: #f4f4f5;
		border-radius: 8px;
		padding: 2px;
		gap: 2px;
		flex-shrink: 0;
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

	.delete-btn:hover:not(:disabled) {
		background: #fef2f2;
		color: #ef4444;
	}

	.delete-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	/* Loading */
	.loading-row {
		display: flex;
		justify-content: center;
		padding: 3rem;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #e5e5e5;
		border-top-color: #0f0f0f;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (max-width: 600px) {
		.add-row {
			flex-direction: column;
			align-items: stretch;
		}

		.role-tabs, .user-role-tabs {
			justify-content: center;
		}

		.btn-add {
			text-align: center;
		}
	}
	.user-meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.user-acceso {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #a1a1aa;
	}
</style>