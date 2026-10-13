import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CajaService, ReporteService } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const VIEWS = [
    ['facturacion', 'Facturación'],
    ['cobranzas', 'Cobranzas'],
    ['cuenta_corriente', 'Cuenta corriente'],
    ['cortesias', 'Cortesías'],
    ['caja', 'Caja']
];
const labels = { efectivo: 'Efectivo', qr: 'QR', transferencia: 'Transferencia', tarjeta: 'Tarjeta', otro: 'Otro', no_informado: 'No informado', inscripcion: 'Inscripción' };
const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const money = (value) => `$${formatCurrency(Number.isFinite(Number(value)) ? Number(value) : 0)}`;
const localDate = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: ARGENTINA_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date(date));
    const values = Object.fromEntries(parts.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
};
const formatReportDateTime = (value) => {
    if (!value) return '-';
    const text = String(value);
    // Date-only values (notably turno dates) are calendar dates, not UTC instants.
    // Formatting them through Date would move them to the previous day in Argentina.
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const [, year, month, day] = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return `${day}/${month}/${year}`;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return text;
    return new Intl.DateTimeFormat('es-AR', {
        timeZone: ARGENTINA_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};
const pretty = (value) => labels[String(value || '').toLowerCase()] || String(value || '-').replace(/_/g, ' ');
const sanitizeCsvValue = (value) => {
    const text = String(value ?? '');
    return /^(\s*)[=+\-@]/.test(text) ? text.replace(/^(\s*)([=+\-@])/, "$1'$2") : text;
};
const csvCell = (value) => `"${sanitizeCsvValue(value).replace(/"/g, '""')}"`;

function downloadCsv(filename, rows) {
    const csv = rows.map(row => row.map(csvCell).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

const Card = ({ title, value, alert = false }) => (
    <div className={`bg-white p-4 rounded-xl shadow-sm border ${alert ? 'border-red-300' : 'border-gray-100'}`}>
        <p className="text-xs text-gray-500">{title}</p>
        <p className={`text-xl font-bold mt-1 ${alert ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
    </div>
);

export default function FinancialReports() {
    const [view, setView] = useState('facturacion');
    const [from, setFrom] = useState(localDate());
    const [to, setTo] = useState(localDate());
    const [method, setMethod] = useState('');
    const [origin, setOrigin] = useState('');
    const [data, setData] = useState({ meta: {}, summary: {}, rows: [] });
    const [cajas, setCajas] = useState([]);
    const [cajaId, setCajaId] = useState('');
    const [arqueo, setArqueo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const requestSequence = useRef(0);

    const load = async () => {
        const sequence = ++requestSequence.current;
        setLoading(true); setError('');
        if (view === 'caja') {
            setArqueo(null);
            if (!cajaId) setCajas([]);
        } else {
            setData({ meta: {}, summary: {}, rows: [] });
        }
        try {
            if (view === 'caja') {
                if (!cajaId) {
                    const history = await CajaService.getHistorial();
                    if (sequence === requestSequence.current) setCajas(history);
                } else {
                    const result = await CajaService.getArqueo(cajaId);
                    if (sequence === requestSequence.current) setArqueo(result);
                }
            } else {
                const result = await ReporteService.getFinanzas({ vista: view, fechaDesde: from, fechaHasta: to, metodo: view === 'cobranzas' ? method : '', origen: view === 'cobranzas' ? origin : '' });
                if (sequence === requestSequence.current) setData(result);
            }
        } catch (err) {
            if (sequence === requestSequence.current) setError(err.response?.data?.error || 'No se pudo cargar el reporte financiero.');
        } finally {
            if (sequence === requestSequence.current) setLoading(false);
        }
    };
    useEffect(() => { load(); }, [view, cajaId]);

    const summary = data.summary || {};
    const explanation = {
         facturacion: 'Base mixta: operaciones de cantina, turnos e inscripciones por sus fechas correspondientes. No es necesariamente cobro.',
         cobranzas: 'Base evento de cobro. Incluye cobranzas de turnos, inscripciones, cantina y HABER de cuenta corriente; excluye CC generada y cortesías.',
        cuenta_corriente: 'Base evento de movimientos. DEBE son cargos y HABER son cobranzas; el saldo actual es acumulado histórico.',
        cortesias: 'Base fecha de la operación. Valor lista y costo registrado se muestran separados; el costo no se suma al valor.',
        caja: 'El arqueo usa el intervalo entre apertura y cierre de la caja seleccionada.'
    }[view];
    const financialRows = data.rows || [];
    const alerts = [];
    if (view === 'cobranzas' && Number(summary.cobrosTurnosCancelados || 0) > 0) alerts.push(`Se cobraron ${money(summary.cobrosTurnosCancelados)} de turnos cancelados; no se descontaron automáticamente.`);
    if (view === 'cortesias' && Number(summary.cortesiasTurnosCancelados || 0) > 0) alerts.push(`Hay ${money(summary.cortesiasTurnosCancelados)} en cortesías de turnos cancelados.`);
    const exportFinancial = () => {
          const rows = [['Reporte financiero', view], ['Filtros', `Desde ${from || '-'} / Hasta ${to || '-'}`], ['Definición', explanation], ['Zona horaria de fechas', 'America/Argentina/Buenos_Aires'], ['Operaciones únicas (summary.cantidad)', summary.cantidad ?? 0], ['Eventos/componentes (summary.cantidadEventos)', summary.cantidadEventos ?? 0], ...(view === 'cobranzas' && summary.ajustesNoMonetarios != null ? [['Ajustes no monetarios (informativo)', summary.ajustesNoMonetarios]] : []), ['Total', money(summary.total)], ['Alertas', alerts.length ? alerts.join(' ') : 'Sin alertas'], ['Resumen JSON', JSON.stringify(summary)], [], ['Fecha/hora (Argentina)', 'Origen', 'Tipo', 'Método', 'Categoría', 'Importe', 'Impacto', 'Estado', 'Advertencia']];
          financialRows.forEach(row => { const cancelled = String(row.estadoReferencia || '').toLowerCase() === 'cancelado'; rows.push([formatReportDateTime(row.fecha), pretty(row.origen), pretty(row.tipo), pretty(row.metodo), pretty(row.categoria), row.monto, row.impacto, row.estadoReferencia || '', cancelled ? 'Referencia cancelada; cobro registrado' : '']); });
        downloadCsv(`reporte-financiero-${view}-${localDate()}.csv`, rows);
    };
    const exportArqueo = () => {
        if (!arqueo) return;
        const r = arqueo.resumen;
         const rows = [['Arqueo de caja', cajaId], ['Definición', explanation], ['Alerta', r.diferencia == null ? 'Pendiente de cierre' : (Number(r.diferencia) !== 0 ? 'Diferencia distinta de cero' : 'Sin diferencia')], [], ['Concepto', 'Importe'], ...Object.entries(r).map(([key, value]) => [key, (key === 'saldoFinalReal' || key === 'diferencia') && value == null ? 'Pendiente de cierre' : value])];
         downloadCsv(`arqueo-caja-${cajaId}-${localDate()}.csv`, rows);
    };
    const changeView = (nextView) => {
        if (nextView === view) return;
        requestSequence.current += 1;
        setError('');
        setData({ meta: {}, summary: {}, rows: [] });
        setArqueo(null);
        setView(nextView);
        setMethod('');
        setOrigin('');
    };
    const cards = useMemo(() => {
        if (view === 'facturacion') return [['Total operaciones', money(summary.total)], ['Operaciones únicas', summary.cantidad || 0], ['Eventos/componentes', summary.cantidadEventos || 0]];
         if (view === 'cobranzas') return [['Total real cobrado', money(summary.total)], ['Operaciones únicas', summary.cantidad || 0], ['Eventos/componentes', summary.cantidadEventos || 0], ...(summary.ajustesNoMonetarios != null ? [['Ajustes no monetarios (informativo)', money(summary.ajustesNoMonetarios)]] : []), ...Object.entries(summary.byMethod || {}).map(([k, v]) => [labels[k] || k, money(v)])];
        if (view === 'cuenta_corriente') return [['DEBE / cargos', money(summary.debe)], ['HABER / cobranzas', money(summary.haber)], ['Variación', money(summary.variacion)], ['Saldo actual', money(summary.saldoActual)]];
         return [['Valor lista', money(summary.valorLista)], ['Costo registrado', money(summary.costoRegistrado)], ['Operaciones únicas', summary.cantidad || 0], ['Eventos/componentes', summary.cantidadEventos || 0]];
    }, [view, summary]);

    return <section className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div><h3 className="text-xl font-bold text-gray-800">Reportes financieros</h3><p className="text-sm text-gray-500">Información contable del backend; los importes no se recalculan en pantalla.</p></div>
        <div className="flex flex-wrap gap-2">{VIEWS.map(([key, title]) => <button key={key} onClick={() => changeView(key)} className={`px-3 py-2 rounded-md text-sm font-medium ${view === key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border'}`}>{title}</button>)}</div>
        {view !== 'caja' && <div className="bg-white p-4 rounded-lg border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <label className="text-xs text-gray-600">Desde<input type="date" value={from} onChange={e => setFrom(e.target.value)} className="block w-full mt-1 rounded-md border-gray-300" /></label>
            <label className="text-xs text-gray-600">Hasta<input type="date" value={to} onChange={e => setTo(e.target.value)} className="block w-full mt-1 rounded-md border-gray-300" /></label>
            {view === 'cobranzas' && <><label className="text-xs text-gray-600">Método<select value={method} onChange={e => setMethod(e.target.value)} className="block w-full mt-1 rounded-md border-gray-300"><option value="">Todos</option>{Object.entries(labels).filter(([k]) => k !== 'inscripcion').map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label><label className="text-xs text-gray-600">Origen<select value={origin} onChange={e => setOrigin(e.target.value)} className="block w-full mt-1 rounded-md border-gray-300"><option value="">Todos</option><option value="cantina">Cantina</option><option value="turno">Turno</option><option value="inscripcion">Inscripción</option><option value="cuenta_corriente">Cuenta corriente</option></select></label></>}
            <button onClick={load} className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm">Filtrar</button>
        </div>}
         {view === 'caja' && <div className="bg-white p-4 rounded-lg border flex flex-wrap gap-3 items-end"><label className="text-xs text-gray-600 w-full sm:w-80">Caja del historial<select value={cajaId} onChange={e => { requestSequence.current += 1; setError(''); setArqueo(null); setCajaId(e.target.value); }} className="block w-full mt-1 rounded-md border-gray-300"><option value="">Seleccionar caja</option>{cajas.map(c => <option key={c.id} value={c.id}>Caja #{c.id} · {formatReportDateTime(c.fecha_apertura)} · {c.estado}</option>)}</select></label>{arqueo && <button onClick={exportArqueo} className="bg-green-600 text-white rounded-md px-4 py-2 text-sm">Exportar CSV</button>}</div>}
         <p className="text-xs text-gray-500">{explanation} Las fechas y horas se muestran en hora de Argentina.</p>
        {alerts.map(alert => <div key={alert} className="bg-amber-50 text-amber-900 border border-amber-200 p-3 rounded-md text-sm">⚠️ {alert}</div>)}
        {error && <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-md">{error}</div>}
        {loading && <div className="bg-white p-8 rounded-lg text-center text-gray-500">Cargando reporte...</div>}
          {!loading && view !== 'caja' && <><div className="flex justify-end"><button onClick={exportFinancial} disabled={loading} className="bg-green-600 text-white rounded-md px-4 py-2 text-sm disabled:opacity-50">Exportar CSV</button></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{cards.map(([title, value]) => <Card key={title} title={title} value={value} />)}</div><div className="bg-white rounded-lg border overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-100"><tr>{['Fecha', 'Origen', 'Tipo', 'Método', 'Categoría', 'Importe', 'Estado', 'Advertencia'].map(h => <th key={h} className="px-4 py-2 text-left text-xs text-gray-500">{h}</th>)}</tr></thead><tbody className="divide-y">{financialRows.length ? financialRows.map((row, i) => { const cancelled = String(row.estadoReferencia || '').toLowerCase() === 'cancelado'; return <tr key={`${row.id}-${i}`} className={cancelled ? 'bg-amber-50 text-amber-900' : ''}><td className="px-4 py-2">{formatReportDateTime(row.fecha)}</td><td className="px-4 py-2">{pretty(row.origen)}</td><td className="px-4 py-2">{pretty(row.tipo)}</td><td className="px-4 py-2">{pretty(row.metodo)}</td><td className="px-4 py-2">{pretty(row.categoria)}</td><td className="px-4 py-2 text-right">{money(row.monto)}</td><td className="px-4 py-2">{row.estadoReferencia ? pretty(row.estadoReferencia) : '—'}</td><td className="px-4 py-2">{cancelled ? '⚠️ Referencia cancelada; cobro registrado' : '—'}</td></tr>; }) : <tr><td colSpan="8" className="p-6 text-center text-gray-400">No hay movimientos para los filtros seleccionados.</td></tr>}</tbody></table></div></>}
         {!loading && view === 'caja' && arqueo && <><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['Saldo inicial', arqueo.resumen.saldoInicial], ['Ingresos efectivo', arqueo.resumen.ingresosEfectivo], ['Gastos monetarios', arqueo.resumen.gastosMonetarios], ['Efectivo esperado', arqueo.resumen.efectivoEsperado], ['Saldo final real', arqueo.resumen.saldoFinalReal], ['Digital', arqueo.resumen.digital], ['Cargos CC', arqueo.resumen.cargosCuentaCorriente], ['Cobranzas CC', arqueo.resumen.cobranzasCuentaCorriente], ['Ajustes no monetarios (informativo)', arqueo.resumen.ajustesNoMonetarios], ['Cortesías', arqueo.resumen.cortesiasValor], ['Cobros cancelados', arqueo.resumen.cobrosTurnosCancelados], ['Cortesías canceladas', arqueo.resumen.cortesiasTurnosCancelados], ['No clasificados', arqueo.resumen.metodosNoClasificados]].map(([title, value]) => <Card key={title} title={title} value={title === 'Saldo final real' && value == null ? 'Pendiente de cierre' : money(value)} />)}<Card title="Diferencia" value={arqueo.resumen.diferencia == null ? 'Pendiente de cierre' : money(arqueo.resumen.diferencia)} alert={arqueo.resumen.diferencia != null && Number(arqueo.resumen.diferencia) !== 0} /></div></>}
        {!loading && view === 'caja' && !arqueo && !cajas.length && <div className="bg-white p-6 text-center text-gray-400 rounded-lg">No hay cajas en el historial.</div>}
    </section>;
}
