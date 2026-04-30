const pool = require('./src/config/db');

(async () => {
    try {
        await pool.query("ALTER TABLE movimientos_cuenta ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50)");
        console.log("Column added successfully.");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();
