/**
 * Script para agregar columnas precio_costo y precio_venta a la tabla stock_clientes
 * Ejecutar con: node src/scripts/addPrecioColumns.js
 */
require("dotenv").config();
const sequelize = require("../config/database");

async function addColumns() {
  try {
    await sequelize.authenticate();
    // Agregar columna precio_costo
    await sequelize.query(`
      ALTER TABLE stock_clientes 
      ADD COLUMN IF NOT EXISTS precio_costo DECIMAL(10, 2);
    `);
    // Agregar columna precio_venta
    await sequelize.query(`
      ALTER TABLE stock_clientes 
      ADD COLUMN IF NOT EXISTS precio_venta DECIMAL(10, 2);
    `);
    // Migrar datos existentes: copiar precio a precio_venta para registros existentes
    await sequelize.query(`
      UPDATE stock_clientes 
      SET precio_venta = precio 
      WHERE precio_venta IS NULL AND precio IS NOT NULL;
    `);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la migración:", error.message);
    process.exit(1);
  }
}

addColumns();
