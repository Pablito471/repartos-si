/**
 * Script para crear productos de prueba con códigos de barras
 * Ejecutar: node scripts/crear-producto-prueba.js
 */

require("dotenv").config();
const { StockCliente, Usuario } = require("../src/models");
const sequelize = require("../src/config/database");

async function crearProductosPrueba() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a la base de datos");

    // Buscar un cliente existente
    const cliente = await Usuario.findOne({
      where: { tipoUsuario: "cliente" },
    });

    if (!cliente) {
      console.log("❌ No se encontró ningún cliente. Crea uno primero.");
      process.exit(1);
    }

    console.log(`📦 Cliente encontrado: ${cliente.nombre} (${cliente.id})`);

    // Productos de prueba con códigos de barras
    const productosPrueba = [
      {
        nombre: "Coca Cola 2.25L",
        cantidad: 50,
        precio: 2500,
        codigoBarras: "STKTEST001",
        categoria: "Bebidas",
      },
      {
        nombre: "Pepsi 2L",
        cantidad: 30,
        precio: 2200,
        codigoBarras: "STKTEST002",
        categoria: "Bebidas",
      },
      {
        nombre: "Fanta Naranja 2L",
        cantidad: 25,
        precio: 2000,
        codigoBarras: "STKTEST003",
        categoria: "Bebidas",
      },
      {
        nombre: "Agua Mineral 1.5L",
        cantidad: 100,
        precio: 800,
        codigoBarras: "STKTEST004",
        categoria: "Bebidas",
      },
      {
        nombre: "Galletitas Oreo",
        cantidad: 40,
        precio: 1500,
        codigoBarras: "STKTEST005",
        categoria: "Snacks",
      },
    ];

    console.log("\n🔄 Creando productos de prueba...\n");

    for (const producto of productosPrueba) {
      // Verificar si ya existe
      const existe = await StockCliente.findOne({
        where: {
          clienteId: cliente.id,
          codigoBarras: producto.codigoBarras,
        },
      });

      if (existe) {
        console.log(
          `⚠️  ${producto.nombre} ya existe con código ${producto.codigoBarras}`,
        );
        continue;
      }

      await StockCliente.create({
        clienteId: cliente.id,
        ...producto,
      });

      console.log(`✅ Creado: ${producto.nombre}`);
      console.log(`   📊 Código: ${producto.codigoBarras}`);
      console.log(`   💰 Precio: $${producto.precio}`);
      console.log(`   📦 Cantidad: ${producto.cantidad}\n`);
    }

    console.log("\n========================================");
    console.log("🎉 ¡Productos de prueba creados!");
    console.log("========================================");
    console.log("\n📋 Códigos de barras disponibles para escanear:");
    console.log("   - STKTEST001 (Coca Cola 2.25L)");
    console.log("   - STKTEST002 (Pepsi 2L)");
    console.log("   - STKTEST003 (Fanta Naranja 2L)");
    console.log("   - STKTEST004 (Agua Mineral 1.5L)");
    console.log("   - STKTEST005 (Galletitas Oreo)");
    console.log("\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

crearProductosPrueba();
