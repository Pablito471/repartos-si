/**
 * Script para agregar columnas precio_costo y precio_venta a la tabla stock_clientes
 * Ejecutar con: node src/scripts/addPrecioColumns.js
 */
require("dotenv").config();
const sequelize = require("../config/database");

async function addColumns() {
  try {
    console.log("Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("Conexión exitosa.");

    console.log("Agregando columnas precio_costo y precio_venta...");

    // Agregar columna precio_costo
    await sequelize.query(`
      ALTER TABLE stock_clientes 
      ADD COLUMN IF NOT EXISTS precio_costo DECIMAL(10, 2);
    `);
    console.log("✓ Columna precio_costo agregada");

    // Agregar columna precio_venta
    await sequelize.query(`
      ALTER TABLE stock_clientes 
      ADD COLUMN IF NOT EXISTS precio_venta DECIMAL(10, 2);
    `);
    console.log("✓ Columna precio_venta agregada");

    // Migrar datos existentes: copiar precio a precio_venta para registros existentes
    await sequelize.query(`
      UPDATE stock_clientes 
      SET precio_venta = precio 
      WHERE precio_venta IS NULL AND precio IS NOT NULL;
    `);
    console.log("✓ Datos migrados: precio -> precio_venta");

    console.log("\n✅ Migración completada exitosamente!");
    console.log(
      "\nNota: Los registros existentes ahora tienen precio_venta = precio original.",
    );
    console.log("El campo precio se mantiene para compatibilidad.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la migración:", error.message);
    process.exit(1);
  }
}

addColumns();
