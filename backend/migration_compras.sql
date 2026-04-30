BEGIN;

CREATE TABLE IF NOT EXISTS compras (
    id SERIAL PRIMARY KEY,
    proveedor_id INTEGER REFERENCES proveedores(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, RECIBIDO
    observaciones TEXT
);

CREATE TABLE IF NOT EXISTS detalle_compra (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER REFERENCES compras(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    costo_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

COMMIT;
