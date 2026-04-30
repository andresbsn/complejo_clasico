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

const checkTable = async () => {
    try {
        const res = await pool.query("SELECT to_regclass('public.movimientos_cuenta')");
        console.log('Table exists:', res.rows[0].to_regclass);
    } catch (err) {
        console.error('Error checking table:', err);
    } finally {
        pool.end();
    }
};

checkTable();
