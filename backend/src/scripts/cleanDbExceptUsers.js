require("dotenv").config();
const {
  sequelize,
  Producto,
  Pedido,
  PedidoProducto,
  Envio,
  Calificacion,
  Entrega,
  StockCliente,
  UsuarioRelacion,
  Mensaje,
  Conversacion,
  Movimiento,
  ProductoRelacion,
  CodigoAlternativo,
  CodigoAlternativoCliente,
} = require("../models");

const cleanDbExceptUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a la base de datos.");

    // Orden de borrado para respetar claves foráneas (hijos primero)
    
    // 1. Tablas que dependen de otras (hojas)
    console.log("🗑️ Eliminando StockCliente...");
    await StockCliente.destroy({ where: {}, truncate: false }); // truncate: cascade en algunos dialectos

    console.log("🗑️ Eliminando Detalles de Pedidos (PedidoProducto)...");
    await PedidoProducto.destroy({ where: {}, truncate: false });
    
    console.log("🗑️ Eliminando Movimientos...");
    await Movimiento.destroy({ where: {}, truncate: false });

    console.log("🗑️ Eliminando Calificaciones...");
    await Calificacion.destroy({ where: {}, truncate: false });

    console.log("🗑️ Eliminando Mensajes...");
    await Mensaje.destroy({ where: {}, truncate: false });

    console.log("🗑️ Eliminando Relaciones de Productos...");
    await ProductoRelacion.destroy({ where: {}, truncate: false });

    console.log("🗑️ Eliminando Códigos Alternativos...");
    await CodigoAlternativo.destroy({ where: {}, truncate: false });
    await CodigoAlternativoCliente.destroy({ where: {}, truncate: false });

    // 2. Tablas intermedias
    console.log("🗑️ Eliminando Entregas...");
    await Entrega.destroy({ where: {}, truncate: false });

    console.log("🗑️ Eliminando Envíos...");
    await Envio.destroy({ where: {}, truncate: false });

    console.log("🗑️ Eliminando Conversaciones...");
    await Conversacion.destroy({ where: {}, truncate: false });

     console.log("🗑️ Eliminando Relaciones de Usuarios...");
    await UsuarioRelacion.destroy({ where: {}, truncate: false });

    // 3. Tablas principales (excepto Usuarios)
    console.log("🗑️ Eliminando Pedidos...");
    await Pedido.destroy({ where: {}, truncate: false });

    console.log("🗑️ Eliminando Productos...");
    await Producto.destroy({ where: {}, truncate: false });

    console.log("✨ Base de datos limpiada exitosamente (Usuarios conservados).");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al limpiar la base de datos:", error);
    process.exit(1);
  }
};

cleanDbExceptUsers();
