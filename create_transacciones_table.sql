-- Tabla para control de caja - Transacciones
CREATE TABLE IF NOT EXISTS transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    concepto VARCHAR(20) NOT NULL CHECK (concepto IN ('boletos', 'venta', 'donacion', 'otro', 'gasto', 'compra', 'pago')),
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_transacciones_concepto ON transacciones(concepto);

-- Comentarios de la tabla
COMMENT ON TABLE transacciones IS 'Registro de entradas y salidas de caja';
COMMENT ON COLUMN transacciones.tipo IS 'entrada o salida';
COMMENT ON COLUMN transacciones.concepto IS 'boletos, venta, donacion, otro, gasto, compra, pago';
