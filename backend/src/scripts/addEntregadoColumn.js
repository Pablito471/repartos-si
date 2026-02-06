/**
 * Script para agregar columnas entregado y fecha_entregado a la tabla mensajes
 * Ejecutar con: node src/scripts/addEntregadoColumn.js
 */
require("dotenv").config();
const sequelize = require("../config/database");

async function addColumns() {
  try {
    await sequelize.authenticate();
    await sequelize.query(`
      ALTER TABLE mensajes 
      ADD COLUMN IF NOT EXISTS entregado BOOLEAN DEFAULT false;
    `);
    await sequelize.query(`
      ALTER TABLE mensajes 
      ADD COLUMN IF NOT EXISTS fecha_entregado TIMESTAMP;
    `);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la migración:", error.message);
    process.exit(1);
  }
}

addColumns();
