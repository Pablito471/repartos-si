/**
 * Script para agregar las columnas de verificación de email y recuperación de contraseña
 * Ejecutar con: node src/scripts/addVerificationColumns.js
 */

require("dotenv").config();
const sequelize = require("../config/database");

async function addVerificationColumns() {
  try {
    console.log("🔄 Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("✅ Conexión establecida");

    console.log("🔄 Agregando columnas de verificación...");

    // Agregar columnas de reset de contraseña
    await sequelize
      .query(
        `
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP WITH TIME ZONE;
    `,
      )
      .catch((err) => {
        if (!err.message.includes("already exists")) {
          console.log("⚠️ Columnas de reset ya existen o error:", err.message);
        }
      });

    // Agregar columnas de verificación de email
    await sequelize
      .query(
        `
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE;
    `,
      )
      .catch((err) => {
        if (!err.message.includes("already exists")) {
          console.log(
            "⚠️ Columnas de verificación ya existen o error:",
            err.message,
          );
        }
      });

    console.log("✅ Columnas agregadas exitosamente");

    // Verificar que las columnas existen
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      AND column_name IN (
        'reset_password_token', 
        'reset_password_expires', 
        'email_verificado', 
        'email_verification_token', 
        'email_verification_expires'
      );
    `);

    console.log("\n📋 Columnas verificadas:");
    results.forEach((row) => console.log(`   ✓ ${row.column_name}`));

    if (results.length === 5) {
      console.log("\n✅ Todas las columnas están presentes");
    } else {
      console.log(`\n⚠️ Faltan ${5 - results.length} columnas`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

addVerificationColumns();
