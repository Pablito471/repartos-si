import { createContext, useContext, useState, useEffect } from "react";
import { enviosService, movimientosService } from "../services/api";
import { useAuth } from "./AuthContext";
import { toLocalDateString } from "../utils/formatters";

const FleteContext = createContext();

// Configurar modo de conexión: 'api' o 'local'
const MODO_CONEXION = process.env.NEXT_PUBLIC_MODE || "api";

export function FleteProvider({ children }) {
  const { usuario } = useAuth();
  const [envios, setEnvios] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [totalesContables, setTotalesContables] = useState({
    ingresos: 0,
    egresos: 0,
    balance: 0,
    categorias: {},
    porMes: {},
  });
  const [notificaciones, setNotificaciones] = useState([]);
  const [vehiculo, setVehiculo] = useState(null);
  const [cargandoEnvios, setCargandoEnvios] = useState(true);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(true);

  // Cargar datos del vehículo desde el usuario
  useEffect(() => {
    if (usuario && usuario.tipoUsuario === "flete") {
      setVehiculo({
        tipo: usuario.vehiculoTipo || "Camioneta",
        marca: usuario.vehiculoTipo || "Vehículo",
        modelo: usuario.vehiculoModelo || "",
        año: 2020,
        patente: usuario.vehiculoPatente || "Sin patente",
        capacidad: usuario.vehiculoCapacidad || "1000 kg",
        tipoCombustible: "Diesel",
        estado: "operativo",
        kmActual: 45000,
        proximoService: 50000,
        vencimientoVTV: "2025-12-31",
        vencimientoSeguro: "2025-06-30",
        licenciaTipo: usuario.licenciaTipo || "B2",
        licenciaVencimiento: usuario.licenciaVencimiento || null,
      });
    }
  }, [usuario]);

  // Cargar movimientos contables del flete desde el backend
  useEffect(() => {
    const cargarMovimientos = async () => {
      if (MODO_CONEXION === "api" && usuario?.id) {
        try {
          setCargandoMovimientos(true);
          const [movimientosRes, totalesRes] = await Promise.all([
            movimientosService.listar({ limite: 100 }),
            movimientosService.getTotales(),
          ]);

          const movimientosData = movimientosRes.data || movimientosRes || [];
          const totalesData = totalesRes.data || totalesRes || {};

          // Formatear movimientos
          const movimientosFormateados = movimientosData.map((m) => ({
            id: m.id,
            fecha: toLocalDateString(m.createdAt),
            tipo: m.tipo,
            concepto: m.concepto,
            monto: parseFloat(m.monto),
            categoria: m.categoria,
            notas: m.notas,
          }));

          setMovimientos(movimientosFormateados);
          setTotalesContables({
            ingresos: totalesData.ingresos || 0,
            egresos: totalesData.egresos || 0,
            balance: totalesData.balance || 0,
            categorias: totalesData.categorias || {},
            porMes: totalesData.porMes || {},
          });
        } catch (error) {
          console.error("Error al cargar movimientos del flete:", error);
          setMovimientos([]);
        } finally {
          setCargandoMovimientos(false);
        }
      } else {
        setCargandoMovimientos(false);
      }
    };

    cargarMovimientos();
  }, [usuario?.id]);

  // Cargar envíos del flete desde el backend
  useEffect(() => {
    const cargarEnvios = async () => {
      if (MODO_CONEXION === "api" && usuario?.id) {
        try {
          setCargandoEnvios(true);
          const response = await enviosService.getAll();
          const enviosData = response.data || response || [];

          // Mapear envíos al formato esperado por el frontend
          const enviosMapeados = enviosData.map((envio) => ({
            id: envio.id,
            pedidoId: envio.pedidoId,
            numeroPedido: `PED-${String(envio.pedidoId).slice(-6).toUpperCase()}`,
            cliente: envio.pedido?.cliente?.nombre || "Cliente",
            direccion:
              envio.pedido?.direccion || envio.pedido?.cliente?.direccion || "",
            telefono: envio.pedido?.cliente?.telefono || "",
            deposito: envio.pedido?.deposito?.nombre || "Depósito",
            depositoDireccion: envio.pedido?.deposito?.direccion || "",
            productos:
              envio.pedido?.productos?.map((p) => ({
                nombre: p.nombre,
                cantidad: p.cantidad,
              })) || [],
            fechaAsignacion: toLocalDateString(envio.createdAt),
            fechaEntrega: envio.fechaEstimada
              ? toLocalDateString(envio.fechaEstimada)
              : null,
            horarioEntrega: envio.fechaEstimada
              ? new Date(envio.fechaEstimada).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })
              : "Sin horario",
            estado: envio.estado || "pendiente",
            prioridad: envio.pedido?.prioridad || "media",
            notas: envio.notas || "",
            total: envio.pedido?.total || 0,
          }));

          setEnvios(enviosMapeados);
        } catch (error) {
          console.error("Error al cargar envíos del flete:", error);
          setEnvios([]);
        } finally {
          setCargandoEnvios(false);
        }
      } else {
        // Sin API, lista vacía
        setEnvios([]);
        setCargandoEnvios(false);
      }
    };

    cargarEnvios();
  }, [usuario?.id]);

  // Escuchar eventos del navegador desde NotificacionContext (socket centralizado)
  useEffect(() => {
    if (MODO_CONEXION !== "api" || !usuario?.id) return;

    const handleEnvioAsignado = async (event) => {
      // Recargar los envíos desde el backend para tener la info completa
      try {
        const response = await enviosService.getAll();
        const enviosData = response.data || response || [];

        const enviosMapeados = enviosData.map((envio) => ({
          id: envio.id,
          pedidoId: envio.pedidoId,
          numeroPedido: `PED-${String(envio.pedidoId).slice(-6).toUpperCase()}`,
          cliente: envio.pedido?.cliente?.nombre || "Cliente",
          direccion:
            envio.pedido?.direccion || envio.pedido?.cliente?.direccion || "",
          telefono: envio.pedido?.cliente?.telefono || "",
          deposito: envio.pedido?.deposito?.nombre || "Depósito",
          depositoDireccion: envio.pedido?.deposito?.direccion || "",
          productos:
            envio.pedido?.productos?.map((p) => ({
              nombre: p.nombre,
              cantidad: p.cantidad,
            })) || [],
          fechaAsignacion: toLocalDateString(envio.createdAt),
          fechaEntrega: envio.fechaEstimada
            ? toLocalDateString(envio.fechaEstimada)
            : null,
          horarioEntrega: envio.fechaEstimada
            ? new Date(envio.fechaEstimada).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })
            : "Sin horario",
          estado: envio.estado || "pendiente",
          prioridad: envio.pedido?.prioridad || "media",
          notas: envio.notas || "",
          total: envio.pedido?.total || 0,
        }));

        setEnvios(enviosMapeados);
      } catch (error) {
        console.error("Error al recargar envíos:", error);
      }
    };

    window.addEventListener("socket:envio_asignado", handleEnvioAsignado);

    return () => {
      window.removeEventListener("socket:envio_asignado", handleEnvioAsignado);
    };
  }, [usuario?.id]);

  // ============ ENVÍOS ============

  // Cambiar estado de envío
  const cambiarEstadoEnvio = async (id, nuevoEstado, notas = "") => {
    if (MODO_CONEXION === "api") {
      try {
        await enviosService.cambiarEstado(id, nuevoEstado, notas);

        // Actualizar estado local
        setEnvios(
          envios.map((e) =>
            String(e.id) === String(id)
              ? {
                ...e,
                estado: nuevoEstado,
                notas: notas || e.notas,
                fechaActualizacion: new Date().toISOString(),
              }
              : e,
          ),
        );
      } catch (error) {
        console.error("Error al cambiar estado de envío:", error);
        throw error;
      }
    } else {
      setEnvios(
        envios.map((e) =>
          e.id === id
            ? {
              ...e,
              estado: nuevoEstado,
              notas: notas || e.notas,
              fechaActualizacion: new Date().toISOString(),
            }
            : e,
        ),
      );
    }
  };

  // Obtener envíos por estado
  const getEnviosPorEstado = (estado) => {
    if (estado === "todos") return envios;
    return envios.filter((e) => e.estado === estado);
  };

  // Obtener envíos del día (incluye pendientes y en camino sin importar fecha)
  const getEnviosDelDia = () => {
    const hoy = toLocalDateString();
    return envios.filter((e) => {
      // Mostrar todos los envíos pendientes o en camino (son entregas activas)
      if (e.estado === "pendiente" || e.estado === "en_camino") return true;
      // Si tiene fechaEntrega y es hoy, mostrar (incluye entregados de hoy)
      if (e.fechaEntrega && e.fechaEntrega === hoy) return true;
      // Si fue asignado hoy
      if (e.fechaAsignacion === hoy) return true;
      return false;
    });
  };

  // Obtener envíos pendientes
  const getEnviosPendientes = () => {
    return envios.filter(
      (e) => e.estado === "pendiente" || e.estado === "en_camino",
    );
  };

  // Marcar como recogido (en depósito)
  const marcarRecogido = async (id) => {
    await cambiarEstadoEnvio(id, "en_camino");
    agregarNotificacion({
      tipo: "info",
      titulo: "Envío recogido",
      mensaje: `Has recogido el envío #${id} del depósito`,
      datos: { envioId: id },
    });
  };

  // Marcar como entregado
  const marcarEntregado = async (id, notas = "") => {
    await cambiarEstadoEnvio(id, "entregado", notas);
    agregarNotificacion({
      tipo: "success",
      titulo: "Envío entregado",
      mensaje: `El envío #${id} ha sido entregado exitosamente`,
      datos: { envioId: id },
    });
  };

  // Reportar problema
  const reportarProblema = async (id, descripcion) => {
    await cambiarEstadoEnvio(id, "problema", descripcion);
    agregarNotificacion({
      tipo: "alerta",
      titulo: "Problema reportado",
      mensaje: `Se ha reportado un problema con el envío #${id}`,
      datos: { envioId: id },
    });
  };

  // ============ CONTABILIDAD ============

  // ============ CONTABILIDAD (Backend) ============

  const agregarMovimiento = async (movimiento) => {
    if (MODO_CONEXION === "api") {
      try {
        const response = await movimientosService.crear({
          tipo: movimiento.tipo,
          concepto: movimiento.concepto,
          monto: parseFloat(movimiento.monto),
          categoria: movimiento.categoria || "otros",
          notas: movimiento.notas || movimiento.descripcion || null,
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
      // Modo local
      const nuevoMovimiento = {
        ...movimiento,
        id: Date.now(),
        fecha: toLocalDateString(),
      };
      setMovimientos((prev) => [nuevoMovimiento, ...prev]);
      return { success: true, data: nuevoMovimiento };
    }
  };

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
                ...datos,
                monto: parseFloat(datos.monto || m.monto),
              }
              : m,
          ),
        );

        // Recargar totales
        await recargarMovimientos();

        return { success: true, data: movimientoActualizado };
      } catch (error) {
        console.error("Error al actualizar movimiento:", error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "Modo local no soportado" };
  };

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
    }
    return { success: false, error: "Modo local no soportado" };
  };

  const recargarMovimientos = async () => {
    if (MODO_CONEXION === "api" && usuario?.id) {
      try {
        const [movimientosRes, totalesRes] = await Promise.all([
          movimientosService.listar({ limite: 100 }),
          movimientosService.getTotales(),
        ]);

        const movimientosData = movimientosRes.data || movimientosRes || [];
        const totalesData = totalesRes.data || totalesRes || {};

        const movimientosFormateados = movimientosData.map((m) => ({
          id: m.id,
          fecha: toLocalDateString(m.createdAt),
          tipo: m.tipo,
          concepto: m.concepto,
          monto: parseFloat(m.monto),
          categoria: m.categoria,
          notas: m.notas,
        }));

        setMovimientos(movimientosFormateados);
        setTotalesContables({
          ingresos: totalesData.ingresos || 0,
          egresos: totalesData.egresos || 0,
          balance: totalesData.balance || 0,
          categorias: totalesData.categorias || {},
          porMes: totalesData.porMes || {},
        });
      } catch (error) {
        console.error("Error al recargar movimientos:", error);
      }
    }
  };

  const calcularTotales = () => {
    return {
      ingresos: totalesContables.ingresos,
      egresos: totalesContables.egresos,
      balance: totalesContables.balance,
    };
  };

  // ============ NOTIFICACIONES ============

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

  const marcarNotificacionLeida = (id) => {
    setNotificaciones(
      notificaciones.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
  };

  const marcarTodasLeidas = () => {
    setNotificaciones(notificaciones.map((n) => ({ ...n, leida: true })));
  };

  const getNotificacionesNoLeidas = () => {
    return notificaciones.filter((n) => !n.leida);
  };

  // ============ VEHÍCULO ============

  const actualizarKilometraje = (km) => {
    setVehiculo((prev) => ({ ...prev, kmActual: km }));
  };

  const actualizarVehiculo = (datos) => {
    setVehiculo((prev) => ({ ...prev, ...datos }));
  };

  // ============ ESTADÍSTICAS ============

  const getEstadisticas = () => {
    const enviosHoy = getEnviosDelDia();
    const enviosPendientes = envios.filter(
      (e) => e.estado === "pendiente",
    ).length;
    const enviosEnCamino = envios.filter(
      (e) => e.estado === "en_camino",
    ).length;
    const enviosEntregados = envios.filter(
      (e) => e.estado === "entregado",
    ).length;
    const enviosCancelados = envios.filter(
      (e) => e.estado === "cancelado",
    ).length;
    const totales = calcularTotales();

    // Calcular tasa de entrega exitosa
    const totalCompletados = enviosEntregados + enviosCancelados;
    const tasaExito =
      totalCompletados > 0
        ? Math.round((enviosEntregados / totalCompletados) * 100)
        : 100;

    return {
      enviosHoy: enviosHoy.length,
      enviosPendientesHoy: enviosHoy.filter((e) => e.estado === "pendiente")
        .length,
      enviosPendientes,
      enviosEnCamino,
      enviosEntregados,
      enviosCancelados,
      totalEnvios: envios.length,
      tasaExito,
      ...totales,
    };
  };

  const value = {
    envios,
    movimientos,
    totalesContables,
    notificaciones,
    vehiculo,
    cargandoEnvios,
    cargandoMovimientos,
    cambiarEstadoEnvio,
    getEnviosPorEstado,
    getEnviosDelDia,
    getEnviosPendientes,
    marcarRecogido,
    marcarEntregado,
    reportarProblema,
    agregarMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
    recargarMovimientos,
    calcularTotales,
    agregarNotificacion,
    marcarNotificacionLeida,
    marcarTodasLeidas,
    getNotificacionesNoLeidas,
    actualizarKilometraje,
    actualizarVehiculo,
    getEstadisticas,
  };

  return (
    <FleteContext.Provider value={value}>{children}</FleteContext.Provider>
  );
}

export function useFlete() {
  const context = useContext(FleteContext);
  if (!context) {
    throw new Error("useFlete debe usarse dentro de un FleteProvider");
  }
  return context;
}
