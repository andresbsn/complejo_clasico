require('dotenv').config({ path: './backend/.env' });
const pool = require('./src/config/db');

const removeConstraint = async () => {
    try {
        console.log('Eliminando restricción canchas_tipo_check...');

        await pool.query(`
            ALTER TABLE canchas DROP CONSTRAINT if exists canchas_tipo_check;
        `);

        console.log('Restricción eliminada (si existía).');

        // Ahora sí, normalizamos
        console.log('Re-intentando normalización de tipos...');
        // Update 'padel' to 'PADEL'
        const resPadel = await pool.query(`
            UPDATE canchas 
            SET tipo = 'PADEL' 
            WHERE tipo ILIKE 'padel';
        `);
        console.log(`Actualizadas ${resPadel.rowCount} canchas de Padel.`);

        // Update 'futbol' to 'FUTBOL'
        const resFutbol = await pool.query(`
            UPDATE canchas 
            SET tipo = 'FUTBOL' 
            WHERE tipo ILIKE 'futbol' OR tipo = 'FUTBOL5';
        `);
        console.log(`Actualizadas ${resFutbol.rowCount} canchas de Futbol.`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
};

removeConstraint();
