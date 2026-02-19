// Tipos de datos para el sistema de boletos y regalos

export type EstadoBoleto = 'pagado' | 'no_pagado' | 'regresado';

export interface Boleto {
	id: string;
	numero: number;
	estado: EstadoBoleto;
	comunidadId: string;
}

export interface Regalo {
	id: string;
	descripcion: string;
	comunidadId: string;
	fecha: string;
}

export interface Comunidad {
	id: string;
	nombre: string;
	centroId: string;
	boletos: Boleto[];
	regalos: Regalo[];
}

export interface Centro {
	id: string;
	nombre: string;
	comunidades: Comunidad[];
}

export const PRECIO_BOLETO = 560;

// Estadísticas
export interface EstadisticasCentro {
	centroId: string;
	nombreCentro: string;
	totalBoletos: number;
	boletosPagados: number;
	boletosNoPagados: number;
	boletosRegresados: number;
	totalRecaudado: number;
	totalPorCobrar: number;
	totalRegalos: number;
}

export interface EstadisticasComunidad {
	comunidadId: string;
	nombreComunidad: string;
	nombreCentro: string;
	totalBoletos: number;
	boletosPagados: number;
	boletosNoPagados: number;
	boletosRegresados: number;
	totalRecaudado: number;
	totalPorCobrar: number;
	totalRegalos: number;
}
