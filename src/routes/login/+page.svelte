<script lang="ts">
	import { auth } from '$lib/auth';
	import { goto } from '$app/navigation';

	let username = '';
	let error = '';
	let cargando = false;

	async function login() {
		error = '';
		cargando = true;
		const err = await auth.login(username);
		cargando = false;
		if (err) {
			error = err;
		} else {
			goto('/');
		}
	}
</script>

<svelte:head>
	<title>Iniciar sesión · Boletos</title>
</svelte:head>

<div class="login-page">
	<div class="login-card">
		<div class="brand">
			<span class="brand-dot"></span>
			Boletos
		</div>

		<div class="card-header">
			<h1>Iniciar sesión</h1>
			<p class="subtitle">Ingresa tu nombre de usuario para continuar</p>
		</div>

		<form on:submit|preventDefault={login}>
			<div class="field">
				<label class="field-label" for="username">Usuario</label>
				<input
					id="username"
					type="text"
					class="field-input"
					class:field-error={!!error}
					placeholder="Nombre de usuario"
					bind:value={username}
					autocomplete="off"
					autocapitalize="none"
					spellcheck="false"
					disabled={cargando}
				/>
				{#if error}
					<span class="error-msg">{error}</span>
				{/if}
			</div>

			<button type="submit" class="btn-login" disabled={cargando || !username.trim()}>
				{cargando ? 'Verificando...' : 'Entrar'}
			</button>
		</form>
	</div>
</div>

<style>
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		background: #f7f7f8;
		-webkit-font-smoothing: antialiased;
	}

	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(button, input) {
		font-family: inherit;
	}

	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: #f7f7f8;
	}

	.login-card {
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 16px;
		padding: 2rem;
		width: 100%;
		max-width: 360px;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		box-shadow: 0 4px 32px rgba(0, 0, 0, 0.06);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #0f0f0f;
		letter-spacing: -0.01em;
	}

	.brand-dot {
		width: 7px;
		height: 7px;
		background: #0f0f0f;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.card-header {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	h1 {
		font-size: 1.375rem;
		font-weight: 700;
		color: #0f0f0f;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 0.875rem;
		color: #6b6b6b;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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
		padding: 0.75rem 0.875rem;
		border: 1px solid #e5e5e5;
		border-radius: 10px;
		font-size: 0.9375rem;
		color: #0f0f0f;
		outline: none;
		transition: border-color 0.15s;
		background: #fff;
	}

	.field-input:focus {
		border-color: #0f0f0f;
	}

	.field-input.field-error {
		border-color: #ef4444;
	}

	.field-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-msg {
		font-size: 0.8125rem;
		color: #ef4444;
	}

	.btn-login {
		width: 100%;
		padding: 0.75rem;
		background: #0f0f0f;
		color: #fff;
		border: none;
		border-radius: 10px;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, opacity 0.15s;
	}

	.btn-login:hover:not(:disabled) {
		background: #27272a;
	}

	.btn-login:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
