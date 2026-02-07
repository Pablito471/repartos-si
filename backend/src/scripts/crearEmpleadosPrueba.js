/**
 * Script para crear empleados de prueba
 * Ejecutar con: node src/scripts/crearEmpleadosPrueba.js
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, Usuario } = require("../models");

async function crearEmpleados() {
  try {
    console.log("Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("✓ Conexión establecida\n");

    // Buscar un depósito existente
    const deposito = await Usuario.findOne({
      where: { tipoUsuario: "deposito" },
    });

    // Buscar un cliente existente
    const cliente = await Usuario.findOne({
      where: { tipoUsuario: "cliente" },
    });

    if (!deposito) {
      console.log("❌ No se encontró ningún depósito en la base de datos");
      await sequelize.close();
      return;
    }

    if (!cliente) {
      console.log("❌ No se encontró ningún cliente en la base de datos");
      await sequelize.close();
      return;
    }

    console.log(
      `📦 Depósito encontrado: ${deposito.nombre} (${deposito.email})`,
    );
    console.log(
      `🛒 Cliente encontrado: ${cliente.nombre} (${cliente.email})\n`,
    );

    // Crear empleados para el depósito
    const empleadoDeposito1 = await Usuario.create({
      email: "empleado.dep1@test.com",
      password: "123456",
      tipoUsuario: "empleado",
      nombre: "Juan Pérez (Empleado Depósito)",
      telefono: "11-1111-1111",
      empleadorId: deposito.id,
      tipoEmpleador: "deposito",
      activo: true,
    });
    console.log(`✓ Empleado creado: ${empleadoDeposito1.nombre}`);
    console.log(`  Email: ${empleadoDeposito1.email}`);
    console.log(`  Password: 123456`);
    console.log(`  Empleador: ${deposito.nombre}\n`);

    const empleadoDeposito2 = await Usuario.create({
      email: "empleado.dep2@test.com",
      password: "123456",
      tipoUsuario: "empleado",
      nombre: "María García (Empleado Depósito)",
      telefono: "11-2222-2222",
      empleadorId: deposito.id,
      tipoEmpleador: "deposito",
      activo: true,
    });
    console.log(`✓ Empleado creado: ${empleadoDeposito2.nombre}`);
    console.log(`  Email: ${empleadoDeposito2.email}`);
    console.log(`  Password: 123456`);
    console.log(`  Empleador: ${deposito.nombre}\n`);

    // Crear empleados para el cliente
    const empleadoCliente1 = await Usuario.create({
      email: "empleado.cli1@test.com",
      password: "123456",
      tipoUsuario: "empleado",
      nombre: "Carlos López (Empleado Cliente)",
      telefono: "11-3333-3333",
      empleadorId: cliente.id,
      tipoEmpleador: "cliente",
      activo: true,
    });
    console.log(`✓ Empleado creado: ${empleadoCliente1.nombre}`);
    console.log(`  Email: ${empleadoCliente1.email}`);
    console.log(`  Password: 123456`);
    console.log(`  Empleador: ${cliente.nombre}\n`);

    const empleadoCliente2 = await Usuario.create({
      email: "empleado.cli2@test.com",
      password: "123456",
      tipoUsuario: "empleado",
      nombre: "Ana Rodríguez (Empleado Cliente)",
      telefono: "11-4444-4444",
      empleadorId: cliente.id,
      tipoEmpleador: "cliente",
      activo: false, // Este está inactivo para pruebas
    });
    console.log(`✓ Empleado creado: ${empleadoCliente2.nombre} (INACTIVO)`);
    console.log(`  Email: ${empleadoCliente2.email}`);
    console.log(`  Password: 123456`);
    console.log(`  Empleador: ${cliente.nombre}\n`);

    await sequelize.close();

    console.log("═".repeat(50));
    console.log("✅ Empleados creados exitosamente!");
    console.log("═".repeat(50));
    console.log("\nResumen de credenciales:");
    console.log("─".repeat(50));
    console.log("EMPLEADOS DE DEPÓSITO:");
    console.log("  • empleado.dep1@test.com / 123456");
    console.log("  • empleado.dep2@test.com / 123456");
    console.log("\nEMPLEADOS DE CLIENTE:");
    console.log("  • empleado.cli1@test.com / 123456");
    console.log("  • empleado.cli2@test.com / 123456 (inactivo)");
    console.log("─".repeat(50));
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      console.log("⚠️ Algunos empleados ya existen en la base de datos");
      console.log(
        "Los emails ya registrados:",
        error.errors?.map((e) => e.value).join(", "),
      );
    } else {
      console.error("❌ Error:", error.message);
    }
    process.exit(1);
  }
}

crearEmpleados();
