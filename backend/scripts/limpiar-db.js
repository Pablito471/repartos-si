const { sequelize } = require("../src/models");
const Usuario = require("../src/models/Usuario");

async function limpiarDB() {
  try {
    console.log("Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("Conexión establecida.");

    // Limpiar todas las tablas relacionadas
    console.log("\nLimpiando tablas...");
    await sequelize.query("TRUNCATE TABLE calificaciones CASCADE");
    await sequelize.query("TRUNCATE TABLE mensajes CASCADE");
    await sequelize.query("TRUNCATE TABLE conversaciones CASCADE");
    await sequelize.query("TRUNCATE TABLE envios CASCADE");
    await sequelize.query("TRUNCATE TABLE pedido_productos CASCADE");
    await sequelize.query("TRUNCATE TABLE pedidos CASCADE");
    await sequelize.query("TRUNCATE TABLE productos CASCADE");
    await sequelize.query("TRUNCATE TABLE usuario_relaciones CASCADE");
    console.log("Tablas limpiadas.");

    // Ver usuarios actuales
    console.log("\nUsuarios actuales:");
    const usuarios = await Usuario.findAll({
      attributes: ["id", "nombre", "email", "tipoUsuario"],
      order: [["tipoUsuario", "ASC"]],
    });

    usuarios.forEach((u) => {
      console.log(`  ${u.tipoUsuario}: ${u.nombre} (${u.email}) - ${u.id}`);
    });

    // Agrupar por tipo
    const porTipo = {};
    usuarios.forEach((u) => {
      if (!porTipo[u.tipoUsuario]) porTipo[u.tipoUsuario] = [];
      porTipo[u.tipoUsuario].push(u);
    });

    console.log(
      "\nEliminando usuarios duplicados (manteniendo uno por rol)...",
    );

    for (const tipo of Object.keys(porTipo)) {
      if (tipo === "admin") {
        console.log(`  admin: Saltando (no tocar)`);
        continue;
      }

      const lista = porTipo[tipo];
      if (lista.length > 1) {
        // Mantener el primero, eliminar el resto
        const mantener = lista[0];
        const eliminar = lista.slice(1);

        for (const u of eliminar) {
          await Usuario.destroy({ where: { id: u.id } });
          console.log(`  Eliminado: ${u.nombre} (${u.email})`);
        }

        console.log(`  Mantenido: ${mantener.nombre} (${mantener.email})`);
      } else {
        console.log(`  ${tipo}: Solo hay uno, se mantiene`);
      }
    }

    // Mostrar usuarios finales
    console.log("\n=== USUARIOS FINALES ===");
    const finales = await Usuario.findAll({
      attributes: ["id", "nombre", "email", "tipoUsuario"],
      order: [["tipoUsuario", "ASC"]],
    });

    finales.forEach((u) => {
      console.log(`  ${u.tipoUsuario}: ${u.nombre} (${u.email})`);
      console.log(`    ID: ${u.id}`);
    });

    console.log("\n¡Base de datos limpia!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

limpiarDB();
