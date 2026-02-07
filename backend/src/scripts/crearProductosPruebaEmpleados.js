/**
 * Script para crear productos de prueba para empleados
 * Ejecutar con: node src/scripts/crearProductosPruebaEmpleados.js
 */

require("dotenv").config();
const { sequelize, Usuario, Producto, StockCliente } = require("../models");

async function crearProductos() {
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
      console.log("❌ No se encontró ningún depósito");
      await sequelize.close();
      return;
    }

    console.log(`📦 Depósito: ${deposito.nombre}`);
    console.log(`🛒 Cliente: ${cliente?.nombre || "No encontrado"}\n`);

    // Productos de prueba con códigos de barras comunes
    const productosDeposito = [
      {
        codigo: "7790001000012",
        nombre: "Coca-Cola 500ml",
        categoria: "Bebidas",
        precio: 800,
        precioVenta: 1200,
        stock: 100,
        depositoId: deposito.id,
        activo: true,
      },
      {
        codigo: "7790001000029",
        nombre: "Fanta Naranja 500ml",
        categoria: "Bebidas",
        precio: 750,
        precioVenta: 1100,
        stock: 80,
        depositoId: deposito.id,
        activo: true,
      },
      {
        codigo: "7790001000036",
        nombre: "Sprite 500ml",
        categoria: "Bebidas",
        precio: 750,
        precioVenta: 1100,
        stock: 60,
        depositoId: deposito.id,
        activo: true,
      },
      {
        codigo: "7790895000102",
        nombre: "Galletitas Oreo",
        categoria: "Snacks",
        precio: 500,
        precioVenta: 850,
        stock: 50,
        depositoId: deposito.id,
        activo: true,
      },
      {
        codigo: "7790895000119",
        nombre: "Papas Lays Clásicas",
        categoria: "Snacks",
        precio: 600,
        precioVenta: 950,
        stock: 40,
        depositoId: deposito.id,
        activo: true,
      },
      {
        codigo: "123456789012",
        nombre: "Producto Test 1",
        categoria: "General",
        precio: 100,
        precioVenta: 150,
        stock: 200,
        depositoId: deposito.id,
        activo: true,
      },
      {
        codigo: "111111111111",
        nombre: "Producto Fácil De Testear",
        categoria: "General",
        precio: 50,
        precioVenta: 100,
        stock: 500,
        depositoId: deposito.id,
        activo: true,
      },
    ];

    console.log("Creando productos para depósito...");
    for (const prod of productosDeposito) {
      try {
        const [producto, created] = await Producto.findOrCreate({
          where: { codigo: prod.codigo, depositoId: deposito.id },
          defaults: prod,
        });
        if (created) {
          console.log(`  ✓ ${prod.nombre} (${prod.codigo})`);
        } else {
          console.log(`  ⚠ ${prod.nombre} ya existía`);
        }
      } catch (err) {
        console.log(`  ❌ Error con ${prod.nombre}: ${err.message}`);
      }
    }

    // Crear stock para el cliente si existe
    if (cliente) {
      console.log("\nCreando stock para cliente...");
      const stockCliente = [
        {
          codigoBarras: "7790001000012",
          nombre: "Coca-Cola 500ml",
          categoria: "Bebidas",
          precio: 1000,
          precioVenta: 1500,
          cantidad: 30,
          clienteId: cliente.id,
        },
        {
          codigoBarras: "7790895000102",
          nombre: "Galletitas Oreo",
          categoria: "Snacks",
          precio: 700,
          precioVenta: 1100,
          cantidad: 20,
          clienteId: cliente.id,
        },
        {
          codigoBarras: "123456789012",
          nombre: "Producto Test 1",
          categoria: "General",
          precio: 120,
          precioVenta: 180,
          cantidad: 50,
          clienteId: cliente.id,
        },
        {
          codigoBarras: "222222222222",
          nombre: "Producto Cliente Test",
          categoria: "General",
          precio: 80,
          precioVenta: 120,
          cantidad: 100,
          clienteId: cliente.id,
        },
      ];

      for (const item of stockCliente) {
        try {
          const [stock, created] = await StockCliente.findOrCreate({
            where: { codigoBarras: item.codigoBarras, clienteId: cliente.id },
            defaults: item,
          });
          if (created) {
            console.log(`  ✓ ${item.nombre} (${item.codigoBarras})`);
          } else {
            console.log(`  ⚠ ${item.nombre} ya existía`);
          }
        } catch (err) {
          console.log(`  ❌ Error con ${item.nombre}: ${err.message}`);
        }
      }
    }

    await sequelize.close();

    console.log("\n" + "═".repeat(60));
    console.log("✅ Productos creados exitosamente!");
    console.log("═".repeat(60));
    console.log("\nCódigos de barras para probar:");
    console.log("─".repeat(60));
    console.log("DEPÓSITO (empleado.dep1@test.com o empleado.dep2@test.com):");
    console.log("  • 111111111111 - Producto Fácil De Testear");
    console.log("  • 123456789012 - Producto Test 1");
    console.log("  • 7790001000012 - Coca-Cola 500ml");
    console.log("\nCLIENTE (empleado.cli1@test.com):");
    console.log("  • 222222222222 - Producto Cliente Test");
    console.log("  • 123456789012 - Producto Test 1");
    console.log("─".repeat(60));
    console.log("\nPuedes escribir estos códigos manualmente en el escáner.");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

crearProductos();
