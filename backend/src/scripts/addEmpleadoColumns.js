require("dotenv").config();
const { sequelize } = require("../models");

const addEmpleadoColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    await sequelize.authenticate();
    console.log("✅ Conexión establecida");

    // Primero buscar el nombre real del ENUM de tipoUsuario
    const [enumTypes] = await sequelize.query(`
      SELECT typname FROM pg_type 
      WHERE typname LIKE '%tipo%usuario%' OR typname LIKE '%tipo_usuario%'
      ORDER BY typname;
    `);

    console.log("ENUMs encontrados:", enumTypes);

    // Buscar el nombre correcto del ENUM (sin prefijo _ que indica array)
    let enumName = null;
    for (const row of enumTypes) {
      if (
        row.typname.includes("tipo") &&
        row.typname.includes("usuario") &&
        !row.typname.startsWith("_")
      ) {
        enumName = row.typname;
        break;
      }
    }

    if (!enumName) {
      // Si no encontramos, intentar con el nombre por defecto de Sequelize
      const [allEnums] = await sequelize.query(`
        SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;
      `);
      console.log("Todos los ENUMs:", allEnums);

      // Buscar uno que tenga los valores de usuario
      for (const row of allEnums) {
        const [values] = await sequelize.query(`
          SELECT enumlabel FROM pg_enum 
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = '${row.typname}')
        `);
        const labels = values.map((v) => v.enumlabel);
        if (
          labels.includes("cliente") ||
          labels.includes("deposito") ||
          labels.includes("admin")
        ) {
          enumName = row.typname;
          console.log(
            `✅ ENUM encontrado: ${enumName} con valores: ${labels.join(", ")}`,
          );
          break;
        }
      }
    }

    if (!enumName) {
      throw new Error("No se encontró el ENUM de tipoUsuario");
    }

    // Verificar si ya existe el tipo empleado en el ENUM
    const [enumResult] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'empleado' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = '${enumName}')
      ) as exists;
    `);

    if (!enumResult[0]?.exists) {
      console.log("📝 Agregando tipo 'empleado' al ENUM...");
      await sequelize.query(`
        ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS 'empleado';
      `);
      console.log("✅ Tipo 'empleado' agregado al ENUM");
    } else {
      console.log("ℹ️ El tipo 'empleado' ya existe en el ENUM");
    }

    // Verificar y agregar columna empleador_id (usando snake_case)
    const [empleadorResult] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'empleador_id'
      ) as exists;
    `);

    if (!empleadorResult[0]?.exists) {
      console.log("📝 Agregando columna empleador_id...");
      await sequelize.query(`
        ALTER TABLE usuarios ADD COLUMN empleador_id UUID REFERENCES usuarios(id);
      `);
      console.log("✅ Columna empleador_id agregada");
    } else {
      console.log("ℹ️ La columna empleador_id ya existe");
    }

    // Verificar y agregar columna tipo_empleador
    const [tipoEmpleadorResult] = await sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'tipo_empleador'
      ) as exists;
    `);

    if (!tipoEmpleadorResult[0]?.exists) {
      console.log("📝 Agregando columna tipo_empleador...");
      await sequelize.query(`
        ALTER TABLE usuarios ADD COLUMN tipo_empleador VARCHAR(20) CHECK (tipo_empleador IN ('cliente', 'deposito'));
      `);
      console.log("✅ Columna tipo_empleador agregada");
    } else {
      console.log("ℹ️ La columna tipo_empleador ya existe");
    }

    console.log("\n🎉 Migración completada exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la migración:", error);
    process.exit(1);
  }
};

addEmpleadoColumns();
