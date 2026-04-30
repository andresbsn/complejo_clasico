require('dotenv').config({ path: './backend/.env' });
const pool = require('./src/config/db');

const seedProducts = async () => {
    const products = [
        // Bebidas
        { nombre: 'Coca Cola 500ml', categoria: 'bebida', precio: 1500, stock: 50 },
        { nombre: 'Agua Mineral 500ml', categoria: 'bebida', precio: 1000, stock: 50 },
        { nombre: 'Gatorade 500ml', categoria: 'bebida', precio: 1800, stock: 30 },
        { nombre: 'Cerveza Quilmes 473ml', categoria: 'bebida', precio: 2000, stock: 40 },

        // Comida
        { nombre: 'Pizza Muzzarella', categoria: 'comida', precio: 6000, stock: 10 },
        { nombre: 'Hamburguesa Completa', categoria: 'comida', precio: 4500, stock: 20 },
        { nombre: 'Super Pancho', categoria: 'comida', precio: 2500, stock: 30 },
        { nombre: 'Tostado Jamón y Queso', categoria: 'comida', precio: 3500, stock: 15 },

        // Snacks / Golosinas
        { nombre: 'Alfajor Chocolate', categoria: 'snack', precio: 800, stock: 40 },
        { nombre: 'Papas Lays 145g', categoria: 'snack', precio: 2200, stock: 20 },
        { nombre: 'Chocolate Block 38g', categoria: 'snack', precio: 1200, stock: 25 },
        { nombre: 'Turrón', categoria: 'snack', precio: 300, stock: 100 }
    ];

    try {
        console.log('Iniciando carga de productos...');

        for (const p of products) {
            await pool.query(
                'INSERT INTO productos (nombre, categoria, precio, stock) VALUES ($1, $2, $3, $4)',
                [p.nombre, p.categoria, p.precio, p.stock]
            );
        }

        console.log('Productos cargados exitosamente!');
    } catch (err) {
        console.error('Error al cargar productos:', err);
    } finally {
        pool.end();
    }
};

seedProducts();
