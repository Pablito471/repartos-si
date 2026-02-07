// Script para agregar campos de datos bancarios a la tabla usuarios
require("dotenv").config();
const sequelize = require("../config/database");

const addDatosBancariosColumns = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión establecida");

    // Agregar columna alias_bancario
    try {
      await sequelize.query(`
        ALTER TABLE usuarios 
        ADD COLUMN IF NOT EXISTS alias_bancario VARCHAR(255);
      `);
      console.log("✅ Columna alias_bancario agregada");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("ℹ️ La columna alias_bancario ya existe");
      } else {
        throw err;
      }
    }

    // Agregar columna cbu
    try {
      await sequelize.query(`
        ALTER TABLE usuarios 
        ADD COLUMN IF NOT EXISTS cbu VARCHAR(22);
      `);
      console.log("✅ Columna cbu agregada");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("ℹ️ La columna cbu ya existe");
      } else {
        throw err;
      }
    }

    // Agregar columna cvu
    try {
      await sequelize.query(`
        ALTER TABLE usuarios 
        ADD COLUMN IF NOT EXISTS cvu VARCHAR(22);
      `);
      console.log("✅ Columna cvu agregada");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("ℹ️ La columna cvu ya existe");
      } else {
        throw err;
      }
    }

    // Agregar columna banco
    try {
      await sequelize.query(`
        ALTER TABLE usuarios 
        ADD COLUMN IF NOT EXISTS banco VARCHAR(255);
      `);
      console.log("✅ Columna banco agregada");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("ℹ️ La columna banco ya existe");
      } else {
        throw err;
      }
    }

    // Agregar columna titular_cuenta
    try {
      await sequelize.query(`
        ALTER TABLE usuarios 
        ADD COLUMN IF NOT EXISTS titular_cuenta VARCHAR(255);
      `);
      console.log("✅ Columna titular_cuenta agregada");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("ℹ️ La columna titular_cuenta ya existe");
      } else {
        throw err;
      }
    }

    console.log("\n🎉 Migración completada exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la migración:", error);
    process.exit(1);
  }
};

addDatosBancariosColumns();
