/**
 * Script para limpiar la base de datos excepto los usuarios
 * Uso: node src/scripts/limpiar-db-excepto-usuarios.js
 */

const {
  sequelize,
  Usuario,
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
} = require("../models");

async function limpiarBaseDatos() {
  try {
    console.log("🔄 Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("✅ Conexión establecida correctamente.");

    console.log("\n🧹 Limpiando base de datos (conservando usuarios)...\n");

    // Usar transaction para seguridad
    const t = await sequelize.transaction();

    try {
      // Orden de limpieza importante por las relaciones
      console.log("  - Eliminando Movimientos...");
      await Movimiento.destroy({
        truncate: true,
        cascade: true,
        transaction: t,
      });

      console.log("  - Eliminando Mensajes...");
      await Mensaje.destroy({ truncate: true, cascade: true, transaction: t });

      console.log("  - Eliminando Conversaciones...");
      await Conversacion.destroy({
        truncate: true,
        cascade: true,
        transaction: t,
      });

      console.log("  - Eliminando StockCliente...");
      await StockCliente.destroy({
        truncate: true,
        cascade: true,
        transaction: t,
      });

      console.log("  - Eliminando Entregas...");
      await Entrega.destroy({ truncate: true, cascade: true, transaction: t });

      console.log("  - Eliminando Calificaciones...");
      await Calificacion.destroy({
        truncate: true,
        cascade: true,
        transaction: t,
      });

      console.log("  - Eliminando Envios...");
      await Envio.destroy({ truncate: true, cascade: true, transaction: t });

      console.log("  - Eliminando PedidoProducto...");
      await PedidoProducto.destroy({
        truncate: true,
        cascade: true,
        transaction: t,
      });

      console.log("  - Eliminando Pedidos...");
      await Pedido.destroy({ truncate: true, cascade: true, transaction: t });

      console.log("  - Eliminando Productos...");
      await Producto.destroy({ truncate: true, cascade: true, transaction: t });

      console.log("  - Eliminando UsuarioRelacion...");
      await UsuarioRelacion.destroy({
        truncate: true,
        cascade: true,
        transaction: t,
      });

      // Commit de la transacción
      await t.commit();

      // Verificar que los usuarios siguen ahí
      const countUsuarios = await Usuario.count();
      console.log(`\n✅ Limpieza completada.`);
      console.log(`📊 Usuarios restantes: ${countUsuarios}`);
      console.log("\n📋 Resumen de tablas limpiadas:");
      console.log("   - Movimientos");
      console.log("   - Mensajes");
      console.log("   - Conversaciones");
      console.log("   - StockCliente");
      console.log("   - Entregas");
      console.log("   - Calificaciones");
      console.log("   - Envios");
      console.log("   - PedidoProducto");
      console.log("   - Pedidos");
      console.log("   - Productos");
      console.log("   - UsuarioRelacion");
      console.log("\n⚠️  Tablas conservadas:");
      console.log("   - Usuarios");
    } catch (error) {
      // Rollback en caso de error
      await t.rollback();
      throw error;
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al limpiar la base de datos:", error);
    await sequelize.close();
    process.exit(1);
  }
}

limpiarBaseDatos();
