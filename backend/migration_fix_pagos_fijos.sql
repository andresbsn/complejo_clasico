-- Identificar pagos asociados erróneamente a IDs de reservas fijas
-- Reemplaza ID_RESERVA_FIJA con el ID numérico de tu turno fijo (el número que sigue a 'fijo_' en el frontend)

-- 1. Ver qué pagos están registrados para ese ID
SELECT * FROM pagos WHERE turno_id = ID_RESERVA_FIJA;

-- 2. Eliminar esos pagos específicos (Cuidado: verifica que no pertenezcan a un turno real antiguo con el mismo ID)
-- DELETE FROM pagos WHERE turno_id = ID_RESERVA_FIJA;

-- Ejemplo si el ID de la reserva fija es 6:
-- DELETE FROM pagos WHERE turno_id = 6;
