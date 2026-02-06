require("dotenv").config();
const bcrypt = require("bcryptjs");
const {
  sequelize,
  Usuario,
  Producto,
  Pedido,
  PedidoProducto,
  Calificacion,
} = require("../models");

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    // Admin - Pablo
    const admin = await Usuario.create({
      email: "pabloelleproso@gmail.com",
      password: "P@blo31286370",
      tipoUsuario: "admin",
      nombre: "Pablo (Admin)",
      telefono: "",
      esOculto: true,
    });
    // Depósito
    const deposito = await Usuario.create({
      email: "deposito@test.com",
      password: "123456",
      tipoUsuario: "deposito",
      nombre: "Depósito Central",
      telefono: "11-9876-5432",
      direccion: "Zona Industrial, Lote 5",
      horarioApertura: "08:00",
      horarioCierre: "18:00",
      diasLaborales: [1, 2, 3, 4, 5],
      tiposEnvio: ["envio", "flete", "retiro"],
      datosFiscales: {
        cuit: "30-98765432-1",
        condicionIva: "Responsable Inscripto",
        razonSocial: "Distribuidora Central S.A.",
      },
    });
    // Depósito Norte
    const depositoNorte = await Usuario.create({
      email: "depositonorte@test.com",
      password: "123456",
      tipoUsuario: "deposito",
      nombre: "Depósito Norte",
      telefono: "11-5555-1234",
      direccion: "Ruta 5 Km 12",
      horarioApertura: "07:00",
      horarioCierre: "17:00",
      diasLaborales: [1, 2, 3, 4, 5, 6],
      tiposEnvio: ["envio", "flete"],
    });
    // Cliente
    const cliente = await Usuario.create({
      email: "cliente@test.com",
      password: "123456",
      tipoUsuario: "cliente",
      nombre: "María García",
      telefono: "11-2345-6789",
      direccion: "Av. Corrientes 1234, CABA",
      datosFiscales: {
        cuit: "20-12345678-9",
        condicionIva: "Responsable Inscripto",
        razonSocial: "María García",
      },
    });
    // Flete
    const flete = await Usuario.create({
      email: "flete@test.com",
      password: "123456",
      tipoUsuario: "flete",
      nombre: "Juan Conductor",
      telefono: "11-5678-1234",
      direccion: "Barrio Norte",
      vehiculoTipo: "Camioneta",
      vehiculoPatente: "ABC 123",
      vehiculoCapacidad: "1500 kg",
      licenciaTipo: "B2",
      licenciaVencimiento: "2027-12-31",
    });
    const productos = await Producto.bulkCreate([
      {
        depositoId: deposito.id,
        codigo: "PROD-001",
        nombre: "Producto A",
        categoria: "Categoría 1",
        precio: 150,
        costo: 100,
        stock: 100,
        stockMinimo: 20,
        stockMaximo: 200,
        ubicacion: "A-01",
        imagen:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
      },
      {
        depositoId: deposito.id,
        codigo: "PROD-002",
        nombre: "Producto B",
        categoria: "Categoría 1",
        precio: 200,
        costo: 140,
        stock: 50,
        stockMinimo: 15,
        stockMaximo: 100,
        ubicacion: "A-02",
        imagen:
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200",
      },
      {
        depositoId: deposito.id,
        codigo: "PROD-003",
        nombre: "Producto C",
        categoria: "Categoría 2",
        precio: 80,
        costo: 55,
        stock: 200,
        stockMinimo: 50,
        stockMaximo: 300,
        ubicacion: "B-01",
        imagen:
          "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200",
      },
      {
        depositoId: deposito.id,
        codigo: "PROD-004",
        nombre: "Producto D",
        categoria: "Categoría 2",
        precio: 300,
        costo: 210,
        stock: 15,
        stockMinimo: 25,
        stockMaximo: 100,
        ubicacion: "B-02",
        imagen:
          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200",
      },
      {
        depositoId: deposito.id,
        codigo: "PROD-005",
        nombre: "Producto E",
        categoria: "Categoría 3",
        precio: 450,
        costo: 320,
        stock: 30,
        stockMinimo: 10,
        stockMaximo: 50,
        ubicacion: "C-01",
        imagen:
          "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200",
      },
      {
        depositoId: deposito.id,
        codigo: "PROD-006",
        nombre: "Producto F",
        categoria: "Categoría 3",
        precio: 120,
        costo: 80,
        stock: 150,
        stockMinimo: 30,
        stockMaximo: 250,
        ubicacion: "C-02",
      },
    ]);
    const productosNorte = await Producto.bulkCreate([
      {
        depositoId: depositoNorte.id,
        codigo: "PROD-007",
        nombre: "Producto G",
        categoria: "Categoría 1",
        precio: 180,
        costo: 120,
        stock: 80,
        stockMinimo: 20,
        ubicacion: "A-01",
        imagen:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
      },
      {
        depositoId: depositoNorte.id,
        codigo: "PROD-008",
        nombre: "Producto H",
        categoria: "Categoría 2",
        precio: 250,
        costo: 175,
        stock: 45,
        stockMinimo: 10,
        ubicacion: "A-02",
      },
    ]);
    // Pedido 1 - Pendiente
    const pedido1 = await Pedido.create({
      clienteId: cliente.id,
      depositoId: deposito.id,
      tipoEnvio: "envio",
      direccion: "Av. Corrientes 1234, CABA",
      estado: "pendiente",
      prioridad: "alta",
      total: 2500,
    });

    await PedidoProducto.bulkCreate([
      {
        pedidoId: pedido1.id,
        productoId: productos[0].id,
        nombre: "Producto A",
        cantidad: 10,
        precioUnitario: 150,
        subtotal: 1500,
      },
      {
        pedidoId: pedido1.id,
        productoId: productos[1].id,
        nombre: "Producto B",
        cantidad: 5,
        precioUnitario: 200,
        subtotal: 1000,
      },
    ]);
    console.log("  ✅ Pedido 1 creado (pendiente)");

    // Pedido 2 - Entregado
    const pedido2 = await Pedido.create({
      clienteId: cliente.id,
      depositoId: deposito.id,
      tipoEnvio: "flete",
      direccion: "Av. Libertad 456",
      estado: "entregado",
      prioridad: "media",
      total: 1600,
      fechaEntrega: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
    });

    await PedidoProducto.create({
      pedidoId: pedido2.id,
      productoId: productos[2].id,
      nombre: "Producto C",
      cantidad: 20,
      precioUnitario: 80,
      subtotal: 1600,
    });
    console.log("  ✅ Pedido 2 creado (entregado)");
    // Calificaciones para el depósito (del cliente y flete)
    await Calificacion.bulkCreate([
      {
        calificadorId: cliente.id,
        calificadoId: deposito.id,
        puntuacion: 5,
        comentario:
          "Excelente servicio, productos de muy buena calidad y entrega rápida.",
      },
      {
        calificadorId: flete.id,
        calificadoId: deposito.id,
        puntuacion: 4,
        comentario:
          "Buen depósito, fácil de cargar. A veces hay que esperar un poco.",
      },
    ]);
    // Calificaciones para el cliente (del depósito y flete)
    await Calificacion.bulkCreate([
      {
        calificadorId: deposito.id,
        calificadoId: cliente.id,
        puntuacion: 5,
        comentario: "Cliente muy responsable, siempre puntual con los pagos.",
      },
      {
        calificadorId: flete.id,
        calificadoId: cliente.id,
        puntuacion: 4,
        comentario: "Buena comunicación, dirección fácil de encontrar.",
      },
    ]);
    // Calificaciones para el flete (del cliente y depósito)
    await Calificacion.bulkCreate([
      {
        calificadorId: cliente.id,
        calificadoId: flete.id,
        puntuacion: 5,
        comentario:
          "Muy profesional, llegó a tiempo y cuidó bien la mercadería.",
      },
      {
        calificadorId: deposito.id,
        calificadoId: flete.id,
        puntuacion: 5,
        comentario: "Excelente conductor, siempre puntual y cuidadoso.",
      },
    ]);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seed();
