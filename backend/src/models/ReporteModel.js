const pool = require('../config/db');
const { validarFiltros, normalizarMetodo, redondearCentavos, validarIdCaja, construirExpresionFecha, construirSerializacionFechaSql, resumirFilas, esAjusteNoMonetario, CATEGORIAS } = require('./ReporteUtils');

const methodCategorySql = `CASE
    WHEN NULLIF(LOWER(TRIM(metodo)), '') IS NULL THEN 'no_informado'
    WHEN LOWER(TRIM(metodo)) IN ('efectivo','cash') THEN 'efectivo'
    WHEN LOWER(TRIM(metodo)) IN ('qr','mercadopago','mp') THEN 'qr'
    WHEN LOWER(TRIM(metodo)) IN ('transferencia','transfer','transferencia bancaria') THEN 'transferencia'
    WHEN LOWER(TRIM(metodo)) IN ('tarjeta','debito','débito','credito','crédito') THEN 'tarjeta'
    ELSE 'otro' END`;
// Matches only the explicit Nota de Crédito text emitted by VentaModel.
const reversalSql = "(descripcion ILIKE 'Anulación Venta #% (NC)%' OR descripcion ILIKE 'Anulacion Venta #% (NC)%' OR descripcion ILIKE '%reversión%')";

function rangeWhere(column, params, desde, hasta) {
    const expression = construirExpresionFecha(column, column === 't.fecha');
    const parts = [];
    if (desde) { params.push(desde); parts.push(`${expression} >= $${params.length}::date`); }
    if (hasta) { params.push(hasta); parts.push(`${expression} < ($${params.length}::date + INTERVAL '1 day')`); }
    return parts.length ? ` AND ${parts.join(' AND ')}` : '';
}

function queryFor(vista, params, desde, hasta, metodo, origen) {
    const date = (column) => rangeWhere(column, params, desde, hasta);
    const method = (column) => {
        if (!metodo) return '';
        const filter = CATEGORIAS.includes(String(metodo).trim().toLowerCase())
            ? methodCategorySql.replace(/metodo/g, column) + ` = $${params.push(String(metodo).trim().toLowerCase())}`
            : `LOWER(TRIM(COALESCE(${column}, ''))) = LOWER(TRIM($${params.push(metodo)}))`;
        return ` AND ${filter}`;
    };
    const origin = () => origen ? ` AND origen = $${params.push(origen)}` : '';
    let cte;
    if (vista === 'cobranzas') {
        cte = `SELECT v.id::text id, v.id::text operation_id, v.fecha fecha, FALSE date_only, 'cantina' origen, 'venta_cantina' tipo,
                    p.metodo, p.monto::numeric monto, NULL::text descripcion, NULL::text estado_referencia
                FROM ventas_cantina v JOIN pagos_ventas p ON p.venta_id=v.id
                WHERE LOWER(TRIM(COALESCE(p.metodo,''))) NOT IN ('cuenta_corriente','gastos_generales')${date('v.fecha')}
                UNION ALL SELECT p.id::text, t.id::text, p.fecha_pago, FALSE, 'turno', 'cobro_turno', p.metodo, p.monto, NULL, t.estado
                FROM pagos p JOIN turnos t ON t.id=p.turno_id
                WHERE LOWER(TRIM(COALESCE(p.metodo,''))) NOT IN ('cuenta_corriente','gastos_generales')${date('p.fecha_pago')}
                UNION ALL SELECT m.id::text, m.id::text, m.fecha, FALSE, 'cuenta_corriente', 'haber', m.metodo_pago, m.monto, m.descripcion, NULL
                FROM movimientos_cuenta m WHERE m.tipo='HABER' AND NOT ${reversalSql}${date('m.fecha')}`;
        cte += ` UNION ALL SELECT p.id::text, i.id::text, p.fecha_pago, FALSE, 'inscripcion', 'cobro_inscripcion', p.metodo, p.monto, NULL, NULL
            FROM pagos_inscripcion p JOIN inscripciones i ON i.id=p.inscripcion_id
            WHERE LOWER(TRIM(COALESCE(p.metodo,''))) NOT IN ('cuenta_corriente','gastos_generales')${date('p.fecha_pago')}`;
    } else if (vista === 'facturacion') {
        cte = `SELECT v.id::text id, v.id::text operation_id, v.fecha fecha, FALSE date_only, 'cantina' origen, 'venta_cantina' tipo,
                    p.metodo, p.monto::numeric monto, NULL::text descripcion, NULL::text estado_referencia
                FROM ventas_cantina v JOIN pagos_ventas p ON p.venta_id=v.id
                WHERE LOWER(TRIM(COALESCE(p.metodo,''))) <> 'gastos_generales'${date('v.fecha')}
                UNION ALL SELECT t.id::text, t.id::text, t.fecha::timestamp, TRUE, 'turno', 'turno', NULL,
                    GREATEST(t.monto_total - COALESCE(SUM(p.monto) FILTER (WHERE LOWER(TRIM(COALESCE(p.metodo,'')))='gastos_generales'),0),0), NULL, t.estado
                FROM turnos t LEFT JOIN pagos p ON p.turno_id=t.id
                WHERE t.estado <> 'cancelado'${date('t.fecha')} GROUP BY t.id, t.fecha, t.monto_total, t.estado`;
        cte += ` UNION ALL SELECT i.id::text, i.id::text, COALESCE(i.fecha_inscripcion::timestamp, t.created_at), FALSE, 'inscripcion', 'inscripcion', NULL,
            GREATEST(t.costo_inscripcion - COALESCE(SUM(p.monto) FILTER (WHERE LOWER(TRIM(COALESCE(p.metodo,'')))='gastos_generales'),0),0), NULL, NULL
            FROM inscripciones i JOIN torneos t ON t.id=i.torneo_id LEFT JOIN pagos_inscripcion p ON p.inscripcion_id=i.id
            WHERE COALESCE(LOWER(i.estado),'inscripto') NOT IN ('baja','dado_de_baja','cancelado')${date('COALESCE(i.fecha_inscripcion::timestamp, t.created_at)')}
            GROUP BY i.id, i.fecha_inscripcion, t.created_at, t.costo_inscripcion`;
    } else if (vista === 'cuenta_corriente') {
        cte = `SELECT m.id::text id, m.id::text operation_id, m.fecha, FALSE date_only, 'cuenta_corriente' origen, m.tipo tipo,
                    m.metodo_pago metodo, m.monto::numeric monto, m.descripcion, NULL::text estado_referencia
                FROM movimientos_cuenta m WHERE TRUE${date('m.fecha')}`;
    } else {
        cte = `SELECT p.id::text id, v.id::text operation_id, v.fecha, FALSE date_only, 'cantina' origen, 'cortesia' tipo,
                    p.metodo, p.monto::numeric monto, v.observaciones descripcion, NULL::text estado_referencia
                FROM ventas_cantina v JOIN pagos_ventas p ON p.venta_id=v.id
                WHERE LOWER(TRIM(COALESCE(p.metodo,'')))='gastos_generales'${date('v.fecha')}
                UNION ALL SELECT t.id::text, t.id::text, t.fecha::timestamp, TRUE, 'turno', 'cortesia_turno', 'gastos_generales',
                    COALESCE(SUM(p.monto),0), NULL, t.estado FROM turnos t JOIN pagos p ON p.turno_id=t.id
                WHERE LOWER(TRIM(COALESCE(p.metodo,'')))='gastos_generales'${date('t.fecha')}
                GROUP BY t.id, t.fecha
                UNION ALL SELECT g.id::text, g.id::text, g.fecha, FALSE, 'gastos', 'gasto_cortesia', NULL, g.monto, g.descripcion, NULL
                FROM gastos g WHERE (g.descripcion ILIKE '%cortes%' OR g.descripcion ILIKE '%cortesia%')${date('g.fecha')}
                UNION ALL SELECT p.id::text, i.id::text, p.fecha_pago, FALSE, 'inscripcion', 'cortesia_inscripcion', p.metodo, p.monto, NULL, NULL
                FROM pagos_inscripcion p JOIN inscripciones i ON i.id=p.inscripcion_id
                WHERE LOWER(TRIM(COALESCE(p.metodo,'')))='gastos_generales'${date('p.fecha_pago')}
                `;
    }
    return { sql: `WITH base AS (${cte}), filtered AS (
        SELECT base.*, ${methodCategorySql.replace(/metodo/g, 'base.metodo')} categoria FROM base
        WHERE TRUE${method('base.metodo')}${origin()}
    ) SELECT id, operation_id AS "operationId", ${construirSerializacionFechaSql('fecha')} AS fecha, origen, tipo, metodo, categoria, monto, descripcion,
        estado_referencia AS "estadoReferencia",
        CASE WHEN tipo='DEBE' THEN monto WHEN tipo='HABER' THEN -monto ELSE monto END AS impacto
        FROM filtered ORDER BY fecha DESC, id`, params };
}

async function getFinanzas(filters) {
    const { vista, fechaDesde, fechaHasta, metodo, origen } = filters;
    validarFiltros(filters);
    const params = [];
    const { sql } = queryFor(vista, params, fechaDesde, fechaHasta, metodo, origen);
    const result = await pool.query(sql, params);
    const rows = result.rows;
    const summary = resumirFilas(rows, vista);
    if (vista === 'cobranzas') {
        // Reversals are intentionally absent from the cobranzas rowset, but remain auditable.
        if ((!origen || origen === 'cuenta_corriente') && !metodo) {
            const adjustmentParams = [];
            const adjustmentRange = rangeWhere('m.fecha', adjustmentParams, fechaDesde, fechaHasta);
            const adjustmentResult = await pool.query(
                `SELECT COALESCE(SUM(m.monto), 0) AS ajustes
                 FROM movimientos_cuenta m
                 WHERE m.tipo = 'HABER' AND ${reversalSql}${adjustmentRange}`,
                adjustmentParams
            );
            summary.ajustesNoMonetarios = redondearCentavos(adjustmentResult.rows[0].ajustes);
        } else {
            summary.ajustesNoMonetarios = 0;
        }
    }
    if (vista === 'cuenta_corriente') {
        summary.debe = redondearCentavos(rows.filter(r => r.tipo === 'DEBE').reduce((n, r) => n + Number(r.monto), 0));
        summary.haber = redondearCentavos(rows.filter(r => r.tipo === 'HABER').reduce((n, r) => n + Number(r.monto), 0));
        const saldo = await pool.query("SELECT ROUND(COALESCE(SUM(CASE WHEN tipo='DEBE' THEN monto ELSE -monto END),0),2) saldo FROM movimientos_cuenta");
        summary.variacion = redondearCentavos(summary.debe - summary.haber);
        summary.saldoActual = redondearCentavos(saldo.rows[0].saldo);
    }
    return { meta: { version: 2, vista, timezone: 'America/Argentina/Buenos_Aires', storageTimezone: 'UTC', dateBasis: vista === 'facturacion' ? 'mixed' : 'event', ...(vista === 'facturacion' ? { inscripcionesDateBasis: 'fecha_inscripcion' } : {}) }, summary, rows };
}

async function getArqueo(id) {
    const caja = await pool.query(`SELECT id, fecha_apertura, fecha_cierre, saldo_inicial, saldo_final,
        TO_CHAR(fecha_apertura, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS fecha_apertura_serializada,
        TO_CHAR(fecha_cierre, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS fecha_cierre_serializada
        FROM cajas WHERE id=$1`, [id]);
    if (!caja.rows.length) return null;
    const c = caja.rows[0];
    const end = c.fecha_cierre || new Date();
    const p = [c.fecha_apertura, end, id];
    const q = await pool.query(`WITH vp AS (
        SELECT p.monto, p.metodo, t.estado FROM pagos p JOIN turnos t ON t.id=p.turno_id
        WHERE p.fecha_pago >= $1 AND p.fecha_pago <= $2 AND (p.caja_id=$3 OR p.caja_id IS NULL)
    ), ip AS (SELECT p.monto,p.metodo FROM pagos_inscripcion p
        WHERE p.fecha_pago >= $1 AND p.fecha_pago <= $2 AND (p.caja_id=$3 OR p.caja_id IS NULL)),
    cp AS (SELECT p.monto,p.metodo FROM ventas_cantina v JOIN pagos_ventas p ON p.venta_id=v.id
        WHERE v.fecha >= $1 AND v.fecha <= $2 AND (v.caja_id=$3 OR v.caja_id IS NULL)),
    hab AS (SELECT COALESCE(SUM(monto),0) n FROM movimientos_cuenta WHERE tipo='HABER' AND NOT ${reversalSql} AND LOWER(TRIM(COALESCE(metodo_pago,''))) <> 'gastos_generales' AND fecha >= $1 AND fecha <= $2 AND (caja_id=$3 OR caja_id IS NULL)),
    ajustes AS (SELECT COALESCE(SUM(monto),0) n FROM movimientos_cuenta WHERE tipo='HABER' AND ${reversalSql} AND fecha >= $1 AND fecha <= $2 AND (caja_id=$3 OR caja_id IS NULL)),
    deb AS (SELECT COALESCE(SUM(monto),0) n FROM movimientos_cuenta WHERE tipo='DEBE' AND fecha >= $1 AND fecha <= $2 AND (caja_id=$3 OR caja_id IS NULL)),
    gs AS (SELECT COALESCE(SUM(CASE WHEN descripcion ILIKE '%cortes%' OR descripcion ILIKE '%cortesía%' THEN 0 ELSE monto END),0) n FROM gastos WHERE fecha >= $1 AND fecha <= $2 AND (caja_id=$3 OR caja_id IS NULL))
    SELECT (SELECT n FROM hab) cobranzas_cc, (SELECT n FROM ajustes) ajustes_no_monetarios, (SELECT n FROM deb) cargos_cc, (SELECT n FROM gs) gastos,
      (SELECT COALESCE(SUM(monto),0) FROM movimientos_cuenta WHERE tipo='HABER' AND NOT ${reversalSql} AND fecha >= $1 AND fecha <= $2 AND (caja_id=$3 OR caja_id IS NULL) AND ${methodCategorySql.replace(/metodo/g, 'metodo_pago')}='efectivo') efectivo_hab,
      (SELECT COALESCE(SUM(monto),0) FROM movimientos_cuenta WHERE tipo='HABER' AND NOT ${reversalSql} AND fecha >= $1 AND fecha <= $2 AND (caja_id=$3 OR caja_id IS NULL) AND ${methodCategorySql.replace(/metodo/g, 'metodo_pago')} NOT IN ('efectivo','no_informado','otro')) digital_hab,
      (SELECT COALESCE(SUM(monto),0) FROM movimientos_cuenta WHERE tipo='HABER' AND NOT ${reversalSql} AND fecha >= $1 AND fecha <= $2 AND (caja_id=$3 OR caja_id IS NULL) AND ${methodCategorySql.replace(/metodo/g, 'metodo_pago')} IN ('no_informado','otro') AND LOWER(TRIM(COALESCE(metodo_pago,''))) <> 'gastos_generales') unknown_hab,
       (SELECT COALESCE(SUM(monto),0) FROM cp WHERE LOWER(TRIM(COALESCE(metodo,'')))='gastos_generales') +
       (SELECT COALESCE(SUM(monto),0) FROM vp WHERE LOWER(TRIM(COALESCE(metodo,'')))='gastos_generales') +
       (SELECT COALESCE(SUM(monto),0) FROM ip WHERE LOWER(TRIM(COALESCE(metodo,'')))='gastos_generales') cortesias,
      (SELECT COALESCE(SUM(monto),0) FROM vp WHERE LOWER(TRIM(COALESCE(metodo,'')))='cuenta_corriente') pagos_cc,
      (SELECT COALESCE(SUM(monto),0) FROM vp WHERE estado='cancelado' AND LOWER(TRIM(COALESCE(metodo,''))) NOT IN ('cuenta_corriente','gastos_generales')) cancelados,
      (SELECT COALESCE(SUM(monto),0) FROM vp WHERE estado='cancelado' AND LOWER(TRIM(COALESCE(metodo,'')))='gastos_generales') cortesias_cancelados,
      (SELECT COALESCE(SUM(monto),0) FROM cp WHERE LOWER(TRIM(COALESCE(metodo,''))) NOT IN ('cuenta_corriente','gastos_generales') AND ${methodCategorySql.replace(/metodo/g, 'cp.metodo')}='efectivo') efectivo_cp,
       (SELECT COALESCE(SUM(monto),0) FROM vp WHERE ${methodCategorySql.replace(/metodo/g, 'vp.metodo')}='efectivo') efectivo_vp,
       (SELECT COALESCE(SUM(monto),0) FROM ip WHERE ${methodCategorySql.replace(/metodo/g, 'ip.metodo')}='efectivo') efectivo_ip,
      (SELECT COALESCE(SUM(monto),0) FROM cp WHERE ${methodCategorySql.replace(/metodo/g, 'cp.metodo')} NOT IN ('efectivo','no_informado','otro') AND LOWER(TRIM(COALESCE(metodo,''))) <> 'gastos_generales') digital_cp,
       (SELECT COALESCE(SUM(monto),0) FROM vp WHERE ${methodCategorySql.replace(/metodo/g, 'vp.metodo')} NOT IN ('efectivo','no_informado','otro') AND LOWER(TRIM(COALESCE(metodo,''))) NOT IN ('cuenta_corriente','gastos_generales')) digital_vp,
       (SELECT COALESCE(SUM(monto),0) FROM ip WHERE ${methodCategorySql.replace(/metodo/g, 'ip.metodo')} NOT IN ('efectivo','no_informado','otro') AND LOWER(TRIM(COALESCE(metodo,''))) NOT IN ('cuenta_corriente','gastos_generales')) digital_ip,
       (SELECT COALESCE(SUM(monto),0) FROM cp WHERE ${methodCategorySql.replace(/metodo/g, 'cp.metodo')} IN ('no_informado','otro') AND LOWER(TRIM(COALESCE(metodo,''))) <> 'gastos_generales') unknown_cp,
       (SELECT COALESCE(SUM(monto),0) FROM vp WHERE ${methodCategorySql.replace(/metodo/g, 'vp.metodo')} IN ('no_informado','otro') AND LOWER(TRIM(COALESCE(metodo,''))) NOT IN ('cuenta_corriente','gastos_generales')) unknown_vp,
       (SELECT COALESCE(SUM(monto),0) FROM ip WHERE ${methodCategorySql.replace(/metodo/g, 'ip.metodo')} IN ('no_informado','otro') AND LOWER(TRIM(COALESCE(metodo,''))) NOT IN ('cuenta_corriente','gastos_generales')) unknown_ip`, p);
    const r = q.rows[0];
    const n = x => redondearCentavos(x || 0);
    const ingresosEfectivo = n(n(r.efectivo_cp) + n(r.efectivo_vp) + n(r.efectivo_ip) + n(r.efectivo_hab));
    const esperado = n(n(c.saldo_inicial) + ingresosEfectivo - n(r.gastos));
    const saldoFinalReal = c.saldo_final == null ? null : n(c.saldo_final);
    const cajaResponse = { ...c, fecha_apertura: c.fecha_apertura_serializada, fecha_cierre: c.fecha_cierre_serializada };
    delete cajaResponse.fecha_apertura_serializada;
    delete cajaResponse.fecha_cierre_serializada;
    return { caja: cajaResponse, resumen: { saldoInicial: n(c.saldo_inicial), ingresosEfectivo, gastosMonetarios: n(r.gastos), efectivoEsperado: esperado, saldoFinalReal, diferencia: saldoFinalReal == null ? null : n(saldoFinalReal - esperado), digital: n(n(r.digital_cp) + n(r.digital_vp) + n(r.digital_ip) + n(r.digital_hab)), cargosCuentaCorriente: n(r.cargos_cc), cobranzasCuentaCorriente: n(r.cobranzas_cc), ajustesNoMonetarios: n(r.ajustes_no_monetarios), cortesiasValor: n(r.cortesias), cobrosTurnosCancelados: n(r.cancelados), cortesiasTurnosCancelados: n(r.cortesias_cancelados), metodosNoClasificados: n(n(r.unknown_cp) + n(r.unknown_vp) + n(r.unknown_ip) + n(r.unknown_hab)) } };
}

module.exports = { getFinanzas, getArqueo, validarFiltros, normalizarMetodo, CATEGORIAS };
