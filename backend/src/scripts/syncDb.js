require("dotenv").config();
const { sequelize } = require("../models");

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true }); // ⚠️ Esto borra todos los datos
    console.log("✅ Modelos sincronizados (tablas recreadas)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

syncDatabase();
