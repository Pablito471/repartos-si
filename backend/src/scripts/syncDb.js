require("dotenv").config();
const { sequelize } = require("../models");

const syncDatabase = async () => {
  try {
    console.log("Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("✅ Conexión establecida");

    console.log("Sincronizando modelos...");
    await sequelize.sync({ force: true }); // ⚠️ Esto borra todos los datos
    console.log("✅ Modelos sincronizados (tablas recreadas)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

syncDatabase();
