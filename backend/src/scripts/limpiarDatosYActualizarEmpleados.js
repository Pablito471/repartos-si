/**
 * Script para limpiar la base de datos excepto usuarios
 * y actualizar emails de empleados
 * Ejecutar con: node src/scripts/limpiarDatosYActualizarEmpleados.js
 */

require("dotenv").config();
const { sequelize, Usuario } = require("../models");

async function limpiar() {
  try {
    console.log("Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("✓ Conexión establecida\n");

    // 1. Limpiar tablas (excepto usuarios)
    console.log("Limpiando tablas...\n");

    const tablasALimpiar = [
      "pedido_productos",
      "pedidos",
      "envios",
      "entregas",
      "movimientos",
      "calificaciones",
      "mensajes",
      "conversaciones",
      "stock_clientes",
      "productos",
    ];

    for (const tabla of tablasALimpiar) {
      try {
        await sequelize.query(`DELETE FROM "${tabla}"`);
        console.log(`  ✓ Tabla ${tabla} limpiada`);
      } catch (err) {
        console.log(`  ⚠ Tabla ${tabla}: ${err.message}`);
      }
    }

    // 2. Actualizar emails de empleados
    console.log("\nActualizando emails de empleados...\n");

    // Cambiar empleados de depósito
    const empleadosDep = await Usuario.findAll({
      where: { tipoUsuario: "empleado", tipoEmpleador: "deposito" },
    });

    let contador = 1;
    for (const emp of empleadosDep) {
      const nuevoEmail = `empleado${contador}@test.com`;
      await emp.update({ email: nuevoEmail });
      console.log(`  ✓ ${emp.nombre}: ${nuevoEmail}`);
      contador++;
    }

    // Cambiar empleados de cliente
    const empleadosCli = await Usuario.findAll({
      where: { tipoUsuario: "empleado", tipoEmpleador: "cliente" },
    });

    for (const emp of empleadosCli) {
      const nuevoEmail = `empleado${contador}@test.com`;
      await emp.update({ email: nuevoEmail });
      console.log(`  ✓ ${emp.nombre}: ${nuevoEmail}`);
      contador++;
    }

    await sequelize.close();

    console.log("\n" + "═".repeat(50));
    console.log("✅ Limpieza completada!");
    console.log("═".repeat(50));
    console.log("\nTablas limpiadas (datos eliminados):");
    tablasALimpiar.forEach((t) => console.log(`  • ${t}`));
    console.log("\nUsuarios conservados con emails actualizados.");
    console.log("\nCredenciales de empleados:");
    for (let i = 1; i < contador; i++) {
      console.log(`  • empleado${i}@test.com / 123456`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

limpiar();
