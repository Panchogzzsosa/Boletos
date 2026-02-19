<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { centros } from '$lib/stores';
	import { auth, esAdmin } from '$lib/auth';

	let centrosCargados = false;

	onMount(() => {
		auth.cargarSesion();
	});

	// Cargar datos cuando el usuario esté autenticado
	$: if ($auth.usuario && !centrosCargados) {
		centrosCargados = true;
		centros.cargarDatos();
	}

	// Redirigir a login si no está autenticado
	$: if (!$auth.cargando && !$auth.usuario && $page.url.pathname !== '/login') {
		goto('/login');
	}

	// Redirigir al inicio si ya está autenticado y va a /login
	$: if (!$auth.cargando && $auth.usuario && $page.url.pathname === '/login') {
		goto('/');
	}

	function logout() {
		centrosCargados = false;
		auth.logout();
	}

	const navItems = [
		{ href: '/', label: 'Inicio' },
		{ href: '/centros', label: 'Centros' }
	];
</script>

{#if $page.url.pathname === '/login'}
	<slot />
{:else}
	<div class="app">
		<nav class="navbar">
			<a href="/" class="nav-brand">
				<span class="brand-dot"></span>
				Boletos
			</a>
			<ul class="nav-links">
				{#each navItems as item}
					<li>
						<a
							href={item.href}
							class:active={$page.url.pathname === item.href}
						>{item.label}</a>
					</li>
				{/each}
				{#if $esAdmin}
					<li>
						<a
							href="/usuarios"
							class:active={$page.url.pathname === '/usuarios'}
						>Usuarios</a>
					</li>
				{/if}
			</ul>

			{#if $auth.usuario}
				<div class="nav-user">
					<span class="user-chip">{$auth.usuario.username}</span>
					<button class="logout-btn" on:click={logout} title="Cerrar sesión">
						<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
							<path d="M2 2.75C2 1.784 2.784 1 3.75 1h4.5a.75.75 0 010 1.5h-4.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h4.5a.75.75 0 010 1.5h-4.5A1.75 1.75 0 012 13.25V2.75zm10.44 4.5H6.75a.75.75 0 000 1.5h5.69l-1.97 1.97a.75.75 0 101.06 1.06l3.25-3.25a.75.75 0 000-1.06l-3.25-3.25a.75.75 0 10-1.06 1.06l1.97 1.97z" fill="currentColor"/>
						</svg>
					</button>
				</div>
			{/if}
		</nav>

		<main class="main-content">
			{#if $auth.cargando}
				<div class="loading-state">
					<div class="spinner"></div>
				</div>
			{:else if $auth.usuario}
				<slot />
			{/if}
		</main>
	</div>
{/if}

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		background: #f7f7f8;
		color: #0f0f0f;
		line-height: 1.5;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	:global(h1, h2, h3, h4) {
		letter-spacing: -0.02em;
	}

	:global(button, input, select, textarea) {
		font-family: inherit;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.navbar {
		position: sticky;
		top: 0;
		z-index: 50;
		height: 52px;
		background: rgba(247, 247, 248, 0.85);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid #e5e5e5;
		padding: 0 1.5rem;
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.nav-brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #0f0f0f;
		text-decoration: none;
		letter-spacing: -0.01em;
		flex-shrink: 0;
	}

	.brand-dot {
		width: 7px;
		height: 7px;
		background: #0f0f0f;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.nav-links {
		list-style: none;
		display: flex;
		gap: 0.125rem;
		flex: 1;
	}

	.nav-links a {
		display: block;
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b6b6b;
		text-decoration: none;
		border-radius: 7px;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.nav-links a:hover {
		color: #0f0f0f;
		background: rgba(0, 0, 0, 0.06);
	}

	.nav-links a.active {
		color: #0f0f0f;
		background: rgba(0, 0, 0, 0.08);
	}

	.nav-user {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.user-chip {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.625rem;
		background: #f4f4f5;
		border-radius: 100px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #0f0f0f;
		letter-spacing: -0.01em;
	}

	.logout-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		color: #6b6b6b;
		transition: background 0.15s, color 0.15s;
	}

	.logout-btn:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #0f0f0f;
	}

	.main-content {
		flex: 1;
		padding: 2.5rem 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid #e5e5e5;
		border-top-color: #0f0f0f;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (max-width: 640px) {
		.navbar {
			padding: 0 1rem;
			gap: 1rem;
		}

		.main-content {
			padding: 1.5rem 1rem;
		}

		.user-chip {
			display: none;
		}
	}
</style>
