/**
 * Script para agregar columnas entregado y fecha_entregado a la tabla mensajes
 * Ejecutar con: node src/scripts/addEntregadoColumn.js
 */
require("dotenv").config();
const sequelize = require("../config/database");

async function addColumns() {
  try {
    console.log("Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("Conexión exitosa.");

    console.log("Agregando columnas entregado y fecha_entregado...");

    await sequelize.query(`
      ALTER TABLE mensajes 
      ADD COLUMN IF NOT EXISTS entregado BOOLEAN DEFAULT false;
    `);
    console.log("✓ Columna entregado agregada");

    await sequelize.query(`
      ALTER TABLE mensajes 
      ADD COLUMN IF NOT EXISTS fecha_entregado TIMESTAMP;
    `);
    console.log("✓ Columna fecha_entregado agregada");

    console.log("\n✅ Migración completada exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la migración:", error.message);
    process.exit(1);
  }
}

addColumns();
