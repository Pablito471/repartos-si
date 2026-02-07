/**
 * Script de migración para agregar empleado_id a la tabla movimientos
 * Ejecutar con: node src/scripts/addEmpleadoIdToMovimientos.js
 */

require("dotenv").config();
const { sequelize } = require("../models");

async function migrate() {
  try {
    console.log("Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("✓ Conexión establecida");

    // Verificar si la columna ya existe
    const [columns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'movimientos' AND column_name = 'empleado_id'
    `);

    if (columns.length > 0) {
      console.log("✓ La columna empleado_id ya existe en movimientos");
      await sequelize.close();
      return;
    }

    console.log("Agregando columna empleado_id a movimientos...");

    // Agregar la columna empleado_id
    await sequelize.query(`
      ALTER TABLE movimientos 
      ADD COLUMN empleado_id UUID REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
    `);

    console.log("✓ Columna empleado_id agregada correctamente");

    // Crear índice para mejorar rendimiento de consultas
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_movimientos_empleado_id 
      ON movimientos(empleado_id)
    `);

    console.log("✓ Índice creado correctamente");

    await sequelize.close();
    console.log("\n✅ Migración completada exitosamente");
  } catch (error) {
    console.error("❌ Error en la migración:", error.message);
    process.exit(1);
  }
}

migrate();
