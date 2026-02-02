import { createContext, useContext, useState } from "react";

const FleteContext = createContext();

// Envíos asignados al transportista
const enviosAsignadosIniciales = [
  {
    id: 1,
    pedidoId: 1,
    cliente: "Tienda La Esquina",
    direccion: "Calle Principal 123",
    telefono: "555-1234",
    deposito: "Depósito Central",
    depositoDireccion: "Av. Industrial 500",
    productos: [
      { nombre: "Producto A", cantidad: 10 },
      { nombre: "Producto B", cantidad: 5 },
    ],
    fechaAsignacion: "2026-02-02",
    fechaEntrega: "2026-02-02",
    horarioEntrega: "09:00 - 12:00",
    estado: "pendiente",
    prioridad: "alta",
    notas: "Tocar timbre 2 veces",
    total: 2500,
  },
  {
    id: 2,
    pedidoId: 2,
    cliente: "Minimercado Sol",
    direccion: "Av. Libertad 456",
    telefono: "555-5678",
    deposito: "Depósito Central",
    depositoDireccion: "Av. Industrial 500",
    productos: [{ nombre: "Producto C", cantidad: 20 }],
    fechaAsignacion: "2026-02-02",
    fechaEntrega: "2026-02-02",
    horarioEntrega: "14:00 - 17:00",
    estado: "en_camino",
    prioridad: "media",
    notas: "",
    total: 1600,
  },
  {
    id: 3,
    pedidoId: 5,
    cliente: "Kiosco Central",
    direccion: "Plaza Mayor 789",
    telefono: "555-9012",
    deposito: "Depósito Norte",
    depositoDireccion: "Ruta 5 Km 12",
    productos: [{ nombre: "Producto F", cantidad: 30 }],
    fechaAsignacion: "2026-02-01",
    fechaEntrega: "2026-02-01",
    horarioEntrega: "10:00 - 13:00",
    estado: "entregado",
    prioridad: "baja",
    notas: "Entregado sin problemas",
    total: 3600,
  },
  {
    id: 4,
    pedidoId: 6,
    cliente: "Supermercado Norte",
    direccion: "Av. Norte 1234",
    telefono: "555-3456",
    deposito: "Depósito Central",
    depositoDireccion: "Av. Industrial 500",
    productos: [
      { nombre: "Producto A", cantidad: 25 },
      { nombre: "Producto B", cantidad: 15 },
    ],
    fechaAsignacion: "2026-01-31",
    fechaEntrega: "2026-01-31",
    horarioEntrega: "08:00 - 11:00",
    estado: "entregado",
    prioridad: "alta",
    notas: "",
    total: 6750,
  },
  {
    id: 5,
    pedidoId: 7,
    cliente: "Almacén Don Pedro",
    direccion: "Calle Sur 567",
    telefono: "555-7890",
    deposito: "Depósito Sur",
    depositoDireccion: "Camino Rural 200",
    productos: [{ nombre: "Producto D", cantidad: 8 }],
    fechaAsignacion: "2026-01-30",
    fechaEntrega: "2026-01-30",
    horarioEntrega: "15:00 - 18:00",
    estado: "cancelado",
    prioridad: "media",
    notas: "Cliente no se encontraba",
    total: 2400,
  },
];

// Movimientos contables del flete
const movimientosFleteIniciales = [
  {
    id: 1,
    fecha: "2026-02-02",
    tipo: "ingreso",
    concepto: "Pago envío #1",
    monto: 500,
    categoria: "envios",
  },
  {
    id: 2,
    fecha: "2026-02-02",
    tipo: "egreso",
    concepto: "Combustible",
    monto: 200,
    categoria: "combustible",
  },
  {
    id: 3,
    fecha: "2026-02-01",
    tipo: "ingreso",
    concepto: "Pago envío #3",
    monto: 600,
    categoria: "envios",
  },
  {
    id: 4,
    fecha: "2026-02-01",
    tipo: "ingreso",
    concepto: "Pago envío #4",
    monto: 800,
    categoria: "envios",
  },
  {
    id: 5,
    fecha: "2026-01-31",
    tipo: "egreso",
    concepto: "Mantenimiento vehículo",
    monto: 1500,
    categoria: "mantenimiento",
  },
  {
    id: 6,
    fecha: "2026-01-30",
    tipo: "egreso",
    concepto: "Peajes",
    monto: 150,
    categoria: "peajes",
  },
];

// Notificaciones del flete
const notificacionesFleteIniciales = [
  {
    id: 1,
    tipo: "envio",
    titulo: "Nuevo envío asignado",
    mensaje: "Se te ha asignado un nuevo envío para Tienda La Esquina",
    fecha: "2026-02-02T08:30:00",
    leida: false,
    datos: { envioId: 1 },
  },
  {
    id: 2,
    tipo: "urgente",
    titulo: "Envío prioritario",
    mensaje: "El envío #2 tiene prioridad alta, entregar antes de las 12:00",
    fecha: "2026-02-02T07:00:00",
    leida: true,
    datos: { envioId: 2 },
  },
];

// Información del vehículo
const vehiculoInicial = {
  id: 1,
  tipo: "camioneta",
  marca: "Ford",
  modelo: "Ranger",
  año: 2024,
  patente: "ABC-123",
  capacidad: "500kg",
  estado: "operativo",
  kmActual: 45000,
  proximoService: 50000,
};

export function FleteProvider({ children }) {
  const [envios, setEnvios] = useState(enviosAsignadosIniciales);
  const [movimientos, setMovimientos] = useState(movimientosFleteIniciales);
  const [notificaciones, setNotificaciones] = useState(
    notificacionesFleteIniciales,
  );
  const [vehiculo, setVehiculo] = useState(vehiculoInicial);

  // ============ ENVÍOS ============

  // Cambiar estado de envío
  const cambiarEstadoEnvio = (id, nuevoEstado, notas = "") => {
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
  };

  // Obtener envíos por estado
  const getEnviosPorEstado = (estado) => {
    if (estado === "todos") return envios;
    return envios.filter((e) => e.estado === estado);
  };

  // Obtener envíos del día
  const getEnviosDelDia = () => {
    const hoy = new Date().toISOString().split("T")[0];
    return envios.filter((e) => e.fechaEntrega === hoy);
  };

  // Obtener envíos pendientes
  const getEnviosPendientes = () => {
    return envios.filter(
      (e) => e.estado === "pendiente" || e.estado === "en_camino",
    );
  };

  // Marcar como recogido (en depósito)
  const marcarRecogido = (id) => {
    cambiarEstadoEnvio(id, "en_camino");
    agregarNotificacion({
      tipo: "info",
      titulo: "Envío recogido",
      mensaje: `Has recogido el envío #${id} del depósito`,
      datos: { envioId: id },
    });
  };

  // Marcar como entregado
  const marcarEntregado = (id, notas = "") => {
    cambiarEstadoEnvio(id, "entregado", notas);
    agregarNotificacion({
      tipo: "success",
      titulo: "Envío entregado",
      mensaje: `El envío #${id} ha sido entregado exitosamente`,
      datos: { envioId: id },
    });
  };

  // Reportar problema
  const reportarProblema = (id, descripcion) => {
    cambiarEstadoEnvio(id, "problema", descripcion);
    agregarNotificacion({
      tipo: "alerta",
      titulo: "Problema reportado",
      mensaje: `Se ha reportado un problema con el envío #${id}`,
      datos: { envioId: id },
    });
  };

  // ============ CONTABILIDAD ============

  const agregarMovimiento = (movimiento) => {
    const nuevoMovimiento = {
      ...movimiento,
      id: movimientos.length + 1,
      fecha: new Date().toISOString().split("T")[0],
    };
    setMovimientos([nuevoMovimiento, ...movimientos]);
    return nuevoMovimiento;
  };

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
    setVehiculo({ ...vehiculo, kmActual: km });
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
    notificaciones,
    vehiculo,
    cambiarEstadoEnvio,
    getEnviosPorEstado,
    getEnviosDelDia,
    getEnviosPendientes,
    marcarRecogido,
    marcarEntregado,
    reportarProblema,
    agregarMovimiento,
    calcularTotales,
    agregarNotificacion,
    marcarNotificacionLeida,
    marcarTodasLeidas,
    getNotificacionesNoLeidas,
    actualizarKilometraje,
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
