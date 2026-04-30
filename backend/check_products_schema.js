const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const checkSchema = async () => {
    try {
        console.log('Checking Schema...');

        // Check proveedores table
        const resProv = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'proveedores';
        `);
        console.log('Proveedores columns:', resProv.rows);

        // Check productos table columns
        const resProd = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'productos';
        `);
        console.log('Productos columns:', resProd.rows);

    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        pool.end();
    }
};

checkSchema();
