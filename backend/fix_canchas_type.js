require('dotenv').config({ path: './backend/.env' });
const pool = require('./src/config/db');

const fixCanchasType = async () => {
    try {
        console.log('Iniciando normalización de tipos de canchas...');

        // Update 'padel' to 'PADEL'
        const resPadel = await pool.query(`
            UPDATE canchas 
            SET tipo = 'PADEL' 
            WHERE tipo = 'padel' OR tipo = 'Padel';
        `);
        console.log(`Actualizadas ${resPadel.rowCount} canchas de Padel.`);

        // Update 'futbol' to 'FUTBOL'
        const resFutbol = await pool.query(`
            UPDATE canchas 
            SET tipo = 'FUTBOL' 
            WHERE tipo = 'futbol' OR tipo = 'Futbol' OR tipo = 'FUTBOL5';
        `);
        console.log(`Actualizadas ${resFutbol.rowCount} canchas de Futbol.`);

        console.log('Normalización completada.');
    } catch (err) {
        console.error('Error al normalizar canchas:', err);
    } finally {
        pool.end();
    }
};

fixCanchasType();
