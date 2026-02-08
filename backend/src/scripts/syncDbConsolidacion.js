const sequelize = require("../config/database");
const { ProductoRelacion } = require("../models");

async function syncDb() {
  try {
    console.log(
      "Sincronizando base de datos con el modelo ProductoRelacion...",
    );

    // Sincronizar solo el modelo ProductoRelacion
    await ProductoRelacion.sync({ alter: true });

    console.log("Tabla productos_relaciones creada/actualizada correctamente.");

    process.exit(0);
  } catch (error) {
    console.error("Error al sincronizar la base de datos:", error);
    process.exit(1);
  }
}

syncDb();
