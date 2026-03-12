import { writable, derived, get } from 'svelte/store';
import { supabase } from './supabase';
import type { Centro, Comunidad, Boleto, Regalo, EstadisticasCentro, EstadisticasComunidad, Transaccion, TipoTransaccion, ConceptoTransaccion } from './types';
import { PRECIO_BOLETO } from './types';

function createCentrosStore() {
	const { subscribe, set, update } = writable<Centro[]>([]);

	return {
		subscribe,

		// Cargar todos los datos desde Supabase
		cargarDatos: async () => {
			const [
				{ data: centrosData },
				{ data: comunidadesData },
				{ data: boletosData },
				{ data: regalosData }
			] = await Promise.all([
				supabase.from('centros').select('*').order('created_at'),
				supabase.from('comunidades').select('*').order('created_at'),
				supabase.from('boletos').select('*').order('numero'),
				supabase.from('regalos').select('*').order('fecha', { ascending: false })
			]);

			const centros: Centro[] = (centrosData ?? []).map(c => ({
				id: c.id,
				nombre: c.nombre,
				comunidades: (comunidadesData ?? [])
					.filter(com => com.centro_id === c.id)
					.map(com => ({
						id: com.id,
						nombre: com.nombre,
						centroId: com.centro_id,
						boletos: (boletosData ?? [])
							.filter(b => b.comunidad_id === com.id)
							.map(b => ({
								id: b.id,
								numero: b.numero,
								estado: b.estado as Boleto['estado'],
								comunidadId: b.comunidad_id
							})),
						regalos: (regalosData ?? [])
							.filter(r => r.comunidad_id === com.id)
							.map(r => ({
								id: r.id,
								descripcion: r.descripcion,
								comunidadId: r.comunidad_id,
								fecha: r.fecha
							}))
					}))
			}));

			set(centros);
		},

		// Agregar centro
		agregarCentro: async (nombre: string) => {
			const { data, error } = await supabase
				.from('centros')
				.insert({ nombre })
				.select()
				.single();
			if (error || !data) { console.error(error); return; }
			update(centros => [...centros, { id: data.id, nombre: data.nombre, comunidades: [] }]);
		},

		// Eliminar centro
		eliminarCentro: async (id: string) => {
			const { error } = await supabase.from('centros').delete().eq('id', id);
			if (error) { console.error(error); return; }
			update(centros => centros.filter(c => c.id !== id));
		},

		// Editar centro
		editarCentro: async (id: string, nombre: string) => {
			const { error } = await supabase.from('centros').update({ nombre }).eq('id', id);
			if (error) { console.error(error); return; }
			update(centros => centros.map(c => c.id === id ? { ...c, nombre } : c));
		},

		// Agregar comunidad
		agregarComunidad: async (centroId: string, nombre: string) => {
			const { data, error } = await supabase
				.from('comunidades')
				.insert({ nombre, centro_id: centroId })
				.select()
				.single();
			if (error || !data) { console.error(error); return; }

			const nueva: Comunidad = {
				id: data.id,
				nombre: data.nombre,
				centroId: data.centro_id,
				boletos: [],
				regalos: []
			};

			update(centros => centros.map(c =>
				c.id === centroId ? { ...c, comunidades: [...c.comunidades, nueva] } : c
			));
		},

		// Eliminar comunidad
		eliminarComunidad: async (centroId: string, comunidadId: string) => {
			const { error } = await supabase.from('comunidades').delete().eq('id', comunidadId);
			if (error) { console.error(error); return; }
			update(centros => centros.map(c =>
				c.id === centroId
					? { ...c, comunidades: c.comunidades.filter(com => com.id !== comunidadId) }
					: c
			));
		},

		// Editar comunidad
		editarComunidad: async (centroId: string, comunidadId: string, nombre: string) => {
			const { error } = await supabase.from('comunidades').update({ nombre }).eq('id', comunidadId);
			if (error) { console.error(error); return; }
			update(centros => centros.map(c =>
				c.id === centroId
					? { ...c, comunidades: c.comunidades.map(com => com.id === comunidadId ? { ...com, nombre } : com) }
					: c
			));
		},

		// Agregar boletos en rango o individual
		agregarBoletos: async (centroId: string, comunidadId: string, numeros: number[]) => {
			// Obtener todos los boletos existentes de TODAS las comunidades (validación global)
			const centrosData = get({ subscribe });
			const boletosExistentesGlobales: number[] = [];
			
			for (const centro of centrosData) {
				for (const com of centro.comunidades) {
					for (const boleto of com.boletos) {
						boletosExistentesGlobales.push(boleto.numero);
					}
				}
			}

			// Filtrar números que ya existen globalmente
			const numerosNuevos = numeros.filter(n => !boletosExistentesGlobales.includes(n));
			const numerosDuplicados = numeros.filter(n => boletosExistentesGlobales.includes(n));
			
			// Si todos los números ya existen, no hacer nada
			if (numerosNuevos.length === 0) {
				return { agregados: [], duplicados: numerosDuplicados };
			}

			const rows = numerosNuevos.map(numero => ({
				numero,
				estado: 'no_pagado',
				comunidad_id: comunidadId
			}));

			const { data, error } = await supabase.from('boletos').insert(rows).select();
			if (error || !data) { console.error(error); return; }

			const nuevos: Boleto[] = data.map(b => ({
				id: b.id,
				numero: b.numero,
				estado: b.estado as Boleto['estado'],
				comunidadId: b.comunidad_id
			}));

			update(centros => centros.map(c =>
				c.id !== centroId ? c : {
					...c,
					comunidades: c.comunidades.map(com =>
						com.id !== comunidadId ? com : {
							...com,
							boletos: [...com.boletos, ...nuevos]
						}
					)
				}
			));

			// Retornar números que fueron agregados y duplicados
			return { agregados: numerosNuevos, duplicados: numerosDuplicados };
		},

		// Cambiar estado de boleto
		cambiarEstadoBoleto: async (centroId: string, comunidadId: string, boletoId: string, estado: Boleto['estado']) => {
			const { error } = await supabase.from('boletos').update({ estado }).eq('id', boletoId);
			if (error) { console.error(error); return; }
			update(centros => centros.map(c =>
				c.id !== centroId ? c : {
					...c,
					comunidades: c.comunidades.map(com =>
						com.id !== comunidadId ? com : {
							...com,
							boletos: com.boletos.map(b => b.id === boletoId ? { ...b, estado } : b)
						}
					)
				}
			));
		},

		// Eliminar boleto
		eliminarBoleto: async (centroId: string, comunidadId: string, boletoId: string) => {
			const { error } = await supabase.from('boletos').delete().eq('id', boletoId);
			if (error) { console.error(error); return; }
			update(centros => centros.map(c =>
				c.id !== centroId ? c : {
					...c,
					comunidades: c.comunidades.map(com =>
						com.id !== comunidadId ? com : {
							...com,
							boletos: com.boletos.filter(b => b.id !== boletoId)
						}
					)
				}
			));
		},

		// Agregar regalo
		agregarRegalo: async (centroId: string, comunidadId: string, descripcion: string) => {
			const { data, error } = await supabase
				.from('regalos')
				.insert({ descripcion, comunidad_id: comunidadId })
				.select()
				.single();
			if (error || !data) { console.error(error); return; }

			const nuevo: Regalo = {
				id: data.id,
				descripcion: data.descripcion,
				comunidadId: data.comunidad_id,
				fecha: data.fecha
			};

			update(centros => centros.map(c =>
				c.id !== centroId ? c : {
					...c,
					comunidades: c.comunidades.map(com =>
						com.id !== comunidadId ? com : {
							...com,
							regalos: [...com.regalos, nuevo]
						}
					)
				}
			));
		},

		// Eliminar regalo
		eliminarRegalo: async (centroId: string, comunidadId: string, regaloId: string) => {
			const { error } = await supabase.from('regalos').delete().eq('id', regaloId);
			if (error) { console.error(error); return; }
			update(centros => centros.map(c =>
				c.id !== centroId ? c : {
					...c,
					comunidades: c.comunidades.map(com =>
						com.id !== comunidadId ? com : {
							...com,
							regalos: com.regalos.filter(r => r.id !== regaloId)
						}
					)
				}
			));
		}
	};
}

export const centros = createCentrosStore();

// Store derivado para estadísticas por centro
export const estadisticasCentros = derived(centros, $centros => {
	return $centros.map(c => {
		const totalBoletos = c.comunidades.reduce((acc, com) => acc + com.boletos.length, 0);
		const boletosPagados = c.comunidades.reduce(
			(acc, com) => acc + com.boletos.filter(b => b.estado === 'pagado').length, 0
		);
		const boletosNoPagados = c.comunidades.reduce(
			(acc, com) => acc + com.boletos.filter(b => b.estado === 'no_pagado').length, 0
		);
		const boletosRegresados = c.comunidades.reduce(
			(acc, com) => acc + com.boletos.filter(b => b.estado === 'regresado').length, 0
		);
		const boletosPerdidos = c.comunidades.reduce(
			(acc, com) => acc + com.boletos.filter(b => b.estado === 'perdido').length, 0
		);
		const totalRegalos = c.comunidades.reduce((acc, com) => acc + com.regalos.length, 0);

		return {
			centroId: c.id,
			nombreCentro: c.nombre,
			totalBoletos,
			boletosPagados,
			boletosNoPagados,
			boletosRegresados,
			boletosPerdidos,
			totalRecaudado: boletosPagados * PRECIO_BOLETO,
			totalPorCobrar: boletosNoPagados * PRECIO_BOLETO,
			totalRegalos
		} satisfies EstadisticasCentro;
	});
});

// Store derivado para estadísticas por comunidad
export const estadisticasComunidades = derived(centros, $centros => {
	const stats: EstadisticasComunidad[] = [];
	$centros.forEach(c => {
		c.comunidades.forEach(com => {
			const boletosPagados = com.boletos.filter(b => b.estado === 'pagado').length;
			const boletosNoPagados = com.boletos.filter(b => b.estado === 'no_pagado').length;
			const boletosRegresados = com.boletos.filter(b => b.estado === 'regresado').length;
			const boletosPerdidos = com.boletos.filter(b => b.estado === 'perdido').length;

			stats.push({
				comunidadId: com.id,
				nombreComunidad: com.nombre,
				nombreCentro: c.nombre,
				totalBoletos: com.boletos.length,
				boletosPagados,
				boletosNoPagados,
				boletosRegresados,
				boletosPerdidos,
				totalRecaudado: boletosPagados * PRECIO_BOLETO,
				totalPorCobrar: boletosNoPagados * PRECIO_BOLETO,
				totalRegalos: com.regalos.length
			});
		});
	});
	return stats;
});

// Store para transacciones de caja
function createTransaccionesStore() {
	const { subscribe, set, update } = writable<Transaccion[]>([]);

	return {
		subscribe,

		// Cargar transacciones desde Supabase
		cargarTransacciones: async () => {
			const { data, error } = await supabase
				.from('transacciones')
				.select('*')
				.order('created_at', { ascending: false });
			
			if (error) {
				console.error('Error cargando transacciones:', error);
				return;
			}

			const transacciones: Transaccion[] = (data ?? []).map(t => ({
				id: t.id,
				tipo: t.tipo as TipoTransaccion,
				concepto: t.concepto as ConceptoTransaccion,
				monto: t.monto,
				descripcion: t.descripcion,
				fecha: t.fecha,
				createdAt: t.created_at
			}));

			set(transacciones);
		},

		// Agregar transacción
		agregarTransaccion: async (
			tipo: TipoTransaccion,
			concepto: ConceptoTransaccion,
			monto: number,
			descripcion: string,
			fecha: string = new Date().toISOString().split('T')[0]
		) => {
			const { data, error } = await supabase
				.from('transacciones')
				.insert({ tipo, concepto, monto, descripcion, fecha })
				.select()
				.single();

			if (error || !data) {
				console.error('Error agregando transacción:', error);
				return null;
			}

			const nueva: Transaccion = {
				id: data.id,
				tipo: data.tipo,
				concepto: data.concepto,
				monto: data.monto,
				descripcion: data.descripcion,
				fecha: data.fecha,
				createdAt: data.created_at
			};

			update(transacciones => [nueva, ...transacciones]);
			return nueva;
		},

		// Eliminar transacción
		eliminarTransaccion: async (id: string) => {
			const { error } = await supabase
				.from('transacciones')
				.delete()
				.eq('id', id);

			if (error) {
				console.error('Error eliminando transacción:', error);
				return;
			}

			update(transacciones => transacciones.filter(t => t.id !== id));
		},

		// Sincronizar entradas de boletos automáticamente
		sincronizarEntradasBoletos: async (totalRecaudado: number) => {
			// Verificar si ya existe una entrada de boletos por hoy
			const hoy = new Date().toISOString().split('T')[0];
			const { data: existentes } = await supabase
				.from('transacciones')
				.select('*')
				.eq('concepto', 'boletos')
				.eq('fecha', hoy);

			const totalExistente = (existentes ?? []).reduce((acc, t) => acc + t.monto, 0);
			
			// Si hay diferencia, crear nueva transacción
			if (totalRecaudado > totalExistente) {
				const diferencia = totalRecaudado - totalExistente;
				await supabase
					.from('transacciones')
					.insert({
						tipo: 'entrada',
						concepto: 'boletos',
						monto: diferencia,
						descripcion: 'Venta de boletos',
						fecha: hoy
					});
			}
		}
	};
}

export const transacciones = createTransaccionesStore();

// Store derivado para resumen de caja
export const resumenCaja = derived(
	[estadisticasCentros, transacciones],
	([$estadisticasCentros, $transacciones]) => {
		// Entradas automáticas de boletos pagados
		const entradasBoletos = $estadisticasCentros.reduce((acc, s) => acc + s.totalRecaudado, 0);
		
		// Entradas manuales (no boletos)
		const entradasManuales = $transacciones
			.filter(t => t.tipo === 'entrada' && t.concepto !== 'boletos')
			.reduce((acc, t) => acc + t.monto, 0);
		
		// Salidas
		const salidas = $transacciones
			.filter(t => t.tipo === 'salida')
			.reduce((acc, t) => acc + t.monto, 0);

		const totalEntradas = entradasBoletos + entradasManuales;

		return {
			totalEntradas,
			totalSalidas: salidas,
			balance: totalEntradas - salidas,
			entradasBoletos,
			entradasManuales
		};
	}
);
