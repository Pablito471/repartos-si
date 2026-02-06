import { createContext, useContext, useState, useEffect } from "react";
import {
  pedidosService,
  productosService,
  enviosService,
  relacionesService,
  movimientosService,
} from "../services/api";
import { useAuth } from "./AuthContext";
import { toLocalDateString } from "../utils/formatters";

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

// Ya no usamos datos demo para envíos - siempre desde backend
const enviosIniciales = [];

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

// Ya no usamos vehículos/conductores separados - ahora usamos fletes vinculados
const vehiculosIniciales = [];
const conductoresIniciales = [];

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
  const [productosInactivos, setProductosInactivos] = useState([]);
  const [envios, setEnvios] = useState([]);
  const [movimientos, setMovimientos] = useState(
    MODO_CONEXION === "api" ? [] : movimientosDepositoIniciales,
  );
  const [totalesContables, setTotalesContables] = useState(null);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [vehiculos, setVehiculos] = useState(vehiculosIniciales);
  const [conductores, setConductores] = useState(conductoresIniciales);
  const [fletes, setFletes] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [cargandoInventario, setCargandoInventario] = useState(true);
  const [cargandoEnvios, setCargandoEnvios] = useState(true);
  const [cargandoFletes, setCargandoFletes] = useState(true);

  // Cargar fletes relacionados con el depósito
  const cargarFletes = async () => {
    if (MODO_CONEXION === "api" && usuario?.id) {
      try {
        setCargandoFletes(true);
        const response = await relacionesService.getMisFletes();
        // response ya es response.data por el interceptor, así que response.data es el array real
        const fletesData = response?.data || response || [];

        console.log("Response fletes:", response);
        console.log("Fletes data:", fletesData);

        const fletesMapeados = Array.isArray(fletesData)
          ? fletesData.map((f) => ({
              id: f.id,
              nombre: f.nombre,
              telefono: f.telefono || "",
              email: f.email || "",
              vehiculoTipo: f.vehiculoTipo || "",
              vehiculoPatente: f.vehiculoPatente || "",
              vehiculoCapacidad: f.vehiculoCapacidad || "",
              estado: "disponible",
              foto: f.foto || null,
            }))
          : [];

        setFletes(fletesMapeados);
        console.log("Fletes cargados:", fletesMapeados.length);
      } catch (error) {
        console.error("Error al cargar fletes:", error);
        setFletes([]);
      } finally {
        setCargandoFletes(false);
      }
    } else {
      setCargandoFletes(false);
    }
  };

  useEffect(() => {
    console.log("useEffect cargarFletes - usuario?.id:", usuario?.id);
    if (usuario?.id) {
      cargarFletes();
    }
  }, [usuario?.id]);

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
              ? toLocalDateString(pedido.createdAt)
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
          setPedidos([]); // Array vacío en caso de error en modo API
        }
      } else {
        setPedidos(pedidosDepositoIniciales);
      }
      setCargandoPedidos(false);
    };

    // Solo cargar si hay usuario autenticado (token disponible)
    if (usuario?.id) {
      cargarPedidos();
    } else if (MODO_CONEXION !== "api") {
      cargarPedidos();
    } else {
      setCargandoPedidos(false);
    }
  }, [usuario?.id]);

  // Escuchar eventos del navegador desde NotificacionContext (socket centralizado)
  useEffect(() => {
    if (MODO_CONEXION !== "api" || !usuario?.id) return;

    const handleNuevoPedido = async (event) => {
      console.log(
        "DepositoContext: Recibido socket:nuevo_pedido",
        event.detail,
      );

      // Recargar pedidos desde el backend para tener datos completos
      try {
        const response = await pedidosService.getAll();
        const pedidosBackend = response.data || response || [];
        const pedidosMapeados = pedidosBackend.map((pedido) => ({
          id: pedido.id,
          clienteId: pedido.clienteId,
          cliente: pedido.cliente?.nombre || "Cliente",
          fecha: pedido.createdAt
            ? toLocalDateString(pedido.createdAt)
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
        console.error("Error al recargar pedidos:", error);
      }
    };

    const handleEnvioEntregado = async (event) => {
      const data = event.detail;
      console.log(
        "DepositoContext: Recibido socket:envio_entregado_deposito",
        data,
      );

      // Buscar el pedido para obtener el total
      const pedido = pedidos.find(
        (p) => String(p.id) === String(data.pedidoId),
      );

      // Actualizar el estado del pedido localmente
      setPedidos((prev) =>
        prev.map((p) =>
          String(p.id) === String(data.pedidoId)
            ? { ...p, estado: "entregado" }
            : p,
        ),
      );

      // Registrar ingreso contable por la venta
      if (pedido && parseFloat(pedido.total) > 0) {
        try {
          await movimientosService.crear({
            tipo: "ingreso",
            concepto: `Venta - Pedido entregado a ${pedido.cliente || "cliente"}`,
            monto: parseFloat(pedido.total),
            categoria: "ventas",
            notas: `Pedido ID: ${pedido.id}`,
          });
          console.log(
            "Movimiento contable de venta registrado para pedido:",
            pedido.id,
          );
        } catch (movError) {
          console.error("Error al registrar movimiento de venta:", movError);
        }
      }
    };

    // Handler para cuando el flete marca el envío como "en camino"
    const handleEnvioEnCamino = (event) => {
      const data = event.detail;
      console.log(
        "DepositoContext: Recibido socket:envio_en_camino_deposito",
        data,
      );

      // Actualizar el estado del pedido a "enviado"
      setPedidos((prev) =>
        prev.map((p) =>
          String(p.id) === String(data.pedidoId)
            ? { ...p, estado: "enviado" }
            : p,
        ),
      );
    };

    // Escuchar evento de nuevo movimiento contable para actualizar automáticamente
    const handleMovimientoCreado = () => {
      console.log("DepositoContext: Recibido contabilidad:movimiento_creado");
      recargarMovimientos();
    };

    window.addEventListener("socket:nuevo_pedido", handleNuevoPedido);
    window.addEventListener(
      "socket:envio_entregado_deposito",
      handleEnvioEntregado,
    );
    window.addEventListener(
      "socket:envio_en_camino_deposito",
      handleEnvioEnCamino,
    );
    window.addEventListener(
      "contabilidad:movimiento_creado",
      handleMovimientoCreado,
    );

    return () => {
      window.removeEventListener("socket:nuevo_pedido", handleNuevoPedido);
      window.removeEventListener(
        "socket:envio_entregado_deposito",
        handleEnvioEntregado,
      );
      window.removeEventListener(
        "socket:envio_en_camino_deposito",
        handleEnvioEnCamino,
      );
      window.removeEventListener(
        "contabilidad:movimiento_creado",
        handleMovimientoCreado,
      );
    };
  }, [usuario?.id]);

  // Función para recargar inventario (usable desde fuera)
  const recargarInventario = async () => {
    if (MODO_CONEXION === "api" && usuario?.id) {
      setCargandoInventario(true);
      try {
        console.log("Recargando inventario para depositoId:", usuario.id);
        const response = await productosService.getByDeposito(usuario.id);
        const productosBackend = response.data || response || [];

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
            ? toLocalDateString(p.updatedAt)
            : toLocalDateString(new Date()),
        }));

        setInventario(inventarioMapeado);
        return inventarioMapeado;
      } catch (error) {
        console.error("Error al recargar inventario:", error);
        throw error;
      } finally {
        setCargandoInventario(false);
      }
    }
    return [];
  };

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
              ? toLocalDateString(p.updatedAt)
              : toLocalDateString(new Date()),
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

  // Cargar envíos del depósito desde el backend
  useEffect(() => {
    const cargarEnvios = async () => {
      if (MODO_CONEXION === "api" && usuario?.id) {
        setCargandoEnvios(true);
        try {
          const response = await enviosService.getAll();
          const enviosBackend = response.data || response || [];

          const enviosMapeados = enviosBackend.map((envio) => ({
            id: envio.id,
            pedidoId: envio.pedidoId,
            fleteId: envio.fleteId,
            flete: envio.flete?.nombre || "Sin asignar",
            estado: envio.estado || "pendiente",
            direccionOrigen: envio.direccionOrigen,
            direccionDestino: envio.direccionDestino,
            fechaEstimada: envio.fechaEstimada,
            fechaEntrega: envio.fechaEntrega,
            ubicacionActual: envio.ubicacionActual,
            notas: envio.notas,
            codigoSeguimiento: envio.codigoSeguimiento,
            createdAt: envio.createdAt,
          }));

          setEnvios(enviosMapeados);
        } catch (error) {
          console.error("Error al cargar envíos:", error);
          setEnvios([]);
        } finally {
          setCargandoEnvios(false);
        }
      } else if (!usuario?.id) {
        setEnvios([]);
        setCargandoEnvios(false);
      } else {
        setEnvios(enviosIniciales);
        setCargandoEnvios(false);
      }
    };

    cargarEnvios();
  }, [usuario?.id]);

  // Cargar movimientos contables desde el backend
  useEffect(() => {
    const cargarMovimientos = async () => {
      if (MODO_CONEXION === "api" && usuario?.id) {
        setCargandoMovimientos(true);
        try {
          const [movimientosRes, totalesRes] = await Promise.all([
            movimientosService.listar(),
            movimientosService.getTotales(),
          ]);

          const movimientosData = movimientosRes.data || movimientosRes || [];
          // Mapear movimientos al formato correcto
          setMovimientos(
            movimientosData.map((m) => ({
              id: m.id,
              fecha: toLocalDateString(m.createdAt),
              tipo: m.tipo,
              concepto: m.concepto,
              monto: parseFloat(m.monto),
              categoria: m.categoria,
              pedidoId: m.pedidoId,
              notas: m.notas,
            })),
          );
          setTotalesContables(totalesRes.data || totalesRes);
        } catch (error) {
          console.error("Error al cargar movimientos:", error);
          setMovimientos([]);
        } finally {
          setCargandoMovimientos(false);
        }
      }
    };

    cargarMovimientos();
  }, [usuario?.id]);

  // ============ PEDIDOS ============

  // Función para validar UUID
  const isValidUUID = (str) => {
    if (!str || typeof str !== "string") return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Cambiar estado de pedido
  const cambiarEstadoPedido = async (id, nuevoEstado) => {
    // Verificar que no sea el mismo estado
    const pedidoActual = pedidos.find((p) => String(p.id) === String(id));
    if (pedidoActual && pedidoActual.estado === nuevoEstado) {
      console.log(`El pedido ya está en estado ${nuevoEstado}, ignorando`);
      return true;
    }

    if (MODO_CONEXION === "api") {
      // Verificar que el ID sea un UUID válido antes de llamar al API
      if (!isValidUUID(String(id))) {
        console.warn("ID de pedido inválido (no es UUID):", id);
        // Solo actualizar localmente si es un ID de demo
        setPedidos(
          pedidos.map((p) =>
            String(p.id) === String(id) ? { ...p, estado: nuevoEstado } : p,
          ),
        );
        return true;
      }

      try {
        await pedidosService.cambiarEstado(id, nuevoEstado);
        setPedidos(
          pedidos.map((p) =>
            String(p.id) === String(id) ? { ...p, estado: nuevoEstado } : p,
          ),
        );

        // Si el pedido se marca como entregado, registrar venta en contabilidad
        if (nuevoEstado === "entregado" && pedidoActual) {
          const totalPedido = parseFloat(pedidoActual.total) || 0;
          if (totalPedido > 0) {
            try {
              await movimientosService.crear({
                tipo: "ingreso",
                concepto: `Venta - Pedido #${pedidoActual.numero || pedidoActual.id?.toString().slice(-4) || "?"} - ${pedidoActual.cliente?.nombre || pedidoActual.cliente || "Cliente"}`,
                monto: totalPedido,
                categoria: "ventas",
                pedidoId: id,
                notas: `Pedido entregado. Productos: ${pedidoActual.productos?.length || 0}`,
              });
              console.log("Movimiento contable (venta pedido) registrado:", id);
              // Emitir evento para actualizar contabilidad
              window.dispatchEvent(
                new CustomEvent("contabilidad:movimiento_creado"),
              );
            } catch (movError) {
              console.error("Error al registrar venta del pedido:", movError);
            }
          }
        }

        return true;
      } catch (error) {
        console.error("Error al cambiar estado del pedido:", error);
        throw error;
      }
    } else {
      setPedidos(
        pedidos.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p)),
      );
      return true;
    }
  };

  // Obtener pedidos por estado
  const getPedidosPorEstado = (estado) => {
    if (estado === "todos") return pedidos;
    return pedidos.filter((p) => p.estado === estado);
  };

  // ============ INVENTARIO ============

  // Actualizar stock
  const actualizarStock = async (
    productoId,
    cantidad,
    tipo,
    registrarContabilidad = true,
  ) => {
    if (MODO_CONEXION === "api") {
      try {
        // Obtener el producto para tener acceso a su información
        const producto = inventario.find(
          (p) => String(p.id) === String(productoId),
        );

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
                ultimaActualizacion: toLocalDateString(new Date()),
              };
            }
            return p;
          }),
        );

        // Registrar movimiento contable si está habilitado
        if (registrarContabilidad && producto) {
          if (tipo === "entrada") {
            // Entrada = Compra (egreso)
            const costo = producto.costo || 0;
            const costoTotal = parseFloat(costo) * parseInt(cantidad);
            if (costoTotal > 0) {
              try {
                await movimientosService.crear({
                  tipo: "egreso",
                  concepto: `Reposición stock: ${producto.nombre} (+${cantidad} unidades)`,
                  monto: costoTotal,
                  categoria: "compras",
                  notas: `Producto: ${producto.codigo} - Costo unitario: $${parseFloat(costo).toLocaleString()}`,
                });
                console.log(
                  "Movimiento contable (compra) registrado:",
                  producto.nombre,
                );
              } catch (movError) {
                console.error(
                  "Error al registrar movimiento contable:",
                  movError,
                );
              }
            }
          } else {
            // Salida = Venta (ingreso)
            const precio = producto.precio || 0;
            const ventaTotal = parseFloat(precio) * parseInt(cantidad);
            if (ventaTotal > 0) {
              try {
                await movimientosService.crear({
                  tipo: "ingreso",
                  concepto: `Venta: ${producto.nombre} (${cantidad} unidades)`,
                  monto: ventaTotal,
                  categoria: "ventas",
                  notas: `Producto: ${producto.codigo} - Precio unitario: $${parseFloat(precio).toLocaleString()}`,
                });
                console.log(
                  "Movimiento contable (venta) registrado:",
                  producto.nombre,
                );
              } catch (movError) {
                console.error(
                  "Error al registrar movimiento contable:",
                  movError,
                );
              }
            }
          }
        }
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
              ultimaActualizacion: toLocalDateString(new Date()),
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
          ultimaActualizacion: toLocalDateString(new Date()),
        };

        setInventario((prev) => [...prev, productoMapeado]);

        // El movimiento contable de egreso (compra) se registra automáticamente en el backend
        // al crear el producto con stock y precio - recargar movimientos para reflejar el cambio
        if ((producto.precio || producto.costo) && producto.stock > 0) {
          await recargarMovimientos();
        }

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
        ultimaActualizacion: toLocalDateString(new Date()),
      };
      setInventario([...inventario, nuevoProducto]);
      return nuevoProducto;
    }
  };

  // Editar producto del inventario
  const editarProducto = async (productoId, datosActualizados) => {
    if (MODO_CONEXION === "api") {
      try {
        if (!usuario?.id) {
          throw new Error("Usuario no autenticado");
        }

        console.log("Actualizando producto:", productoId, datosActualizados);

        // Actualizar producto en el backend
        const response = await productosService.actualizar(
          productoId,
          datosActualizados,
        );

        const productoActualizado = response.data || response;

        // Mapear al formato del inventario
        const productoMapeado = {
          id: productoActualizado.id,
          codigo: productoActualizado.codigo,
          nombre: productoActualizado.nombre,
          categoria: productoActualizado.categoria || "Sin categoría",
          stock: productoActualizado.stock || 0,
          stockMinimo:
            productoActualizado.stockMinimo ||
            productoActualizado.stock_minimo ||
            10,
          stockMaximo:
            productoActualizado.stockMaximo ||
            productoActualizado.stock_maximo ||
            100,
          precio: parseFloat(productoActualizado.precio) || 0,
          costo: parseFloat(productoActualizado.costo) || 0,
          ubicacion: productoActualizado.ubicacion || "",
          imagen: productoActualizado.imagen || "",
          ultimaActualizacion: toLocalDateString(new Date()),
        };

        // Actualizar el inventario local
        setInventario((prev) =>
          prev.map((p) => (p.id === productoId ? productoMapeado : p)),
        );

        return productoMapeado;
      } catch (error) {
        console.error("Error al actualizar producto:", error);
        console.error("Error detalle:", error.response?.data || error.message);
        throw error;
      }
    } else {
      // Modo local (fallback)
      setInventario((prev) =>
        prev.map((p) =>
          p.id === productoId
            ? {
                ...p,
                ...datosActualizados,
                ultimaActualizacion: toLocalDateString(new Date()),
              }
            : p,
        ),
      );
    }
  };

  // Eliminar producto del inventario (borrado lógico)
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

  // Eliminar producto permanentemente (borrado físico)
  const eliminarProductoPermanente = async (productoId) => {
    if (MODO_CONEXION === "api") {
      try {
        await productosService.eliminarPermanente(productoId);
        setInventario((prev) => prev.filter((p) => p.id !== productoId));
        setProductosInactivos((prev) =>
          prev.filter((p) => p.id !== productoId),
        );
        return true;
      } catch (error) {
        console.error("Error al eliminar producto permanentemente:", error);
        throw error;
      }
    } else {
      setInventario((prev) => prev.filter((p) => p.id !== productoId));
      return true;
    }
  };

  // Reactivar producto (deshacer borrado lógico)
  const reactivarProducto = async (productoId) => {
    if (MODO_CONEXION === "api") {
      try {
        const response = await productosService.reactivar(productoId);
        const productoReactivado = response.data || response;

        // Mapear al formato del inventario
        const productoMapeado = {
          id: productoReactivado.id,
          codigo: productoReactivado.codigo,
          nombre: productoReactivado.nombre,
          categoria: productoReactivado.categoria || "Sin categoría",
          stock: productoReactivado.stock || 0,
          stockMinimo: productoReactivado.stockMinimo || 10,
          stockMaximo: productoReactivado.stockMaximo || 100,
          precio: parseFloat(productoReactivado.precio) || 0,
          costo: parseFloat(productoReactivado.costo) || 0,
          ubicacion: productoReactivado.ubicacion || "",
          imagen: productoReactivado.imagen || "",
          ultimaActualizacion: toLocalDateString(new Date()),
        };

        // Agregar al inventario activo y quitar de inactivos
        setInventario((prev) => [...prev, productoMapeado]);
        setProductosInactivos((prev) =>
          prev.filter((p) => p.id !== productoId),
        );
        return productoMapeado;
      } catch (error) {
        console.error("Error al reactivar producto:", error);
        throw error;
      }
    }
    return null;
  };

  // Cargar productos inactivos
  const cargarProductosInactivos = async () => {
    if (MODO_CONEXION === "api") {
      try {
        const response = await productosService.getInactivos();
        const productosBackend = response.data || response || [];

        const productosMapeados = productosBackend.map((p) => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          categoria: p.categoria || "Sin categoría",
          stock: p.stock || 0,
          stockMinimo: p.stockMinimo || 10,
          stockMaximo: p.stockMaximo || 100,
          precio: parseFloat(p.precio) || 0,
          costo: parseFloat(p.costo) || 0,
          ubicacion: p.ubicacion || "",
          imagen: p.imagen || "",
          fechaEliminacion: p.updatedAt,
        }));

        setProductosInactivos(productosMapeados);
        return productosMapeados;
      } catch (error) {
        console.error("Error al cargar productos inactivos:", error);
        return [];
      }
    }
    return [];
  };

  // Productos con stock bajo
  const getProductosStockBajo = () => {
    return inventario.filter((p) => p.stock <= p.stockMinimo);
  };

  // ============ ENVIOS ============

  // Crear envío
  const crearEnvio = async (envioData) => {
    if (MODO_CONEXION === "api") {
      // Verificar que el pedidoId sea un UUID válido antes de llamar al API
      if (!isValidUUID(String(envioData.pedidoId))) {
        console.warn("ID de pedido inválido (no es UUID):", envioData.pedidoId);
        // Crear envío local para datos demo
        const nuevoEnvio = {
          ...envioData,
          id: `demo-${Date.now()}`,
          estado: "pendiente",
        };
        setEnvios((prev) => [...prev, nuevoEnvio]);
        return nuevoEnvio;
      }

      try {
        const response = await enviosService.crear(envioData);
        const nuevoEnvio = response.data || response;

        const envioMapeado = {
          id: nuevoEnvio.id,
          pedidoId: nuevoEnvio.pedidoId,
          fleteId: nuevoEnvio.fleteId,
          estado: nuevoEnvio.estado || "pendiente",
          direccionOrigen: nuevoEnvio.direccionOrigen,
          direccionDestino: nuevoEnvio.direccionDestino,
          fechaEstimada: nuevoEnvio.fechaEstimada,
          notas: nuevoEnvio.notas,
        };

        setEnvios((prev) => [...prev, envioMapeado]);
        return envioMapeado;
      } catch (error) {
        console.error("Error al crear envío:", error);
        throw error;
      }
    } else {
      const nuevoEnvio = {
        ...envioData,
        id: envios.length + 1,
        estado: "pendiente",
      };
      setEnvios([...envios, nuevoEnvio]);
      return nuevoEnvio;
    }
  };

  // Actualizar estado de envío
  const actualizarEstadoEnvio = async (id, nuevoEstado) => {
    if (MODO_CONEXION === "api") {
      try {
        await enviosService.cambiarEstado(id, nuevoEstado);
        setEnvios(
          envios.map((e) =>
            String(e.id) === String(id) ? { ...e, estado: nuevoEstado } : e,
          ),
        );
        return true;
      } catch (error) {
        console.error("Error al actualizar estado del envío:", error);
        throw error;
      }
    } else {
      setEnvios(
        envios.map((e) => (e.id === id ? { ...e, estado: nuevoEstado } : e)),
      );
      return true;
    }
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
      fecha: toLocalDateString(new Date()),
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
  const agregarMovimiento = async (movimiento) => {
    if (MODO_CONEXION === "api") {
      try {
        const response = await movimientosService.crear(movimiento);
        const data = response.data || response;
        // Mapear al formato correcto
        const nuevoMovimiento = {
          id: data.id,
          fecha: toLocalDateString(data.createdAt),
          tipo: data.tipo,
          concepto: data.concepto,
          monto: parseFloat(data.monto),
          categoria: data.categoria,
          pedidoId: data.pedidoId,
          notas: data.notas,
        };
        setMovimientos([nuevoMovimiento, ...movimientos]);
        // Recargar totales
        const totalesRes = await movimientosService.getTotales();
        setTotalesContables(totalesRes.data || totalesRes);
        return { success: true, data: nuevoMovimiento };
      } catch (error) {
        console.error("Error al agregar movimiento:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Error al agregar movimiento",
        };
      }
    } else {
      const nuevoMovimiento = {
        ...movimiento,
        id: movimientos.length + 1,
        fecha: toLocalDateString(new Date()),
      };
      setMovimientos([nuevoMovimiento, ...movimientos]);
      return { success: true, data: nuevoMovimiento };
    }
  };

  // Eliminar movimiento
  const eliminarMovimiento = async (id) => {
    if (MODO_CONEXION === "api") {
      try {
        await movimientosService.eliminar(id);
        setMovimientos(movimientos.filter((m) => m.id !== id));
        // Recargar totales
        const totalesRes = await movimientosService.getTotales();
        setTotalesContables(totalesRes.data || totalesRes);
        return { success: true };
      } catch (error) {
        console.error("Error al eliminar movimiento:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Error al eliminar",
        };
      }
    } else {
      setMovimientos(movimientos.filter((m) => m.id !== id));
      return { success: true };
    }
  };

  // Actualizar movimiento
  const actualizarMovimiento = async (id, datos) => {
    if (MODO_CONEXION === "api") {
      try {
        const response = await movimientosService.actualizar(id, datos);
        const movimientoActualizado = response.data || response;
        setMovimientos(
          movimientos.map((m) => (m.id === id ? movimientoActualizado : m)),
        );
        const totalesRes = await movimientosService.getTotales();
        setTotalesContables(totalesRes.data || totalesRes);
        return { success: true, data: movimientoActualizado };
      } catch (error) {
        console.error("Error al actualizar movimiento:", error);
        return {
          success: false,
          error: error.response?.data?.message || "Error al actualizar",
        };
      }
    } else {
      setMovimientos(
        movimientos.map((m) => (m.id === id ? { ...m, ...datos } : m)),
      );
      return { success: true };
    }
  };

  // Recargar movimientos
  const recargarMovimientos = async () => {
    if (MODO_CONEXION === "api" && usuario?.id) {
      setCargandoMovimientos(true);
      try {
        const [movimientosRes, totalesRes] = await Promise.all([
          movimientosService.listar(),
          movimientosService.getTotales(),
        ]);
        const movimientosData = movimientosRes.data || movimientosRes || [];
        // Mapear movimientos al formato correcto
        setMovimientos(
          movimientosData.map((m) => ({
            id: m.id,
            fecha: toLocalDateString(m.createdAt),
            tipo: m.tipo,
            concepto: m.concepto,
            monto: parseFloat(m.monto),
            categoria: m.categoria,
            pedidoId: m.pedidoId,
            notas: m.notas,
          })),
        );
        setTotalesContables(totalesRes.data || totalesRes);
      } catch (error) {
        console.error("Error al recargar movimientos:", error);
      } finally {
        setCargandoMovimientos(false);
      }
    }
  };

  // Calcular totales
  const calcularTotales = () => {
    // Calcular desde los movimientos cargados para asegurar consistencia
    const ingresosCalculados = movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);
    const egresosCalculados = movimientos
      .filter((m) => m.tipo === "egreso")
      .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);

    // Si hay movimientos, usar el cálculo local
    if (movimientos.length > 0) {
      return {
        ingresos: ingresosCalculados,
        egresos: egresosCalculados,
        balance: ingresosCalculados - egresosCalculados,
      };
    }

    // Si tenemos totales del backend y no hay movimientos locales, usarlos
    if (totalesContables) {
      return {
        ingresos:
          totalesContables.ingresos || totalesContables.totalIngresos || 0,
        egresos: totalesContables.egresos || totalesContables.totalEgresos || 0,
        balance: totalesContables.balance || 0,
      };
    }

    return {
      ingresos: 0,
      egresos: 0,
      balance: 0,
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
      fletesVinculados: fletes.length,
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
    fletes,
    notificaciones,
    cargandoPedidos,
    cargandoInventario,
    cargandoEnvios,
    cargandoFletes,
    cargandoMovimientos,
    cambiarEstadoPedido,
    getPedidosPorEstado,
    actualizarStock,
    agregarProducto,
    editarProducto,
    eliminarProducto,
    eliminarProductoPermanente,
    reactivarProducto,
    productosInactivos,
    cargarProductosInactivos,
    getProductosStockBajo,
    crearEnvio,
    actualizarEstadoEnvio,
    agregarMovimiento,
    eliminarMovimiento,
    actualizarMovimiento,
    recargarMovimientos,
    calcularTotales,
    getEstadisticas,
    agregarNotificacion,
    marcarNotificacionLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
    getNotificacionesNoLeidas,
    recibirPedidoCliente,
    cargarFletes,
    recargarInventario,
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
