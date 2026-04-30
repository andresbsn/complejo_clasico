BEGIN;

-- Crear tabla cajas
CREATE TABLE IF NOT EXISTS cajas (
    id SERIAL PRIMARY KEY,
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    saldo_inicial DECIMAL(10, 2) DEFAULT 0,
    saldo_final DECIMAL(10, 2),
    estado VARCHAR(20) DEFAULT 'abierta',
    usuario_apertura_id INTEGER REFERENCES usuarios(id),
    usuario_cierre_id INTEGER REFERENCES usuarios(id),
    observaciones TEXT
);

-- Agregar columna caja_id a las tablas existentes
ALTER TABLE ventas_cantina 
ADD COLUMN IF NOT EXISTS caja_id INTEGER REFERENCES cajas(id);

ALTER TABLE pagos 
ADD COLUMN IF NOT EXISTS caja_id INTEGER REFERENCES cajas(id);

ALTER TABLE inscripciones 
ADD COLUMN IF NOT EXISTS caja_id INTEGER REFERENCES cajas(id);

ALTER TABLE movimientos_cuenta 
ADD COLUMN IF NOT EXISTS caja_id INTEGER REFERENCES cajas(id);

COMMIT;
