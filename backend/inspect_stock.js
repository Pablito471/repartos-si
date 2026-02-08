const { StockCliente } = require('./src/models');
const sequelize = require('./src/config/database');

async function check() {
    try {
        await sequelize.authenticate();

        // Simulate obtenerStock logic
        const clienteId = '7f6301a1-cb0c-4f06-a99d-28d5689b6202';
        const stock = await StockCliente.findAll({
            where: { clienteId },
            order: [["nombre", "ASC"]],
        });

        const stockAgrupado = {};
        stock.forEach((item) => {
            if (!stockAgrupado[item.nombre]) {
                stockAgrupado[item.nombre] = {
                    id: item.id,
                    nombre: item.nombre,
                    cantidad: 0,
                    precioCosto:
                        parseFloat(item.precioCosto) || parseFloat(item.precio) || 0,
                    precioVenta:
                        parseFloat(item.precioVenta) || parseFloat(item.precio) || 0,
                    precio: parseFloat(item.precioVenta) || parseFloat(item.precio) || 0,
                    categoria: item.categoria || "General",
                    imagen: item.imagen || null,
                    codigoBarras: item.codigoBarras || null,
                    esGranel: item.esGranel || false,
                    unidadMedida: item.unidadMedida || "unidad",
                    precioUnidad: parseFloat(item.precioUnidad) || null,
                    ultimaActualizacion: item.updatedAt,
                };
            }
            stockAgrupado[item.nombre].cantidad += parseFloat(item.cantidad);

            if (
                new Date(item.updatedAt) >
                new Date(stockAgrupado[item.nombre].ultimaActualizacion)
            ) {
                stockAgrupado[item.nombre].ultimaActualizacion = item.updatedAt;
            }

            if (item.imagen && !stockAgrupado[item.nombre].imagen) {
                stockAgrupado[item.nombre].imagen = item.imagen;
            }

            if (item.codigoBarras && !stockAgrupado[item.nombre].codigoBarras) {
                stockAgrupado[item.nombre].codigoBarras = item.codigoBarras;
            }
        });

        console.log('--- API RESPONSE SIMULATION ---');
        console.log(JSON.stringify(Object.values(stockAgrupado), null, 2));
        console.log('-------------------------------');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

check();
