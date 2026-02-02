import { createContext, useContext, useState, useEffect } from "react";

const ClienteContext = createContext();

// Datos de ejemplo para demostración
const pedidosIniciales = [
  {
    id: 1,
    fecha: "2026-02-01",
    productos: [
      { nombre: "Producto A", cantidad: 10, precio: 150 },
      { nombre: "Producto B", cantidad: 5, precio: 200 },
    ],
    deposito: "Depósito Central",
    tipoEnvio: "flete",
    estado: "pendiente",
    total: 2500,
    direccion: "Calle Principal 123",
  },
  {
    id: 2,
    fecha: "2026-01-28",
    productos: [{ nombre: "Producto C", cantidad: 20, precio: 80 }],
    deposito: "Depósito Norte",
    tipoEnvio: "envio",
    estado: "entregado",
    total: 1600,
    direccion: "Av. Libertad 456",
  },
  {
    id: 3,
    fecha: "2026-01-25",
    productos: [
      { nombre: "Producto A", cantidad: 15, precio: 150 },
      { nombre: "Producto D", cantidad: 8, precio: 300 },
    ],
    deposito: "Depósito Sur",
    tipoEnvio: "retiro",
    estado: "en_camino",
    total: 4650,
    direccion: "Pasaje Los Robles 789",
  },
];

const depositosIniciales = [
  {
    id: 1,
    nombre: "Depósito Central",
    direccion: "Av. Industrial 1000",
    telefono: "555-0100",
    horarioApertura: "08:00",
    horarioCierre: "18:00",
    diasLaborales: [1, 2, 3, 4, 5], // Lunes a Viernes
    disponible: true,
    tiposEnvio: ["envio", "flete", "retiro"],
    imagen: "🏭",
    productos: [
      {
        id: 1,
        codigo: "PROD-001",
        nombre: "Producto A",
        categoria: "Categoría 1",
        precio: 150,
        stock: 100,
        imagen:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
      },
      {
        id: 2,
        codigo: "PROD-002",
        nombre: "Producto B",
        categoria: "Categoría 1",
        precio: 200,
        stock: 50,
        imagen:
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200",
      },
      {
        id: 3,
        codigo: "PROD-003",
        nombre: "Producto C",
        categoria: "Categoría 2",
        precio: 80,
        stock: 200,
        imagen:
          "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200",
      },
      {
        id: 4,
        codigo: "PROD-004",
        nombre: "Producto D",
        categoria: "Categoría 2",
        precio: 300,
        stock: 15,
        imagen:
          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200",
      },
      {
        id: 5,
        codigo: "PROD-005",
        nombre: "Producto E",
        categoria: "Categoría 3",
        precio: 450,
        stock: 30,
        imagen:
          "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200",
      },
      {
        id: 6,
        codigo: "PROD-006",
        nombre: "Producto F",
        categoria: "Categoría 3",
        precio: 120,
        stock: 150,
        imagen: "",
      },
    ],
  },
  {
    id: 2,
    nombre: "Depósito Norte",
    direccion: "Ruta 5 Km 12",
    telefono: "555-0200",
    horarioApertura: "07:00",
    horarioCierre: "17:00",
    diasLaborales: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
    disponible: true,
    tiposEnvio: ["envio", "flete"],
    imagen: "🏢",
    productos: [
      {
        id: 7,
        codigo: "PROD-007",
        nombre: "Producto G",
        categoria: "Categoría 1",
        precio: 180,
        stock: 80,
        imagen:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
      },
      {
        id: 8,
        codigo: "PROD-008",
        nombre: "Producto H",
        categoria: "Categoría 2",
        precio: 250,
        stock: 45,
        imagen:
          "https://images.unsplash.com/photo-1491553895911-0055uj47a85?w=200",
      },
      {
        id: 9,
        codigo: "PROD-009",
        nombre: "Producto I",
        categoria: "Categoría 3",
        precio: 90,
        stock: 120,
        imagen: "",
      },
      {
        id: 10,
        codigo: "PROD-010",
        nombre: "Producto J",
        categoria: "Categoría 1",
        precio: 350,
        stock: 25,
        imagen:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200",
      },
    ],
  },
  {
    id: 3,
    nombre: "Depósito Sur",
    direccion: "Parque Logístico Sur",
    telefono: "555-0300",
    horarioApertura: "09:00",
    horarioCierre: "19:00",
    diasLaborales: [1, 2, 3, 4, 5], // Lunes a Viernes
    disponible: true,
    tiposEnvio: ["envio", "retiro"],
    imagen: "🏗️",
    productos: [
      {
        id: 11,
        codigo: "PROD-011",
        nombre: "Producto K",
        categoria: "Categoría 1",
        precio: 220,
        stock: 60,
        imagen:
          "https://images.unsplash.com/photo-1503602642458-232111445657?w=200",
      },
      {
        id: 12,
        codigo: "PROD-012",
        nombre: "Producto L",
        categoria: "Categoría 2",
        precio: 175,
        stock: 90,
        imagen: "",
      },
      {
        id: 13,
        codigo: "PROD-013",
        nombre: "Producto M",
        categoria: "Categoría 3",
        precio: 400,
        stock: 20,
        imagen:
          "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200",
      },
      {
        id: 14,
        codigo: "PROD-014",
        nombre: "Producto N",
        categoria: "Categoría 1",
        precio: 130,
        stock: 110,
        imagen:
          "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200",
      },
      {
        id: 15,
        codigo: "PROD-015",
        nombre: "Producto O",
        categoria: "Categoría 2",
        precio: 280,
        stock: 35,
        imagen: "",
      },
    ],
  },
  {
    id: 4,
    nombre: "Depósito Este",
    direccion: "Zona Franca Este",
    telefono: "555-0400",
    horario: "Lun-Vie 8:00 - 16:00",
    disponible: false,
    tiposEnvio: ["flete"],
    imagen: "🏚️",
    productos: [],
  },
];

const movimientosIniciales = [
  {
    id: 1,
    fecha: "2026-02-01",
    tipo: "ingreso",
    concepto: "Venta de productos",
    monto: 5000,
    categoria: "ventas",
  },
  {
    id: 2,
    fecha: "2026-02-01",
    tipo: "egreso",
    concepto: "Pago de flete",
    monto: 350,
    categoria: "logistica",
  },
  {
    id: 3,
    fecha: "2026-01-31",
    tipo: "ingreso",
    concepto: "Venta de productos",
    monto: 3200,
    categoria: "ventas",
  },
  {
    id: 4,
    fecha: "2026-01-31",
    tipo: "egreso",
    concepto: "Compra de mercadería",
    monto: 2000,
    categoria: "compras",
  },
  {
    id: 5,
    fecha: "2026-01-30",
    tipo: "ingreso",
    concepto: "Cobro a cliente",
    monto: 1500,
    categoria: "cobranzas",
  },
  {
    id: 6,
    fecha: "2026-01-30",
    tipo: "egreso",
    concepto: "Pago de servicios",
    monto: 800,
    categoria: "servicios",
  },
  {
    id: 7,
    fecha: "2026-01-29",
    tipo: "ingreso",
    concepto: "Venta de productos",
    monto: 4500,
    categoria: "ventas",
  },
  {
    id: 8,
    fecha: "2026-01-28",
    tipo: "egreso",
    concepto: "Compra de insumos",
    monto: 1200,
    categoria: "compras",
  },
];

const productosDisponibles = [
  {
    id: 1,
    nombre: "Producto A",
    precio: 150,
    stock: 100,
    categoria: "Categoría 1",
  },
  {
    id: 2,
    nombre: "Producto B",
    precio: 200,
    stock: 50,
    categoria: "Categoría 1",
  },
  {
    id: 3,
    nombre: "Producto C",
    precio: 80,
    stock: 200,
    categoria: "Categoría 2",
  },
  {
    id: 4,
    nombre: "Producto D",
    precio: 300,
    stock: 75,
    categoria: "Categoría 2",
  },
  {
    id: 5,
    nombre: "Producto E",
    precio: 450,
    stock: 30,
    categoria: "Categoría 3",
  },
  {
    id: 6,
    nombre: "Producto F",
    precio: 120,
    stock: 150,
    categoria: "Categoría 3",
  },
];

export function ClienteProvider({ children }) {
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [depositos] = useState(depositosIniciales);
  const [movimientos, setMovimientos] = useState(movimientosIniciales);
  const [productos] = useState(productosDisponibles);
  const [carrito, setCarrito] = useState({
    productos: [], // Cada producto incluye depositoId
  });

  // Funciones del carrito
  const agregarAlCarrito = (producto, depositoId) => {
    // Buscar si ya existe el producto del mismo depósito
    const existe = carrito.productos.find(
      (p) => p.id === producto.id && p.depositoId === depositoId,
    );
    if (existe) {
      setCarrito({
        productos: carrito.productos.map((p) =>
          p.id === producto.id && p.depositoId === depositoId
            ? { ...p, cantidad: p.cantidad + 1 }
            : p,
        ),
      });
    } else {
      setCarrito({
        productos: [
          ...carrito.productos,
          { ...producto, depositoId, cantidad: 1 },
        ],
      });
    }
    return true;
  };

  const actualizarCantidadCarrito = (productoId, depositoId, cantidad) => {
    if (cantidad < 1) {
      eliminarDelCarrito(productoId, depositoId);
    } else {
      setCarrito({
        productos: carrito.productos.map((p) =>
          p.id === productoId && p.depositoId === depositoId
            ? { ...p, cantidad }
            : p,
        ),
      });
    }
  };

  const eliminarDelCarrito = (productoId, depositoId) => {
    const nuevosProductos = carrito.productos.filter(
      (p) => !(p.id === productoId && p.depositoId === depositoId),
    );
    setCarrito({
      productos: nuevosProductos,
    });
  };

  const vaciarCarrito = () => {
    setCarrito({
      productos: [],
    });
  };

  // Obtener depósitos únicos en el carrito
  const getDepositosEnCarrito = () => {
    const depositoIds = [
      ...new Set(carrito.productos.map((p) => p.depositoId)),
    ];
    return depositoIds
      .map((id) => depositos.find((d) => d.id === id))
      .filter(Boolean);
  };

  // Obtener productos del carrito por depósito
  const getProductosPorDeposito = (depositoId) => {
    return carrito.productos.filter((p) => p.depositoId === depositoId);
  };

  const getTotalCarrito = () => {
    return carrito.productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  };

  const getCantidadCarrito = () => {
    return carrito.productos.reduce((sum, p) => sum + p.cantidad, 0);
  };

  // Crear pedido
  const crearPedido = (nuevoPedido) => {
    const pedido = {
      ...nuevoPedido,
      id: pedidos.length + 1,
      fecha: new Date().toISOString().split("T")[0],
      estado: "pendiente",
    };
    setPedidos([pedido, ...pedidos]);
    vaciarCarrito(); // Vaciar carrito después de crear pedido
    return pedido;
  };

  // Modificar pedido
  const modificarPedido = (id, datosActualizados) => {
    setPedidos(
      pedidos.map((p) => (p.id === id ? { ...p, ...datosActualizados } : p)),
    );
  };

  // Cancelar pedido
  const cancelarPedido = (id) => {
    setPedidos(
      pedidos.map((p) => (p.id === id ? { ...p, estado: "cancelado" } : p)),
    );
  };

  // Agregar movimiento contable
  const agregarMovimiento = (movimiento) => {
    const nuevoMovimiento = {
      ...movimiento,
      id: movimientos.length + 1,
      fecha: new Date().toISOString().split("T")[0],
    };
    setMovimientos([nuevoMovimiento, ...movimientos]);
    return nuevoMovimiento;
  };

  // Calcular totales de contabilidad
  const calcularTotales = () => {
    const ingresos = movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((sum, m) => sum + m.monto, 0);
    const egresos = movimientos
      .filter((m) => m.tipo === "egreso")
      .reduce((sum, m) => sum + m.monto, 0);
    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
    };
  };

  // Estadísticas del dashboard
  const getEstadisticas = () => {
    const pedidosPendientes = pedidos.filter(
      (p) => p.estado === "pendiente",
    ).length;
    const pedidosEnCamino = pedidos.filter(
      (p) => p.estado === "en_camino",
    ).length;
    const pedidosEntregados = pedidos.filter(
      (p) => p.estado === "entregado",
    ).length;
    const totalPedidos = pedidos.filter((p) => p.estado !== "cancelado").length;
    const totales = calcularTotales();

    return {
      pedidosPendientes,
      pedidosEnCamino,
      pedidosEntregados,
      totalPedidos,
      ...totales,
    };
  };

  const value = {
    pedidos,
    depositos,
    movimientos,
    productos,
    carrito,
    agregarAlCarrito,
    actualizarCantidadCarrito,
    eliminarDelCarrito,
    vaciarCarrito,
    getTotalCarrito,
    getCantidadCarrito,
    getDepositosEnCarrito,
    getProductosPorDeposito,
    crearPedido,
    modificarPedido,
    cancelarPedido,
    agregarMovimiento,
    calcularTotales,
    getEstadisticas,
  };

  return (
    <ClienteContext.Provider value={value}>{children}</ClienteContext.Provider>
  );
}

export function useCliente() {
  const context = useContext(ClienteContext);
  if (!context) {
    throw new Error("useCliente debe usarse dentro de un ClienteProvider");
  }
  return context;
}
