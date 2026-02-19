import { writable, derived } from 'svelte/store';
import { supabase } from './supabase';

export interface Usuario {
	id: string;
	username: string;
	role: 'admin' | 'editor' | 'viewer';
	ultimo_acceso?: string;
}

interface AuthState {
	usuario: Usuario | null;
	cargando: boolean;
}

function createAuthStore() {
	const { subscribe, set } = writable<AuthState>({
		usuario: null,
		cargando: true
	});

	return {
		subscribe,

		cargarSesion: () => {
			try {
				const saved = localStorage.getItem('boletos_session');
				if (saved) {
					const usuario = JSON.parse(saved) as Usuario;
					set({ usuario, cargando: false });
				} else {
					set({ usuario: null, cargando: false });
				}
			} catch {
				localStorage.removeItem('boletos_session');
				set({ usuario: null, cargando: false });
			}
		},

		login: async (username: string): Promise<string | null> => {
			const clean = username.trim().toLowerCase();
			if (!clean) return 'Ingresa un nombre de usuario';

			const { data, error } = await supabase
				.from('usuarios')
				.select('*')
				.eq('username', clean)
				.single();

			if (error || !data) return 'Usuario no encontrado';

			// Registrar último acceso
			await supabase
				.from('usuarios')
				.update({ ultimo_acceso: new Date().toISOString() })
				.eq('id', data.id);

			const usuario: Usuario = {
				id: data.id,
				username: data.username,
				role: data.role as Usuario['role']
			};

			localStorage.setItem('boletos_session', JSON.stringify(usuario));
			set({ usuario, cargando: false });
			return null;
		},

		logout: () => {
			localStorage.removeItem('boletos_session');
			set({ usuario: null, cargando: false });
		},

		listarUsuarios: async (): Promise<Usuario[]> => {
			const { data } = await supabase
				.from('usuarios')
				.select('*')
				.order('created_at');
			return (data ?? []).map(u => ({
				id: u.id,
				username: u.username,
				role: u.role as Usuario['role'],
				ultimo_acceso: u.ultimo_acceso ?? undefined
			}));
		},

		agregarUsuario: async (username: string, role: Usuario['role']): Promise<string | null> => {
			const clean = username.trim().toLowerCase();
			if (!clean) return 'Ingresa un nombre de usuario';
			const { error } = await supabase
				.from('usuarios')
				.insert({ username: clean, role });
			if (error) {
				if (error.code === '23505') return 'Ese usuario ya existe';
				return 'Error al crear usuario';
			}
			return null;
		},

		eliminarUsuario: async (id: string): Promise<void> => {
			await supabase.from('usuarios').delete().eq('id', id);
		},

		cambiarRol: async (id: string, role: Usuario['role']): Promise<void> => {
			await supabase.from('usuarios').update({ role }).eq('id', id);
		}
	};
}

export const auth = createAuthStore();

export const puedeEditar = derived(
	auth,
	$auth => $auth.usuario?.role === 'admin' || $auth.usuario?.role === 'editor'
);

export const esAdmin = derived(
	auth,
	$auth => $auth.usuario?.role === 'admin'
);
