const pool = require('../src/config/db');
const VentaModel = require('../src/models/VentaModel');
const ProductoModel = require('../src/models/ProductoModel');

const verifySales = async () => {
    try {
        console.log('Iniciando verificación del Módulo de Ventas...');

        // 1. Crear un producto de prueba
        const producto = await ProductoModel.create({
            nombre: 'Producto Test ' + Date.now(),
            categoria: 'Test',
            precio: 100,
            stock: 50
        });
        console.log('Producto de prueba creado:', producto);

        // 2. Crear una venta
        const ventaData = {
            items: [
                {
                    producto_id: producto.id,
                    cantidad: 5,
                    precio_unitario: 100
                }
            ],
            total: 500
        };

        const venta = await VentaModel.create(ventaData);
        console.log('Venta creada:', venta);

        // 3. Verificar stock actualizado
        const productoActualizado = await ProductoModel.getById(producto.id);
        console.log('Stock actualizado:', productoActualizado.stock);

        if (productoActualizado.stock === 45) {
            console.log('VERIFICACIÓN EXITOSA: El stock se actualizó correctamente.');
        } else {
            console.error('FALLO VERIFICACIÓN: El stock no se actualizó correctamente.');
            process.exit(1);
        }

        // 4. Verificar historial de ventas
        const ventas = await VentaModel.getAll();
        if (ventas.length > 0 && ventas[0].id === venta.id) {
            console.log('VERIFICACIÓN EXITOSA: La venta aparece en el historial.');
        } else {
            console.error('FALLO VERIFICACIÓN: La venta no aparece correctamente en el historial.');
        }

        // Limpieza (Opcional, pero buena práctica para no llenar la BD de basura)
        // await ProductoModel.delete(producto.id); 
        // Nota: No podemos borrar la venta fácilmente sin borrar detalles por FK, dejémoslo así por ahora.

        process.exit(0);
    } catch (error) {
        console.error('Error durante la verificación:', error);
        process.exit(1);
    }
};

verifySales();
