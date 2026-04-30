const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const getEnv = (key, fallback) => {
    const value = process.env[key];
    return typeof value === 'string' ? value.trim() : fallback;
};

const poolConfig = {
    user: getEnv('DB_USER', 'postgres'),
    host: getEnv('DB_HOST', 'localhost'),
    database: getEnv('DB_NAME', 'postgres'),
    password: getEnv('DB_PASSWORD', ''),
    port: Number(getEnv('DB_PORT', 5432)),
};

const pool = new Pool(poolConfig);

const schemaName = getEnv('DB_SCHEMA', 'clasico_bd');
const resetSchema = getEnv('RESET_SCHEMA', 'false').toLowerCase() === 'true';
const sqlDumpPath = path.resolve(__dirname, '../estructura_complejo.sql');

function sanitizeDump(sql) {
    return sql
        .replace(/^\\.*$/gm, '')
        .replace(/^\s*SET\s+.*;\s*$/gim, '')
        .replace(/^\s*SELECT\s+pg_catalog\.set_config\(.*\);\s*$/gim, '')
        .replace(/CREATE SCHEMA\s+clasico_bd;/gi, `CREATE SCHEMA IF NOT EXISTS ${schemaName};`)
        .replace(/\bclasico_bd\b/g, schemaName)
        .trim();
}

async function seedAdmin(client) {
    const adminPassword = getEnv('ADMIN_PASSWORD', 'cla2026');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await client.query(
        `
        INSERT INTO ${schemaName}.usuarios (username, password, nombre, rol)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username)
        DO UPDATE SET password = EXCLUDED.password, nombre = EXCLUDED.nombre, rol = EXCLUDED.rol
        `,
        ['admin', hashedPassword, 'Administrador', 'admin']
    );
}

async function initDB() {
    const client = await pool.connect();

    try {
        if (!fs.existsSync(sqlDumpPath)) {
            throw new Error(`No se encontró el dump del esquema en: ${sqlDumpPath}`);
        }

        console.log('Conectando a DB con configuración:', {
            ...poolConfig,
            password: poolConfig.password ? '****' : '(vacío)',
            schema: schemaName,
            resetSchema,
        });

        let dumpSQL = fs.readFileSync(sqlDumpPath, 'utf8');
        dumpSQL = sanitizeDump(dumpSQL);

        await client.query('BEGIN');

        if (resetSchema) {
            await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE;`);
        }

        await client.query(dumpSQL);
        await seedAdmin(client);

        await client.query('COMMIT');

        const verify = await client.query(
            `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = $1
            ORDER BY table_name;
            `,
            [schemaName]
        );

        console.log(`Schema ${schemaName} inicializado correctamente.`);
        console.log(`Tablas detectadas (${verify.rows.length}):`, verify.rows.map((r) => r.table_name));
        console.log('Usuario admin preparado (username: admin).');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error inicializando DB completa:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

initDB();
