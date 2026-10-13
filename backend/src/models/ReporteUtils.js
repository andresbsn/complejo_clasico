const VISTAS = new Set(['cobranzas', 'facturacion', 'cuenta_corriente', 'cortesias']);
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORIAS = ['efectivo', 'qr', 'transferencia', 'tarjeta', 'no_informado', 'otro'];
const ORIGENES = new Set(['cantina', 'turno', 'cuenta_corriente', 'gastos', 'inscripcion']);

function validarFiltros({ vista, fechaDesde, fechaHasta, origen }) {
    if (!VISTAS.has(vista)) throw new Error('vista inválida');
    for (const fecha of [fechaDesde, fechaHasta]) {
        const [year, month, day] = fecha ? fecha.split('-').map(Number) : [];
        const validCalendarDate = fecha && FECHA.test(fecha) && month >= 1 && month <= 12 && day >= 1 && day <= new Date(year, month, 0).getDate();
        if (fecha !== undefined && !validCalendarDate) {
            throw new Error('Las fechas deben tener formato YYYY-MM-DD');
        }
    }
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) throw new Error('fechaDesde no puede ser posterior a fechaHasta');
    if (origen !== undefined && !ORIGENES.has(origen)) throw new Error('origen inválido');
}

function redondearCentavos(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function validarIdCaja(value) {
    if (!/^\d+$/.test(String(value)) || Number(value) <= 0) throw new Error('id de caja inválido');
    return Number(value);
}

function construirExpresionFecha(column, esDate = false) {
    if (esDate) return column;
    // HISTORICAL STORAGE CONTRACT: UTC wall-clock in timestamp without time zone.
    return `((${column}) AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')`;
}

function construirSerializacionFechaSql(column = 'fecha') {
    return `CASE WHEN date_only THEN TO_CHAR(${column}, 'YYYY-MM-DD') ELSE TO_CHAR(${column}, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') END`;
}

// Only the explicit NC/anulation description emitted by VentaModel is non-cash.
function esAjusteNoMonetario(row) {
    const description = String(row && (row.descripcion || '')).toLowerCase();
    return (row && row.tipo === 'HABER') && /anulaci[oó]n venta #.*\(nc\)|reversi[oó]n/.test(description);
}

function normalizarMetodo(value) {
    const raw = value == null ? '' : String(value).trim().toLowerCase();
    if (!raw) return { metodo: null, categoria: 'no_informado' };
    if (['efectivo', 'cash'].includes(raw)) return { metodo: raw, categoria: 'efectivo' };
    if (['qr', 'mercadopago', 'mp'].includes(raw)) return { metodo: raw, categoria: 'qr' };
    if (['transferencia', 'transfer', 'transferencia bancaria'].includes(raw)) return { metodo: raw, categoria: 'transferencia' };
    if (['tarjeta', 'debito', 'débito', 'credito', 'crédito'].includes(raw)) return { metodo: raw, categoria: 'tarjeta' };
    return { metodo: raw, categoria: 'otro' };
}

function resumirFilas(rows, vista) {
    const summary = { total: 0, cantidad: rows.length };
    const uniqueOperations = values => new Set(values.map(row => `${row.origen}:${row.operationId || row.id}`)).size;
    summary.ajustesNoMonetarios = redondearCentavos(rows.filter(esAjusteNoMonetario).reduce((n, row) => n + Number(row.monto || 0), 0));
    if (vista === 'cortesias') {
        const operaciones = rows.filter(row => ['cortesia', 'cortesia_turno', 'cortesia_inscripcion'].includes(row.tipo));
        summary.valorLista = redondearCentavos(operaciones.reduce((n, row) => n + Number(row.monto || 0), 0));
        summary.costoRegistrado = redondearCentavos(rows
            .filter(row => row.tipo === 'gasto_cortesia')
            .reduce((n, row) => n + Number(row.monto || 0), 0));
        summary.cantidadOperaciones = uniqueOperations(operaciones);
        summary.cantidadEventos = rows.length;
        summary.cantidad = summary.cantidadOperaciones;
        summary.cortesiasTurnosCancelados = redondearCentavos(operaciones.filter(row => row.origen === 'turno' && row.estadoReferencia === 'cancelado').reduce((n, row) => n + Number(row.monto || 0), 0));
        summary.total = summary.valorLista;
        summary.byMethod = operaciones.reduce((out, row) => {
            const key = row.categoria || 'no_informado';
            out[key] = redondearCentavos((out[key] || 0) + Number(row.monto || 0));
            return out;
        }, {});
        return summary;
    }
    summary.total = redondearCentavos(rows.reduce((n, row) => n + (vista === 'cuenta_corriente' ? Number(row.impacto || 0) : Number(row.monto || 0)), 0));
    summary.cantidad = uniqueOperations(rows);
    summary.cantidadEventos = rows.length;
    if (vista === 'cobranzas') summary.cobrosTurnosCancelados = redondearCentavos(rows.filter(row => row.origen === 'turno' && row.estadoReferencia === 'cancelado').reduce((n, row) => n + Number(row.monto || 0), 0));
    summary.byMethod = rows.reduce((out, row) => {
        const key = row.categoria || 'no_informado';
        out[key] = redondearCentavos((out[key] || 0) + Number(row.monto || 0));
        return out;
    }, {});
    return summary;
}

module.exports = { validarFiltros, normalizarMetodo, redondearCentavos, validarIdCaja, construirExpresionFecha, construirSerializacionFechaSql, resumirFilas, esAjusteNoMonetario, CATEGORIAS, ORIGENES };
