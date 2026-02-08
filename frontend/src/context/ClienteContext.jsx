import { createContext, useContext, useState, useEffect } from "react";
import {
  usuariosService,
  productosService,
  pedidosService,
  movimientosService,
  stockService,
} from "../services/api";
import { useAuth } from "./AuthContext";
import { toLocalDateString } from "../utils/formatters";

const ClienteContext = createContext();

// Configurar modo de conexión: 'api' o 'local'
const MODO_CONEXION = process.env.NEXT_PUBLIC_MODE || "api";

export function ClienteProvider({ children }) {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [stockCliente, setStockCliente] = useState([]);
  const [cargandoStock, setCargandoStock] = useState(false);
  const [totalesContables, setTotalesContables] = useState({
    ingresos: 0,
    egresos: 0,
    balance: 0,
    categorias: {},
    porMes: {},
  });
  const [productos] = useState([]);
  const [cargandoDepositos, setCargandoDepositos] = useState(true);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [carrito, setCarrito] = useState({
    productos: [],
  });

  // Función para validar UUID
  const isValidUUID = (str) => {
    if (!str || typeof str !== "string") return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Cargar depósitos desde el backend
  useEffect(() => {
    const cargarDepositos = async () => {
      setCargandoDepositos(true);
      try {
        const response = await usuariosService.getDepositos();
        const depositosBackend = response.data || response || [];

        // Cargar productos para cada depósito
        const depositosConProductos = await Promise.all(
          depositosBackend.map(async (dep) => {
            try {
              const prodResponse = await productosService.getByDeposito(
                dep.id,
              );
              const productos = prodResponse.data || prodResponse || [];
              return {
                id: dep.id,
                nombre: dep.nombre,
                direccion: dep.direccion || "",
                telefono: dep.telefono || "",
                horarioApertura:
                  dep.horarioApertura || dep.horario_apertura || "08:00",
                horarioCierre:
                  dep.horarioCierre || dep.horario_cierre || "18:00",
                diasLaborales: dep.diasLaborales ||
                  dep.dias_laborales || [1, 2, 3, 4, 5],
                tiposEnvio: dep.tiposEnvio || dep.tipos_envio || ["envio"],
                disponible: true,
                imagen: dep.foto || "🏭",
                productos: productos.map((p) => ({
                  id: p.id,
                  codigo: p.codigo,
                  nombre: p.nombre,
                  categoria: p.categoria || "Sin categoría",
                  precio: parseFloat(p.precio) || 0,
                  stock: p.stock || 0,
                  imagen: p.imagen || "",
                })),
              };
            } catch (error) {
              console.error(
                `Error al cargar productos del depósito ${dep.id}:`,
                error,
              );
              return {
                id: dep.id,
                nombre: dep.nombre,
                direccion: dep.direccion || "",
                telefono: dep.telefono || "",
                horarioApertura:
                  dep.horarioApertura || dep.horario_apertura || "08:00",
                horarioCierre:
                  dep.horarioCierre || dep.horario_cierre || "18:00",
                diasLaborales: dep.diasLaborales ||
                  dep.dias_laborales || [1, 2, 3, 4, 5],
                tiposEnvio: dep.tiposEnvio || dep.tipos_envio || ["envio"],
                disponible: true,
                imagen: dep.foto || "🏭",
                productos: [],
              };
            }
          }),
        );

        setDepositos(depositosConProductos);
      } catch (error) {
        console.error("Error al cargar depósitos:", error);
        setDepositos([]);
      }
      setCargandoDepositos(false);
    };

    cargarDepositos();
  }, [usuario?.id]);

  // Cargar pedidos desde el backend
  useEffect(() => {
    const cargarPedidos = async () => {
      if (!usuario?.id) {
        setPedidos([]);
        setCargandoPedidos(false);
        return;
      }

      setCargandoPedidos(true);
      try {
        const response = await pedidosService.getAll();
        const pedidosBackend = response.data || response || [];
        const pedidosMapeados = pedidosBackend.map((pedido) => ({
          id: pedido.id,
          fecha: pedido.createdAt
            ? toLocalDateString(pedido.createdAt)
            : pedido.fecha,
          productos:
            pedido.productos?.map((p) => ({
              nombre: p.nombre || p.producto?.nombre,
              cantidad: p.cantidad,
              precio: parseFloat(p.precioUnitario || p.precio) || 0,
            })) || [],
          deposito: pedido.deposito?.nombre || "Sin depósito",
          depositoId: pedido.depositoId,
          tipoEnvio: pedido.tipoEnvio || "envio",
          estado: pedido.estado || "pendiente",
          total: parseFloat(pedido.total) || 0,
          direccion: pedido.direccionEntrega || pedido.direccion || "",
          notas: pedido.notas || "",
          prioridad: pedido.prioridad || "normal",
        }));

        setPedidos(pedidosMapeados);
      } catch (error) {
        console.error("Error al cargar pedidos:", error);
        setPedidos([]);
      } finally {
        setCargandoPedidos(false);
      }
    };

    cargarPedidos();
  }, [usuario?.id]);

  // Escuchar eventos del navegador desde NotificacionContext (socket centralizado)
  useEffect(() => {
    if (!usuario?.id) return;

    const handlePedidoActualizado = (event) => {
      const data = event.detail;
      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          String(p.id) === String(data.id) ? { ...p, estado: data.estado } : p,
        ),
      );
    };

    const handleEnvioEnCamino = (event) => {
      const data = event.detail;
      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          String(p.id) === String(data.pedidoId)
            ? { ...p, estado: "enviado" }
            : p,
        ),
      );
    };

    const handleEnvioEntregado = (event) => {
      const data = event.detail;
      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          String(p.id) === String(data.pedidoId)
            ? { ...p, estado: "entregado" }
            : p,
        ),
      );
    };

    // Escuchar evento de nuevo movimiento contable para actualizar automáticamente
    const handleMovimientoCreado = () => {
      recargarMovimientos();
    };

    window.addEventListener(
      "socket:pedido_actualizado",
      handlePedidoActualizado,
    );
    window.addEventListener("socket:envio_en_camino", handleEnvioEnCamino);
    window.addEventListener("socket:envio_entregado", handleEnvioEntregado);
    window.addEventListener(
      "contabilidad:movimiento_creado",
      handleMovimientoCreado,
    );

    return () => {
      window.removeEventListener(
        "socket:pedido_actualizado",
        handlePedidoActualizado,
      );
      window.removeEventListener("socket:envio_en_camino", handleEnvioEnCamino);
      window.removeEventListener(
        "socket:envio_entregado",
        handleEnvioEntregado,
      );
      window.removeEventListener(
        "contabilidad:movimiento_creado",
        handleMovimientoCreado,
      );
    };
  }, [usuario?.id]);

  // Cargar movimientos contables desde el backend
  useEffect(() => {
    const cargarMovimientos = async () => {
      if (!usuario?.id) return;

      setCargandoMovimientos(true);
      try {
        const [movimientosRes, totalesRes] = await Promise.all([
          movimientosService.listar(),
          movimientosService.getTotales(),
        ]);

        const movimientosData = movimientosRes.data || movimientosRes || [];
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

        const totalesData = totalesRes.data || totalesRes || {};
        setTotalesContables({
          ingresos: totalesData.ingresos || 0,
          egresos: totalesData.egresos || 0,
          balance: totalesData.balance || 0,
          categorias: totalesData.categorias || {},
          porMes: totalesData.porMes || {},
        });
      } catch (error) {
        console.error("Error al cargar movimientos:", error);
        setMovimientos([]);
      } finally {
        setCargandoMovimientos(false);
      }
    };

    cargarMovimientos();
  }, [usuario?.id]);

  // Cargar stock del cliente desde el backend
  useEffect(() => {
    const cargarStock = async () => {
      if (!usuario?.id) return;

      setCargandoStock(true);
      try {
        const stockRes = await stockService.obtenerStock();
        setStockCliente(stockRes.data || []);
      } catch (error) {
        console.error("Error al cargar stock:", error);
        setStockCliente([]);
      } finally {
        setCargandoStock(false);
      }
    };

    cargarStock();
  }, [usuario?.id]);

  // Obtener productos con stock bajo (menos de 10 unidades)
  const getProductosStockBajo = (limite = 10) => {
    return stockCliente.filter((p) => p.cantidad > 0 && p.cantidad <= limite);
  };

  // Funciones del carrito
  const agregarAlCarrito = (producto, depositoId) => {
    const existe = carrito.productos.find(
      (p) =>
        String(p.id) === String(producto.id) &&
        String(p.depositoId) === String(depositoId),
    );
    if (existe) {
      setCarrito({
        productos: carrito.productos.map((p) =>
          String(p.id) === String(producto.id) &&
            String(p.depositoId) === String(depositoId)
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
          String(p.id) === String(productoId) &&
            String(p.depositoId) === String(depositoId)
            ? { ...p, cantidad }
            : p,
        ),
      });
    }
  };

  const eliminarDelCarrito = (productoId, depositoId) => {
    const nuevosProductos = carrito.productos.filter(
      (p) =>
        !(
          String(p.id) === String(productoId) &&
          String(p.depositoId) === String(depositoId)
        ),
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
      .map((id) => depositos.find((d) => String(d.id) === String(id)))
      .filter(Boolean);
  };

  // Obtener productos del carrito por depósito
  const getProductosPorDeposito = (depositoId) => {
    return carrito.productos.filter(
      (p) => String(p.depositoId) === String(depositoId),
    );
  };

  const getTotalCarrito = () => {
    return carrito.productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  };

  const getCantidadCarrito = () => {
    return carrito.productos.reduce((sum, p) => sum + p.cantidad, 0);
  };

  // Crear pedido
  const crearPedido = async (nuevoPedido) => {
    try {
      const pedidoBackend = {
        depositoId: nuevoPedido.depositoId,
        tipoEnvio: nuevoPedido.tipoEnvio,
        direccion: nuevoPedido.direccion,
        notas: nuevoPedido.notas || "",
        productos: nuevoPedido.productos.map((p) => ({
          productoId: p.id,
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio: p.precio,
        })),
      };
      const response = await pedidosService.crear(pedidoBackend);
      const pedidoCreado = response.data || response;
      const pedidoMapeado = {
        id: pedidoCreado.id,
        fecha: pedidoCreado.createdAt
          ? toLocalDateString(pedidoCreado.createdAt)
          : toLocalDateString(new Date()),
        productos: nuevoPedido.productos,
        deposito: nuevoPedido.deposito,
        depositoId: nuevoPedido.depositoId,
        tipoEnvio: nuevoPedido.tipoEnvio,
        estado: pedidoCreado.estado || "pendiente",
        total: parseFloat(pedidoCreado.total) || nuevoPedido.total,
        direccion: nuevoPedido.direccion,
        notas: nuevoPedido.notas,
      };

      setPedidos((prev) => [pedidoMapeado, ...prev]);
      return pedidoMapeado;
    } catch (error) {
      console.error("Error al crear pedido:", error);
      throw error;
    }
  };

  // Modificar pedido
  const modificarPedido = async (id, datosActualizados) => {
    if (MODO_CONEXION === "api") {
      // Verificar que el ID sea un UUID válido antes de llamar al API
      if (!isValidUUID(String(id))) {
        console.warn("ID de pedido inválido (no es UUID):", id);
        setPedidos(
          pedidos.map((p) =>
            String(p.id) === String(id) ? { ...p, ...datosActualizados } : p,
          ),
        );
        return { success: true };
      }

      try {
        // Preparar datos para el backend
        const datosBackend = {
          tipoEnvio: datosActualizados.tipoEnvio,
          direccionEntrega: datosActualizados.direccion,
          notas: datosActualizados.notas || "",
          prioridad: datosActualizados.prioridad || "normal",
        };

        // Si hay productos, incluirlos
        if (datosActualizados.productos) {
          datosBackend.productos = datosActualizados.productos.map((p) => ({
            productoId: p.productoId || p.id || null, // Solo UUID válido o null
            nombre: p.nombre,
            cantidad: p.cantidad,
            precio: p.precio,
          }));
        }

        await pedidosService.actualizar(id, datosBackend);

        // Actualizar estado local
        setPedidos(
          pedidos.map((p) =>
            String(p.id) === String(id) ? { ...p, ...datosActualizados } : p,
          ),
        );
        return { success: true };
      } catch (error) {
        console.error("Error al modificar pedido:", error);
        return { success: false, error: error.message };
      }
    } else {
      setPedidos(
        pedidos.map((p) =>
          String(p.id) === String(id) ? { ...p, ...datosActualizados } : p,
        ),
      );
      return { success: true };
    }
  };

  // Cancelar pedido
  const cancelarPedido = async (id) => {
    if (MODO_CONEXION === "api") {
      // Verificar que el ID sea un UUID válido antes de llamar al API
      if (!isValidUUID(String(id))) {
        console.warn("ID de pedido inválido (no es UUID):", id);
        setPedidos(
          pedidos.map((p) =>
            String(p.id) === String(id) ? { ...p, estado: "cancelado" } : p,
          ),
        );
        return { success: true };
      }

      try {
        await pedidosService.cambiarEstado(id, "cancelado");
        setPedidos(
          pedidos.map((p) =>
            String(p.id) === String(id) ? { ...p, estado: "cancelado" } : p,
          ),
        );
        return { success: true };
      } catch (error) {
        console.error("Error al cancelar pedido:", error);
        return { success: false, error: error.message };
      }
    } else {
      setPedidos(
        pedidos.map((p) =>
          String(p.id) === String(id) ? { ...p, estado: "cancelado" } : p,
        ),
      );
      return { success: true };
    }
  };

  // Agregar movimiento contable
  const agregarMovimiento = async (movimiento) => {
    if (MODO_CONEXION === "api") {
      try {
        const response = await movimientosService.crear({
          tipo: movimiento.tipo,
          concepto: movimiento.concepto,
          monto: parseFloat(movimiento.monto),
          categoria: movimiento.categoria || "otros",
          notas: movimiento.notas || null,
        });

        const nuevoMovimiento = response.data || response;
        const movimientoFormateado = {
          id: nuevoMovimiento.id,
          fecha: toLocalDateString(nuevoMovimiento.createdAt),
          tipo: nuevoMovimiento.tipo,
          concepto: nuevoMovimiento.concepto,
          monto: parseFloat(nuevoMovimiento.monto),
          categoria: nuevoMovimiento.categoria,
        };

        setMovimientos((prev) => [movimientoFormateado, ...prev]);

        // Actualizar totales
        setTotalesContables((prev) => ({
          ...prev,
          ingresos:
            movimiento.tipo === "ingreso"
              ? prev.ingresos + parseFloat(movimiento.monto)
              : prev.ingresos,
          egresos:
            movimiento.tipo === "egreso"
              ? prev.egresos + parseFloat(movimiento.monto)
              : prev.egresos,
          balance:
            movimiento.tipo === "ingreso"
              ? prev.balance + parseFloat(movimiento.monto)
              : prev.balance - parseFloat(movimiento.monto),
        }));

        return { success: true, data: movimientoFormateado };
      } catch (error) {
        console.error("Error al crear movimiento:", error);
        return { success: false, error: error.message };
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

  // Eliminar movimiento contable
  const eliminarMovimiento = async (id) => {
    if (MODO_CONEXION === "api") {
      try {
        await movimientosService.eliminar(id);
        const movimientoEliminado = movimientos.find((m) => m.id === id);

        setMovimientos((prev) => prev.filter((m) => m.id !== id));

        // Actualizar totales
        if (movimientoEliminado) {
          setTotalesContables((prev) => ({
            ...prev,
            ingresos:
              movimientoEliminado.tipo === "ingreso"
                ? prev.ingresos - movimientoEliminado.monto
                : prev.ingresos,
            egresos:
              movimientoEliminado.tipo === "egreso"
                ? prev.egresos - movimientoEliminado.monto
                : prev.egresos,
            balance:
              movimientoEliminado.tipo === "ingreso"
                ? prev.balance - movimientoEliminado.monto
                : prev.balance + movimientoEliminado.monto,
          }));
        }

        return { success: true };
      } catch (error) {
        console.error("Error al eliminar movimiento:", error);
        return { success: false, error: error.message };
      }
    } else {
      setMovimientos((prev) => prev.filter((m) => m.id !== id));
      return { success: true };
    }
  };

  // Actualizar movimiento contable
  const actualizarMovimiento = async (id, datos) => {
    if (MODO_CONEXION === "api") {
      try {
        const response = await movimientosService.actualizar(id, datos);
        const movimientoActualizado = response.data || response;

        setMovimientos((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                ...m,
                tipo: movimientoActualizado.tipo,
                concepto: movimientoActualizado.concepto,
                monto: parseFloat(movimientoActualizado.monto),
                categoria: movimientoActualizado.categoria,
              }
              : m,
          ),
        );

        // Recargar totales para mantener consistencia
        const totalesRes = await movimientosService.getTotales();
        const totalesData = totalesRes.data || totalesRes || {};
        setTotalesContables({
          ingresos: totalesData.ingresos || 0,
          egresos: totalesData.egresos || 0,
          balance: totalesData.balance || 0,
          categorias: totalesData.categorias || {},
          porMes: totalesData.porMes || {},
        });

        return { success: true, data: movimientoActualizado };
      } catch (error) {
        console.error("Error al actualizar movimiento:", error);
        return { success: false, error: error.message };
      }
    } else {
      setMovimientos((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...datos } : m)),
      );
      return { success: true };
    }
  };

  // Recargar movimientos desde el backend
  const recargarMovimientos = async () => {
    if (MODO_CONEXION !== "api") return;

    setCargandoMovimientos(true);
    try {
      const [movimientosRes, totalesRes] = await Promise.all([
        movimientosService.listar(),
        movimientosService.getTotales(),
      ]);

      const movimientosData = movimientosRes.data || movimientosRes || [];
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

      const totalesData = totalesRes.data || totalesRes || {};
      setTotalesContables({
        ingresos: totalesData.ingresos || 0,
        egresos: totalesData.egresos || 0,
        balance: totalesData.balance || 0,
        categorias: totalesData.categorias || {},
        porMes: totalesData.porMes || {},
      });
    } catch (error) {
      console.error("Error al recargar movimientos:", error);
    } finally {
      setCargandoMovimientos(false);
    }
  };

  // Calcular totales de contabilidad
  const calcularTotales = () => {
    // Si estamos en modo API, usar los totales del backend
    if (MODO_CONEXION === "api") {
      // Si hay totales del backend O hay movimientos cargados, calcular
      if (
        totalesContables.ingresos > 0 ||
        totalesContables.egresos > 0 ||
        movimientos.length > 0
      ) {
        // Recalcular desde movimientos para asegurar consistencia
        const ingresosCalculados = movimientos
          .filter((m) => m.tipo === "ingreso")
          .reduce((sum, m) => sum + m.monto, 0);
        const egresosCalculados = movimientos
          .filter((m) => m.tipo === "egreso")
          .reduce((sum, m) => sum + m.monto, 0);

        return {
          ingresos: ingresosCalculados,
          egresos: egresosCalculados,
          balance: ingresosCalculados - egresosCalculados,
          categorias: totalesContables.categorias || {},
          porMes: totalesContables.porMes || {},
        };
      }
      return totalesContables;
    }

    // Calcular desde los movimientos locales
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
      categorias: totalesContables.categorias || {},
      porMes: totalesContables.porMes || {},
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
    const productosStockBajo = getProductosStockBajo().length;
    const totalProductosStock = stockCliente.length;

    return {
      pedidosPendientes,
      pedidosEnCamino,
      pedidosEntregados,
      totalPedidos,
      productosStockBajo,
      totalProductosStock,
      ...totales,
    };
  };

  const value = {
    pedidos,
    depositos,
    movimientos,
    stockCliente,
    totalesContables,
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
    eliminarMovimiento,
    actualizarMovimiento,
    recargarMovimientos,
    calcularTotales,
    getEstadisticas,
    getProductosStockBajo,
    cargandoDepositos,
    cargandoStock,
    cargandoPedidos,
    cargandoMovimientos,
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
