import { createContext, useContext, useState, useEffect } from "react";
import { pedidosService, productosService } from "../services/api";
import { useAuth } from "./AuthContext";

const DepositoContext = createContext();

// Configurar modo de conexión: 'api' o 'local'
const MODO_CONEXION = process.env.NEXT_PUBLIC_MODE || "api";

// Datos de ejemplo para el depósito
const pedidosDepositoIniciales = [
  {
    id: 1,
    clienteId: "CLI-001",
    cliente: "Tienda La Esquina",
    fecha: "2026-02-02",
    productos: [
      { nombre: "Producto A", cantidad: 10, precio: 150 },
      { nombre: "Producto B", cantidad: 5, precio: 200 },
    ],
    tipoEnvio: "envio",
    direccion: "Calle Principal 123",
    estado: "pendiente",
    total: 2500,
    prioridad: "alta",
  },
  {
    id: 2,
    clienteId: "CLI-002",
    cliente: "Minimercado Sol",
    fecha: "2026-02-02",
    productos: [{ nombre: "Producto C", cantidad: 20, precio: 80 }],
    tipoEnvio: "flete",
    direccion: "Av. Libertad 456",
    estado: "preparando",
    total: 1600,
    prioridad: "media",
  },
  {
    id: 3,
    clienteId: "CLI-003",
    cliente: "Supermercado Norte",
    fecha: "2026-02-01",
    productos: [
      { nombre: "Producto A", cantidad: 15, precio: 150 },
      { nombre: "Producto D", cantidad: 8, precio: 300 },
    ],
    tipoEnvio: "retiro",
    direccion: "Retiro en depósito",
    estado: "listo",
    total: 4650,
    prioridad: "baja",
  },
  {
    id: 4,
    clienteId: "CLI-001",
    cliente: "Tienda La Esquina",
    fecha: "2026-02-01",
    productos: [{ nombre: "Producto E", cantidad: 5, precio: 450 }],
    tipoEnvio: "envio",
    direccion: "Calle Principal 123",
    estado: "enviado",
    total: 2250,
    prioridad: "media",
  },
  {
    id: 5,
    clienteId: "CLI-004",
    cliente: "Kiosco Central",
    fecha: "2026-01-31",
    productos: [{ nombre: "Producto F", cantidad: 30, precio: 120 }],
    tipoEnvio: "envio",
    direccion: "Plaza Mayor 789",
    estado: "entregado",
    total: 3600,
    prioridad: "baja",
  },
];

const inventarioInicial = [
  {
    id: 1,
    codigo: "PROD-001",
    nombre: "Producto A",
    categoria: "Categoría 1",
    stock: 100,
    stockMinimo: 20,
    stockMaximo: 200,
    precio: 150,
    costo: 100,
    ubicacion: "A-01",
    imagen:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
    ultimaActualizacion: "2026-02-01",
  },
  {
    id: 2,
    codigo: "PROD-002",
    nombre: "Producto B",
    categoria: "Categoría 1",
    stock: 50,
    stockMinimo: 15,
    stockMaximo: 100,
    precio: 200,
    costo: 140,
    ubicacion: "A-02",
    imagen:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200",
    ultimaActualizacion: "2026-02-01",
  },
  {
    id: 3,
    codigo: "PROD-003",
    nombre: "Producto C",
    categoria: "Categoría 2",
    stock: 200,
    stockMinimo: 50,
    stockMaximo: 300,
    precio: 80,
    costo: 55,
    ubicacion: "B-01",
    imagen: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200",
    ultimaActualizacion: "2026-02-02",
  },
  {
    id: 4,
    codigo: "PROD-004",
    nombre: "Producto D",
    categoria: "Categoría 2",
    stock: 15,
    stockMinimo: 25,
    stockMaximo: 100,
    precio: 300,
    costo: 210,
    ubicacion: "B-02",
    imagen:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200",
    ultimaActualizacion: "2026-01-30",
  },
  {
    id: 5,
    codigo: "PROD-005",
    nombre: "Producto E",
    categoria: "Categoría 3",
    stock: 30,
    stockMinimo: 10,
    stockMaximo: 50,
    precio: 450,
    costo: 320,
    ubicacion: "C-01",
    imagen:
      "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200",
    ultimaActualizacion: "2026-02-01",
  },
  {
    id: 6,
    codigo: "PROD-006",
    nombre: "Producto F",
    categoria: "Categoría 3",
    stock: 150,
    stockMinimo: 30,
    stockMaximo: 200,
    precio: 120,
    costo: 85,
    ubicacion: "C-02",
    imagen: "https://images.unsplash.com/photo-1491553895911-0055uj47a85?w=200",
    ultimaActualizacion: "2026-02-02",
  },
];

const enviosIniciales = [
  {
    id: 1,
    pedidoId: 4,
    cliente: "Tienda La Esquina",
    tipo: "envio",
    vehiculo: "Camioneta 01",
    conductor: "Juan Pérez",
    direccion: "Calle Principal 123",
    estado: "en_transito",
    fechaSalida: "2026-02-02 09:30",
    fechaEstimada: "2026-02-02 11:00",
    notas: "",
  },
  {
    id: 2,
    pedidoId: 3,
    cliente: "Supermercado Norte",
    tipo: "retiro",
    vehiculo: null,
    conductor: null,
    direccion: "Retiro en depósito",
    estado: "esperando_retiro",
    fechaSalida: null,
    fechaEstimada: "2026-02-02 14:00",
    notas: "Cliente confirmó retiro para las 14hs",
  },
];

const movimientosDepositoIniciales = [
  {
    id: 1,
    fecha: "2026-02-02",
    tipo: "ingreso",
    concepto: "Venta pedido #4",
    monto: 2250,
    categoria: "ventas",
  },
  {
    id: 2,
    fecha: "2026-02-02",
    tipo: "egreso",
    concepto: "Combustible flota",
    monto: 500,
    categoria: "logistica",
  },
  {
    id: 3,
    fecha: "2026-02-01",
    tipo: "ingreso",
    concepto: "Venta pedido #5",
    monto: 3600,
    categoria: "ventas",
  },
  {
    id: 4,
    fecha: "2026-02-01",
    tipo: "egreso",
    concepto: "Compra de stock",
    monto: 15000,
    categoria: "compras",
  },
  {
    id: 5,
    fecha: "2026-01-31",
    tipo: "ingreso",
    concepto: "Ventas del día",
    monto: 8500,
    categoria: "ventas",
  },
  {
    id: 6,
    fecha: "2026-01-31",
    tipo: "egreso",
    concepto: "Salarios personal",
    monto: 12000,
    categoria: "personal",
  },
  {
    id: 7,
    fecha: "2026-01-30",
    tipo: "egreso",
    concepto: "Servicios (luz, agua)",
    monto: 2500,
    categoria: "servicios",
  },
  {
    id: 8,
    fecha: "2026-01-30",
    tipo: "ingreso",
    concepto: "Ventas del día",
    monto: 6200,
    categoria: "ventas",
  },
];

const vehiculosIniciales = [
  {
    id: 1,
    nombre: "Camioneta 01",
    patente: "ABC-123",
    tipo: "camioneta",
    capacidad: "500kg",
    estado: "en_uso",
  },
  {
    id: 2,
    nombre: "Camión 01",
    patente: "XYZ-789",
    tipo: "camion",
    capacidad: "2000kg",
    estado: "disponible",
  },
  {
    id: 3,
    nombre: "Moto 01",
    patente: "MOT-001",
    tipo: "moto",
    capacidad: "20kg",
    estado: "disponible",
  },
];

const conductoresIniciales = [
  { id: 1, nombre: "Juan Pérez", telefono: "555-1001", estado: "en_ruta" },
  { id: 2, nombre: "María García", telefono: "555-1002", estado: "disponible" },
  { id: 3, nombre: "Carlos López", telefono: "555-1003", estado: "disponible" },
];

// Notificaciones iniciales
const notificacionesIniciales = [
  {
    id: 1,
    tipo: "pedido",
    titulo: "Nuevo pedido recibido",
    mensaje: "Tienda La Esquina ha realizado un pedido por $2,500",
    fecha: "2026-02-02T10:30:00",
    leida: false,
    datos: { pedidoId: 1 },
  },
  {
    id: 2,
    tipo: "stock",
    titulo: "Stock bajo",
    mensaje: "El Producto D tiene stock bajo (8 unidades)",
    fecha: "2026-02-02T09:15:00",
    leida: true,
    datos: { productoId: 4 },
  },
];

export function DepositoProvider({ children }) {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [envios, setEnvios] = useState(enviosIniciales);
  const [movimientos, setMovimientos] = useState(movimientosDepositoIniciales);
  const [vehiculos, setVehiculos] = useState(vehiculosIniciales);
  const [conductores, setConductores] = useState(conductoresIniciales);
  const [notificaciones, setNotificaciones] = useState(notificacionesIniciales);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [cargandoInventario, setCargandoInventario] = useState(true);

  // Cargar pedidos del depósito desde el backend
  useEffect(() => {
    const cargarPedidos = async () => {
      if (MODO_CONEXION === "api") {
        try {
          const response = await pedidosService.getAll();
          const pedidosBackend = response.data || response || [];

          // Mapear pedidos del backend al formato del frontend
          const pedidosMapeados = pedidosBackend.map((pedido) => ({
            id: pedido.id,
            clienteId: pedido.clienteId,
            cliente: pedido.cliente?.nombre || "Cliente",
            fecha: pedido.createdAt
              ? pedido.createdAt.split("T")[0]
              : pedido.fecha,
            productos:
              pedido.productos?.map((p) => ({
                id: p.productoId || p.id,
                nombre: p.nombre || p.producto?.nombre,
                cantidad: p.cantidad,
                precio: parseFloat(p.precioUnitario || p.precio) || 0,
              })) || [],
            tipoEnvio: pedido.tipoEnvio || "envio",
            direccion: pedido.direccion || pedido.cliente?.direccion || "",
            estado: pedido.estado || "pendiente",
            total: parseFloat(pedido.total) || 0,
            prioridad: pedido.prioridad || "media",
            notas: pedido.notas || "",
          }));

          setPedidos(pedidosMapeados);
        } catch (error) {
          console.error("Error al cargar pedidos del depósito:", error);
          setPedidos(pedidosDepositoIniciales); // Fallback
        }
      } else {
        setPedidos(pedidosDepositoIniciales);
      }
      setCargandoPedidos(false);
    };

    cargarPedidos();
  }, []);

  // Cargar inventario (productos) del depósito desde el backend
  useEffect(() => {
    const cargarInventario = async () => {
      if (MODO_CONEXION === "api" && usuario?.id) {
        setCargandoInventario(true);
        try {
          console.log("Cargando inventario para depositoId:", usuario.id);
          const response = await productosService.getByDeposito(usuario.id);
          console.log("Respuesta del backend:", response);
          const productosBackend = response.data || response || [];
          console.log("Productos a mapear:", productosBackend.length);

          // Mapear productos del backend al formato del inventario
          const inventarioMapeado = productosBackend.map((p) => ({
            id: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            categoria: p.categoria || "Sin categoría",
            stock: p.stock || 0,
            stockMinimo: p.stockMinimo || p.stock_minimo || 10,
            stockMaximo: p.stockMaximo || p.stock_maximo || 100,
            precio: parseFloat(p.precio) || 0,
            costo: parseFloat(p.costo) || 0,
            ubicacion: p.ubicacion || "",
            imagen: p.imagen || "",
            ultimaActualizacion: p.updatedAt
              ? p.updatedAt.split("T")[0]
              : new Date().toISOString().split("T")[0],
          }));

          setInventario(inventarioMapeado);
        } catch (error) {
          console.error("Error al cargar inventario:", error);
          setInventario(inventarioInicial); // Fallback
        } finally {
          setCargandoInventario(false);
        }
      } else if (!usuario?.id) {
        setInventario([]);
        setCargandoInventario(false);
      } else {
        setInventario(inventarioInicial);
        setCargandoInventario(false);
      }
    };

    cargarInventario();
  }, [usuario?.id]);

  // ============ PEDIDOS ============

  // Cambiar estado de pedido
  const cambiarEstadoPedido = (id, nuevoEstado) => {
    setPedidos(
      pedidos.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p)),
    );
  };

  // Obtener pedidos por estado
  const getPedidosPorEstado = (estado) => {
    if (estado === "todos") return pedidos;
    return pedidos.filter((p) => p.estado === estado);
  };

  // ============ INVENTARIO ============

  // Actualizar stock
  const actualizarStock = async (productoId, cantidad, tipo) => {
    if (MODO_CONEXION === "api") {
      try {
        // Llamar al backend para actualizar stock
        const tipoBackend = tipo === "entrada" ? "agregar" : "restar";
        await productosService.actualizarStock(
          productoId,
          cantidad,
          tipoBackend,
        );

        // Actualizar estado local
        setInventario(
          inventario.map((p) => {
            if (String(p.id) === String(productoId)) {
              const nuevoStock =
                tipo === "entrada" ? p.stock + cantidad : p.stock - cantidad;
              return {
                ...p,
                stock: Math.max(0, nuevoStock),
                ultimaActualizacion: new Date().toISOString().split("T")[0],
              };
            }
            return p;
          }),
        );
      } catch (error) {
        console.error("Error al actualizar stock:", error);
        throw error;
      }
    } else {
      // Modo local
      setInventario(
        inventario.map((p) => {
          if (p.id === productoId) {
            const nuevoStock =
              tipo === "entrada" ? p.stock + cantidad : p.stock - cantidad;
            return {
              ...p,
              stock: Math.max(0, nuevoStock),
              ultimaActualizacion: new Date().toISOString().split("T")[0],
            };
          }
          return p;
        }),
      );
    }
  };

  // Agregar producto al inventario
  const agregarProducto = async (producto) => {
    if (MODO_CONEXION === "api") {
      try {
        if (!usuario?.id) {
          throw new Error("Usuario no autenticado");
        }

        // Generar código si no viene
        const codigo =
          producto.codigo || `PROD-${Date.now().toString(36).toUpperCase()}`;

        const datosProducto = {
          ...producto,
          codigo,
          depositoId: usuario.id,
        };

        console.log("Enviando producto al backend:", datosProducto);

        // Crear producto en el backend
        const response = await productosService.crear(datosProducto);

        const nuevoProducto = response.data || response;

        // Mapear al formato del inventario
        const productoMapeado = {
          id: nuevoProducto.id,
          codigo: nuevoProducto.codigo,
          nombre: nuevoProducto.nombre,
          categoria: nuevoProducto.categoria || "Sin categoría",
          stock: nuevoProducto.stock || 0,
          stockMinimo:
            nuevoProducto.stockMinimo || nuevoProducto.stock_minimo || 10,
          stockMaximo:
            nuevoProducto.stockMaximo || nuevoProducto.stock_maximo || 100,
          precio: parseFloat(nuevoProducto.precio) || 0,
          costo: parseFloat(nuevoProducto.costo) || 0,
          ubicacion: nuevoProducto.ubicacion || "",
          imagen: nuevoProducto.imagen || "",
          ultimaActualizacion: new Date().toISOString().split("T")[0],
        };

        setInventario((prev) => [...prev, productoMapeado]);
        return productoMapeado;
      } catch (error) {
        console.error("Error al crear producto:", error);
        console.error("Error detalle:", error.response?.data || error.message);
        throw error;
      }
    } else {
      // Modo local (fallback)
      const nuevoProducto = {
        ...producto,
        id: inventario.length + 1,
        codigo: `PROD-${String(inventario.length + 1).padStart(3, "0")}`,
        ultimaActualizacion: new Date().toISOString().split("T")[0],
      };
      setInventario([...inventario, nuevoProducto]);
      return nuevoProducto;
    }
  };

  // Eliminar producto del inventario
  const eliminarProducto = async (productoId) => {
    if (MODO_CONEXION === "api") {
      try {
        await productosService.eliminar(productoId);
        setInventario((prev) => prev.filter((p) => p.id !== productoId));
        return true;
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        throw error;
      }
    } else {
      setInventario((prev) => prev.filter((p) => p.id !== productoId));
      return true;
    }
  };

  // Productos con stock bajo
  const getProductosStockBajo = () => {
    return inventario.filter((p) => p.stock <= p.stockMinimo);
  };

  // ============ ENVIOS ============

  // Crear envío
  const crearEnvio = (envioData) => {
    const nuevoEnvio = {
      ...envioData,
      id: envios.length + 1,
      estado: "pendiente",
    };
    setEnvios([...envios, nuevoEnvio]);
    return nuevoEnvio;
  };

  // Actualizar estado de envío
  const actualizarEstadoEnvio = (id, nuevoEstado) => {
    setEnvios(
      envios.map((e) => (e.id === id ? { ...e, estado: nuevoEstado } : e)),
    );
  };

  // ============ NOTIFICACIONES ============

  // Agregar notificación
  const agregarNotificacion = (notificacion) => {
    const nuevaNotificacion = {
      ...notificacion,
      id: Date.now(),
      fecha: new Date().toISOString(),
      leida: false,
    };
    setNotificaciones((prev) => [nuevaNotificacion, ...prev]);
    return nuevaNotificacion;
  };

  // Marcar notificación como leída
  const marcarNotificacionLeida = (id) => {
    setNotificaciones(
      notificaciones.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = () => {
    setNotificaciones(notificaciones.map((n) => ({ ...n, leida: true })));
  };

  // Eliminar notificación
  const eliminarNotificacion = (id) => {
    setNotificaciones(notificaciones.filter((n) => n.id !== id));
  };

  // Obtener notificaciones no leídas
  const getNotificacionesNoLeidas = () => {
    return notificaciones.filter((n) => !n.leida);
  };

  // ============ RECIBIR PEDIDOS DE CLIENTES ============

  // Recibir un nuevo pedido de un cliente
  const recibirPedidoCliente = (pedidoCliente) => {
    const nuevoPedido = {
      id: pedidos.length + 1,
      clienteId: pedidoCliente.clienteId || `CLI-${Date.now()}`,
      cliente: pedidoCliente.cliente || "Cliente",
      fecha: new Date().toISOString().split("T")[0],
      productos: pedidoCliente.productos,
      tipoEnvio: pedidoCliente.tipoEnvio,
      direccion: pedidoCliente.direccion,
      estado: "pendiente",
      total: pedidoCliente.total,
      prioridad: "media",
      notas: pedidoCliente.notas || "",
    };

    setPedidos((prev) => [nuevoPedido, ...prev]);

    // Crear notificación para el depósito
    agregarNotificacion({
      tipo: "pedido",
      titulo: "🆕 Nuevo pedido recibido",
      mensaje: `${nuevoPedido.cliente} ha realizado un pedido por $${nuevoPedido.total.toLocaleString()}`,
      datos: {
        pedidoId: nuevoPedido.id,
        productos: nuevoPedido.productos,
        tipoEnvio: nuevoPedido.tipoEnvio,
        direccion: nuevoPedido.direccion,
      },
    });

    return nuevoPedido;
  };

  // ============ CONTABILIDAD ============

  // Agregar movimiento
  const agregarMovimiento = (movimiento) => {
    const nuevoMovimiento = {
      ...movimiento,
      id: movimientos.length + 1,
      fecha: new Date().toISOString().split("T")[0],
    };
    setMovimientos([nuevoMovimiento, ...movimientos]);
    return nuevoMovimiento;
  };

  // Calcular totales
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

  // ============ ESTADÍSTICAS ============

  const getEstadisticas = () => {
    const pedidosPendientes = pedidos.filter(
      (p) => p.estado === "pendiente",
    ).length;
    const pedidosPreparando = pedidos.filter(
      (p) => p.estado === "preparando",
    ).length;
    const pedidosListos = pedidos.filter((p) => p.estado === "listo").length;
    const pedidosEnviados = pedidos.filter(
      (p) => p.estado === "enviado",
    ).length;
    const pedidosEntregados = pedidos.filter(
      (p) => p.estado === "entregado",
    ).length;
    const totalProductos = inventario.length;
    const productosStockBajo = getProductosStockBajo().length;
    const enviosActivos = envios.filter(
      (e) => e.estado === "en_transito" || e.estado === "esperando_retiro",
    ).length;
    const totales = calcularTotales();

    return {
      pedidosPendientes,
      pedidosPreparando,
      pedidosListos,
      pedidosEnviados,
      pedidosEntregados,
      totalProductos,
      productosStockBajo,
      enviosActivos,
      vehiculosDisponibles: vehiculos.filter((v) => v.estado === "disponible")
        .length,
      conductoresDisponibles: conductores.filter(
        (c) => c.estado === "disponible",
      ).length,
      ...totales,
    };
  };

  const value = {
    pedidos,
    inventario,
    envios,
    movimientos,
    vehiculos,
    conductores,
    notificaciones,
    cargandoPedidos,
    cargandoInventario,
    cambiarEstadoPedido,
    getPedidosPorEstado,
    actualizarStock,
    agregarProducto,
    eliminarProducto,
    getProductosStockBajo,
    crearEnvio,
    actualizarEstadoEnvio,
    agregarMovimiento,
    calcularTotales,
    getEstadisticas,
    agregarNotificacion,
    marcarNotificacionLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
    getNotificacionesNoLeidas,
    recibirPedidoCliente,
  };

  return (
    <DepositoContext.Provider value={value}>
      {children}
    </DepositoContext.Provider>
  );
}

export function useDeposito() {
  const context = useContext(DepositoContext);
  if (!context) {
    throw new Error("useDeposito debe usarse dentro de un DepositoProvider");
  }
  return context;
}
