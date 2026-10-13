const test = require('node:test');
const assert = require('node:assert/strict');
const { validarFiltros, normalizarMetodo, redondearCentavos, validarIdCaja, construirExpresionFecha, construirSerializacionFechaSql, resumirFilas, esAjusteNoMonetario } = require('../src/models/ReporteUtils');

test('normaliza métodos sin modificar el valor original', () => {
    assert.deepEqual(normalizarMetodo('  QR '), { metodo: 'qr', categoria: 'qr' });
    assert.deepEqual(normalizarMetodo(null), { metodo: null, categoria: 'no_informado' });
    assert.equal(normalizarMetodo('vale interno').categoria, 'otro');
});

test('valida vista, fechas y rango', () => {
    assert.doesNotThrow(() => validarFiltros({ vista: 'cobranzas', fechaDesde: '2026-01-01', fechaHasta: '2026-01-31' }));
    assert.throws(() => validarFiltros({ vista: 'ventas' }), /vista/);
    assert.throws(() => validarFiltros({ vista: 'cobranzas', fechaDesde: '01-01-2026' }), /YYYY-MM-DD/);
    assert.throws(() => validarFiltros({ vista: 'cobranzas', fechaDesde: '2026-02-01', fechaHasta: '2026-01-01' }), /posterior/);
    assert.throws(() => validarFiltros({ vista: 'cobranzas', origen: 'ventas' }), /origen/);
});

test('redondea importes a centavos y valida cajas', () => {
    assert.equal(redondearCentavos(1877600.009999), 1877600.01);
    assert.equal(validarIdCaja('44'), 44);
    assert.throws(() => validarIdCaja('0'), /id/);
    assert.throws(() => validarIdCaja('44.5'), /id/);
});

test('separa valor de lista y costo registrado de cortesías', () => {
    const summary = resumirFilas([
        { tipo: 'cortesia', monto: '23000', categoria: 'otro' },
        { tipo: 'cortesia_turno', monto: '1000', categoria: 'otro' },
        { tipo: 'cortesia_turno', origen: 'turno', id: '9', estadoReferencia: 'cancelado', monto: '36000', categoria: 'otro' },
        { tipo: 'gasto_cortesia', monto: '4500', categoria: 'no_informado' }
    ], 'cortesias');
    assert.equal(summary.valorLista, 60000);
    assert.equal(summary.costoRegistrado, 4500);
    assert.equal(summary.cantidadOperaciones, 2);
    assert.equal(summary.total, 60000);
    assert.equal(summary.byMethod.otro, 60000);
    assert.equal(summary.cortesiasTurnosCancelados, 36000);
});

test('cuenta operaciones únicas y conserva eventos de pagos múltiples', () => {
    const summary = resumirFilas([
        { origen: 'cantina', id: '10', tipo: 'venta_cantina', monto: '3.00', categoria: 'efectivo' },
        { origen: 'cantina', id: '10', tipo: 'venta_cantina', monto: '2.00', categoria: 'qr' }
    ], 'facturacion');
    assert.equal(summary.cantidad, 1);
    assert.equal(summary.cantidadEventos, 2);
    assert.equal(summary.total, 5);
});

test('reconoce únicamente reversiones explícitas como ajustes no monetarios', () => {
    assert.equal(esAjusteNoMonetario({ tipo: 'HABER', descripcion: 'Anulación Venta #4 (NC)' }), true);
    assert.equal(esAjusteNoMonetario({ tipo: 'HABER', descripcion: 'Cobro recibido' }), false);
    assert.equal(esAjusteNoMonetario({ tipo: 'DEBE', descripcion: 'Anulación Venta #4 (NC)' }), false);
});

test('separa ajustes no monetarios del resumen sin alterar el total', () => {
    const summary = resumirFilas([
        { origen: 'cuenta_corriente', operationId: '1', id: '1', tipo: 'HABER', monto: '100', impacto: '-100', descripcion: 'Anulación Venta #1 (NC)' },
        { origen: 'cuenta_corriente', operationId: '2', id: '2', tipo: 'HABER', monto: '50', impacto: '-50', descripcion: 'Cobro recibido' }
    ], 'cuenta_corriente');
    assert.equal(summary.ajustesNoMonetarios, 100);
    assert.equal(summary.total, -150);
});

test('construye rangos con contrato histórico UTC y fechas date directas', () => {
    assert.match(construirExpresionFecha('m.fecha'), /AT TIME ZONE 'UTC'.*America\/Argentina\/Buenos_Aires/);
    assert.equal(construirExpresionFecha('t.fecha', true), 't.fecha');
});

test('serializa fechas SQL como calendario o UTC explícito', () => {
    const sql = construirSerializacionFechaSql();
    assert.match(sql, /TO_CHAR\(fecha, 'YYYY-MM-DD'\)/);
    assert.match(sql, /HH24:MI:SS\.US/);
    assert.match(sql, /date_only/);
});
