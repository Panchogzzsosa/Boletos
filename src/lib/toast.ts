import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	message: string;
	type: 'error' | 'success' | 'info';
	duration?: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	return {
		subscribe,
		show: (message: string, type: Toast['type'] = 'info', duration = 3000) => {
			const id = Math.random().toString(36).substring(2, 9);
			const toast: Toast = { id, message, type, duration };
			update(toasts => [...toasts, toast]);
			return id;
		},
		remove: (id: string) => {
			update(toasts => toasts.filter(t => t.id !== id));
		},
		error: (message: string, duration = 3000) => {
			console.log('[Toast] Error:', message);
			const id = Math.random().toString(36).substring(2, 9);
			const toast: Toast = { id, message, type: 'error', duration };
			update(toasts => [...toasts, toast]);
			return id;
		},
		success: (message: string, duration = 3000) => {
			const id = Math.random().toString(36).substring(2, 9);
			const toast: Toast = { id, message, type: 'success', duration };
			update(toasts => [...toasts, toast]);
			return id;
		}
	};
}

export const toast = createToastStore();
