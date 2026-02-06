import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import CalendarioContabilidad from "@/components/CalendarioContabilidad";
import EstadisticasGrafico from "@/components/EstadisticasGrafico";
import { formatNumber } from "@/utils/formatters";
import { useState, useMemo, useEffect } from "react";
import { showSuccessAlert, showConfirmAlert, showToast } from "@/utils/alerts";

export default function Contabilidad() {
  const {
    movimientos,
    pedidos,
    envios,
    agregarMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
    calcularTotales,
    cargandoMovimientos,
    recargarMovimientos,
  } = useDeposito();

  // Escuchar eventos de movimientos creados para recargar automáticamente
  useEffect(() => {
    const handleMovimientoCreado = () => {
      console.log("💰 Recargando movimientos por evento...");
      recargarMovimientos();
    };

    window.addEventListener(
      "contabilidad:movimiento_creado",
      handleMovimientoCreado,
    );

    return () => {
      window.removeEventListener(
        "contabilidad:movimiento_creado",
        handleMovimientoCreado,
      );
    };
  }, [recargarMovimientos]);

  const [periodo, setPeriodo] = useState("mes");
  const [tipoMovimiento, setTipoMovimiento] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [vistaActiva, setVistaActiva] = useState("todo"); // "todo", "movimientos", "pedidos"
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [editandoMovimiento, setEditandoMovimiento] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: "ingreso",
    categoria: "ventas",
    concepto: "",
    monto: "",
    notas: "",
  });

  const categorias = {
    ventas: { nombre: "Ventas", icono: "💵", color: "green" },
    pedidos: { nombre: "Pedidos Recibidos", icono: "📦", color: "emerald" },
    compras: { nombre: "Compras", icono: "🛒", color: "red" },
    cobranzas: { nombre: "Cobranzas", icono: "📥", color: "blue" },
    logistica: { nombre: "Logistica", icono: "🚚", color: "yellow" },
    servicios: { nombre: "Servicios", icono: "⚡", color: "purple" },
    personal: { nombre: "Personal", icono: "👥", color: "orange" },
    otros: { nombre: "Otros", icono: "📋", color: "gray" },
  };

  // Convertir pedidos PENDIENTES a vista previa de ingresos esperados (no entregados aún)
  // Los pedidos entregados ya tienen su movimiento contable real registrado
  const pedidosPendientes = useMemo(() => {
    return pedidos
      .filter((p) => p.estado !== "cancelado" && p.estado !== "entregado")
      .map((pedido) => ({
        id: `pedido-${pedido.id}`,
        pedidoId: pedido.id,
        fecha:
          pedido.fecha ||
          (pedido.createdAt
            ? pedido.createdAt.split("T")[0]
            : new Date().toISOString().split("T")[0]),
        tipo: "ingreso",
        concepto: `📋 Pedido pendiente #${pedido.numero || pedido.id?.toString().slice(-4) || "?"} - ${pedido.cliente?.nombre || pedido.cliente || "Cliente"}`,
        monto: parseFloat(pedido.total) || 0,
        categoria: "pedidos",
        esPedido: true,
        esPendiente: true,
        estado: pedido.estado,
        productos: pedido.productos,
      }));
  }, [pedidos]);

  // Combinar movimientos reales con pedidos pendientes (solo para referencia)
  const todosLosMovimientos = useMemo(() => {
    if (vistaActiva === "movimientos") return movimientos;
    if (vistaActiva === "pedidos") return pedidosPendientes;
    return [...movimientos, ...pedidosPendientes].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha),
    );
  }, [movimientos, pedidosPendientes, vistaActiva]);

  // Calcular totales (solo movimientos reales, pedidos pendientes no se suman)
  const totales = useMemo(() => {
    // Calcular directamente desde los movimientos para evitar problemas de dependencias
    const ingresos = movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);
    const egresos = movimientos
      .filter((m) => m.tipo === "egreso")
      .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);
    const totalPendiente = pedidosPendientes.reduce(
      (sum, p) => sum + p.monto,
      0,
    );

    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
      totalPendiente, // Pedidos por cobrar (no entregados aún)
      cantidadPendientes: pedidosPendientes.length,
      pedidosEntregados: pedidos.filter((p) => p.estado === "entregado").length,
    };
  }, [movimientos, pedidosPendientes, pedidos]);

  // Filtrar movimientos
  const movimientosFiltrados = todosLosMovimientos.filter((mov) => {
    const cumpleTipo =
      tipoMovimiento === "todos" || mov.tipo === tipoMovimiento;
    const cumpleCategoria =
      filtroCategoria === "todas" || mov.categoria === filtroCategoria;
    const cumpleBusqueda = mov.concepto
      ?.toLowerCase()
      .includes(busqueda.toLowerCase());
    return cumpleTipo && cumpleCategoria && cumpleBusqueda;
  });

  // Stats de operaciones
  const enviosCompletados = envios.filter(
    (e) => e.estado === "entregado",
  ).length;

  // Calcular totales por categoría (solo movimientos reales)
  const totalesPorCategoria = useMemo(() => {
    return Object.keys(categorias)
      .map((cat) => {
        const ingresos = movimientos
          .filter((m) => m.categoria === cat && m.tipo === "ingreso")
          .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);
        const egresos = movimientos
          .filter((m) => m.categoria === cat && m.tipo === "egreso")
          .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);

        return {
          categoria: cat,
          ingresos,
          egresos,
          balance: ingresos - egresos,
        };
      })
      .filter((t) => t.ingresos > 0 || t.egresos > 0);
  }, [movimientos, categorias]);

  const handleRegistrarMovimiento = async (e) => {
    e.preventDefault();

    if (!nuevoMovimiento.concepto || !nuevoMovimiento.monto) {
      showToast("error", "Completa los campos requeridos");
      return;
    }

    const accion = editandoMovimiento ? "actualizar" : "registrar";
    const confirmado = await showConfirmAlert(
      editandoMovimiento ? "Actualizar movimiento" : "Registrar movimiento",
      `¿Confirmas ${accion} el ${nuevoMovimiento.tipo} de $${parseFloat(nuevoMovimiento.monto).toLocaleString()}?`,
    );

    if (confirmado) {
      setGuardando(true);
      try {
        let resultado;
        if (editandoMovimiento) {
          resultado = await actualizarMovimiento(editandoMovimiento.id, {
            tipo: nuevoMovimiento.tipo,
            concepto: nuevoMovimiento.concepto,
            monto: parseFloat(nuevoMovimiento.monto),
            categoria: nuevoMovimiento.categoria,
            notas: nuevoMovimiento.notas,
          });
        } else {
          resultado = await agregarMovimiento({
            tipo: nuevoMovimiento.tipo,
            concepto: nuevoMovimiento.concepto,
            monto: parseFloat(nuevoMovimiento.monto),
            categoria: nuevoMovimiento.categoria,
            notas: nuevoMovimiento.notas,
          });
        }

        if (resultado.success) {
          setNuevoMovimiento({
            tipo: "ingreso",
            categoria: "ventas",
            concepto: "",
            monto: "",
            notas: "",
          });
          setMostrarModalRegistro(false);
          setEditandoMovimiento(null);
          showSuccessAlert(
            editandoMovimiento ? "¡Actualizado!" : "¡Registrado!",
            `El movimiento ha sido ${editandoMovimiento ? "actualizado" : "añadido"} correctamente`,
          );
        } else {
          showToast("error", resultado.error || `Error al ${accion}`);
        }
      } catch (error) {
        showToast("error", `Error al ${accion} el movimiento`);
      } finally {
        setGuardando(false);
      }
    }
  };

  const handleEditar = (movimiento) => {
    setEditandoMovimiento(movimiento);
    setNuevoMovimiento({
      tipo: movimiento.tipo,
      categoria: movimiento.categoria,
      concepto: movimiento.concepto,
      monto: parseFloat(movimiento.monto).toString(),
      notas: movimiento.notas || "",
    });
    setMostrarModalRegistro(true);
  };

  const handleEliminar = async (movimiento) => {
    const confirmado = await showConfirmAlert(
      "Eliminar movimiento",
      `¿Seguro que deseas eliminar "${movimiento.concepto}" por $${parseFloat(movimiento.monto).toLocaleString()}?`,
    );

    if (confirmado) {
      const resultado = await eliminarMovimiento(movimiento.id);
      if (resultado.success) {
        showToast("success", "Movimiento eliminado");
      } else {
        showToast("error", resultado.error || "Error al eliminar");
      }
    }
  };

  const handleExportar = () => {
    if (movimientosFiltrados.length === 0) {
      showToast("error", "No hay movimientos para exportar");
      return;
    }

    // Crear contenido CSV
    const headers = [
      "Fecha",
      "Tipo",
      "Categoria",
      "Concepto",
      "Monto",
      "Origen",
      "Notas",
    ];
    const rows = movimientosFiltrados.map((mov) => [
      mov.fecha || new Date(mov.createdAt).toLocaleDateString("es-AR"),
      mov.tipo === "ingreso" ? "Ingreso" : "Egreso",
      categorias[mov.categoria]?.nombre || mov.categoria,
      `"${(mov.concepto || "").replace(/"/g, '""')}"`,
      mov.tipo === "ingreso" ? mov.monto : -mov.monto,
      mov.esPedido ? "Pedido" : "Manual",
      `"${(mov.notas || "").replace(/"/g, '""')}"`,
    ]);

    // Agregar totales al final
    const totalIngresosFiltrado = movimientosFiltrados
      .filter((m) => m.tipo === "ingreso")
      .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);
    const totalEgresosFiltrado = movimientosFiltrados
      .filter((m) => m.tipo === "egreso")
      .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);

    rows.push([]);
    rows.push(["RESUMEN", "", "", "", "", "", ""]);
    rows.push(["Total Ingresos", "", "", "", totalIngresosFiltrado, "", ""]);
    rows.push(["Total Egresos", "", "", "", -totalEgresosFiltrado, "", ""]);
    rows.push([
      "Balance",
      "",
      "",
      "",
      totalIngresosFiltrado - totalEgresosFiltrado,
      "",
      "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    // Agregar BOM para UTF-8
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fecha = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `contabilidad_deposito_${fecha}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      "success",
      `Exportados ${movimientosFiltrados.length} movimientos`,
    );
  };

  return (
    <DepositoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Contabilidad del Depósito
            </h1>
            <p className="text-gray-600">
              Control financiero y movimientos del depósito
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={() => setMostrarModalRegistro(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Registrar Movimiento</span>
            </button>
            <button
              onClick={handleExportar}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              📊 Exportar
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="card">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Período:</span>
            {["dia", "semana", "mes", "año"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  periodo === p
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === "dia"
                  ? "Hoy"
                  : p === "semana"
                    ? "Esta Semana"
                    : p === "mes"
                      ? "Este Mes"
                      : "Este Año"}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Ingresos Totales</p>
                <p className="text-3xl font-bold mt-1">
                  ${formatNumber(totales.ingresos)}
                </p>
                <p className="text-green-200 text-xs mt-1">
                  Ventas registradas
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pedidos Pendientes</p>
                <p className="text-3xl font-bold mt-1">
                  ${formatNumber(totales.totalPendiente || 0)}
                </p>
                <p className="text-yellow-200 text-xs mt-1">
                  {totales.cantidadPendientes || 0} pedido
                  {totales.cantidadPendientes !== 1 ? "s" : ""} por cobrar
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Egresos</p>
                <p className="text-3xl font-bold mt-1">
                  ${formatNumber(totales.egresos)}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📉</span>
              </div>
            </div>
          </div>

          <div
            className={`card ${totales.balance >= 0 ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-orange-500 to-orange-600"} text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={
                    totales.balance >= 0 ? "text-blue-100" : "text-orange-100"
                  }
                  style={{ fontSize: "0.875rem" }}
                >
                  Balance Real
                </p>
                <p className="text-3xl font-bold mt-1">
                  {totales.balance >= 0 ? "+" : ""}$
                  {formatNumber(Math.abs(totales.balance))}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">
                  {totales.balance >= 0 ? "💰" : "⚠️"}
                </span>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Margen</p>
                <p className="text-3xl font-bold mt-1">
                  {totales.ingresos > 0
                    ? ((totales.balance / totales.ingresos) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <p className="text-purple-100 text-sm mt-2">Margen operativo</p>
          </div>
        </div>

        {/* Vista Selector */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setVistaActiva("todo")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              vistaActiva === "todo"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-neutral-300"
            }`}
          >
            📊 Todo ({todosLosMovimientos.length})
          </button>
          <button
            onClick={() => setVistaActiva("movimientos")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              vistaActiva === "movimientos"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-neutral-300"
            }`}
          >
            💵 Movimientos ({movimientos.length})
          </button>
          <button
            onClick={() => setVistaActiva("pedidos")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              vistaActiva === "pedidos"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-neutral-300"
            }`}
          >
            ⏳ Pedidos Pendientes ({pedidosPendientes.length})
          </button>
        </div>

        {/* Calendario de Contabilidad */}
        <CalendarioContabilidad
          movimientos={todosLosMovimientos}
          colorPrimary="green"
        />

        {/* Gráficos de Estadísticas */}
        <div className="card">
          <EstadisticasGrafico
            movimientos={todosLosMovimientos}
            titulo="Estadísticas del Depósito"
          />
        </div>

        {/* Operations Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ventas Realizadas</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${formatNumber(totales.ingresos)}
                </p>
                <p className="text-sm text-green-600">
                  {totales.pedidosEntregados} pedidos entregados
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">⏳</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Por Cobrar (Pendientes)</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${formatNumber(totales.totalPendiente || 0)}
                </p>
                <p className="text-sm text-yellow-600">
                  {totales.cantidadPendientes || 0} pedidos en proceso
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">⛽</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Combustible Estimado</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${formatNumber(enviosCompletados * 150)}
                </p>
                <p className="text-sm text-orange-600">Promedio $150/envío</p>
              </div>
            </div>
          </div>
        </div>

        {/* Movement Filter & List */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Movimientos Recientes
            </h2>
            <div className="flex space-x-2 mt-3 md:mt-0">
              {["todos", "ingreso", "egreso"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setTipoMovimiento(tipo)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tipoMovimiento === tipo
                      ? tipo === "ingreso"
                        ? "bg-green-500 text-white"
                        : tipo === "egreso"
                          ? "bg-red-500 text-white"
                          : "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tipo === "todos"
                    ? "Todos"
                    : tipo === "ingreso"
                      ? "📈 Ingresos"
                      : "📉 Egresos"}
                </button>
              ))}
            </div>
          </div>

          {/* Movements Table */}
          <div className="overflow-x-auto">
            {cargandoMovimientos ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-500">
                  Cargando movimientos...
                </span>
              </div>
            ) : movimientosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <span className="text-4xl mb-2 block">📋</span>
                <p className="font-medium mb-2">
                  No hay movimientos registrados
                </p>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Los movimientos se generan automáticamente al vender productos
                  desde el escáner, recibir pedidos entregados, o puedes
                  registrarlos manualmente con el botón "Registrar Movimiento".
                </p>
                <button
                  onClick={() => setMostrarModalRegistro(true)}
                  className="mt-4 btn-primary inline-flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Registrar primer movimiento</span>
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-neutral-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Concepto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-600">
                  {movimientosFiltrados.map((mov) => (
                    <tr
                      key={mov.id}
                      className={`hover:bg-gray-50 dark:hover:bg-neutral-700 ${mov.esPedido ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""}`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {mov.createdAt
                          ? new Date(mov.createdAt).toLocaleDateString("es-AR")
                          : mov.fecha}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {mov.esPedido && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded font-medium dark:bg-emerald-900/30 dark:text-emerald-400">
                              Pedido
                            </span>
                          )}
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {mov.concepto}
                          </p>
                        </div>
                        {mov.esPedido && mov.estado && (
                          <span
                            className={`text-xs mt-1 inline-block px-2 py-0.5 rounded ${
                              mov.estado === "entregado"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : mov.estado === "pendiente"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : mov.estado === "en_camino" ||
                                      mov.estado === "enviado"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {mov.estado === "entregado"
                              ? "✓ Entregado"
                              : mov.estado === "pendiente"
                                ? "⏳ Pendiente"
                                : mov.estado === "en_camino" ||
                                    mov.estado === "enviado"
                                  ? "🚚 En camino"
                                  : mov.estado === "preparando"
                                    ? "🔧 Preparando"
                                    : mov.estado === "listo"
                                      ? "✅ Listo"
                                      : mov.estado}
                          </span>
                        )}
                        {mov.notas && !mov.esPedido && (
                          <p className="text-xs text-gray-500 mt-1">
                            {mov.notas}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            categorias[mov.categoria]
                              ? `bg-${categorias[mov.categoria].color}-100 text-${categorias[mov.categoria].color}-700`
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {categorias[mov.categoria]?.icono}{" "}
                          {categorias[mov.categoria]?.nombre || mov.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <span
                          className={`text-sm font-bold ${mov.tipo === "ingreso" ? "text-green-600" : "text-red-600"}`}
                        >
                          {mov.tipo === "ingreso" ? "+" : "-"}$
                          {formatNumber(parseFloat(mov.monto) || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {mov.esPedido ? (
                          <span className="text-gray-400 text-xs">
                            Automatico
                          </span>
                        ) : (
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleEditar(mov)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleEliminar(mov)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Categories Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <span className="text-green-500">📈</span>
              <span>Ingresos por Categoría</span>
            </h3>
            <div className="space-y-3">
              {totalesPorCategoria
                .filter((t) => t.ingresos > 0)
                .sort((a, b) => b.ingresos - a.ingresos)
                .map((item) => {
                  const pct =
                    totales.ingresos > 0
                      ? (item.ingresos / totales.ingresos) * 100
                      : 0;
                  return (
                    <div key={item.categoria}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-300">
                          {categorias[item.categoria]?.icono}{" "}
                          {categorias[item.categoria]?.nombre || item.categoria}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          ${formatNumber(item.ingresos)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-neutral-600 rounded-full">
                        <div
                          className="h-2 bg-green-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {totalesPorCategoria.filter((t) => t.ingresos > 0).length ===
                0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Sin ingresos registrados
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
              <span className="text-red-500">📉</span>
              <span>Egresos por Categoría</span>
            </h3>
            <div className="space-y-3">
              {totalesPorCategoria
                .filter((t) => t.egresos > 0)
                .sort((a, b) => b.egresos - a.egresos)
                .map((item) => {
                  const pct =
                    totales.egresos > 0
                      ? (item.egresos / totales.egresos) * 100
                      : 0;
                  return (
                    <div key={item.categoria}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-300">
                          {categorias[item.categoria]?.icono}{" "}
                          {categorias[item.categoria]?.nombre || item.categoria}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          ${formatNumber(item.egresos)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-neutral-600 rounded-full">
                        <div
                          className="h-2 bg-red-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {totalesPorCategoria.filter((t) => t.egresos > 0).length ===
                0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Sin egresos registrados
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Registrar Movimiento */}
      {mostrarModalRegistro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editandoMovimiento
                    ? "Editar Movimiento"
                    : "Registrar Movimiento"}
                </h2>
                <button
                  onClick={() => {
                    setMostrarModalRegistro(false);
                    setEditandoMovimiento(null);
                    setNuevoMovimiento({
                      tipo: "ingreso",
                      categoria: "ventas",
                      concepto: "",
                      monto: "",
                      notas: "",
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form
              onSubmit={handleRegistrarMovimiento}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Movimiento
                </label>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() =>
                      setNuevoMovimiento({
                        ...nuevoMovimiento,
                        tipo: "ingreso",
                      })
                    }
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      nuevoMovimiento.tipo === "ingreso"
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    📈 Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNuevoMovimiento({ ...nuevoMovimiento, tipo: "egreso" })
                    }
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      nuevoMovimiento.tipo === "egreso"
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    📉 Egreso
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <select
                  className="input-field"
                  value={nuevoMovimiento.categoria}
                  onChange={(e) =>
                    setNuevoMovimiento({
                      ...nuevoMovimiento,
                      categoria: e.target.value,
                    })
                  }
                  required
                >
                  {Object.entries(categorias).map(([key, cat]) => (
                    <option key={key} value={key}>
                      {cat.icono} {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Concepto
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Detalle del movimiento..."
                  value={nuevoMovimiento.concepto}
                  onChange={(e) =>
                    setNuevoMovimiento({
                      ...nuevoMovimiento,
                      concepto: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={nuevoMovimiento.monto}
                  onChange={(e) =>
                    setNuevoMovimiento({
                      ...nuevoMovimiento,
                      monto: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  className="input-field"
                  placeholder="Observaciones adicionales..."
                  rows="2"
                  value={nuevoMovimiento.notas}
                  onChange={(e) =>
                    setNuevoMovimiento({
                      ...nuevoMovimiento,
                      notas: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalRegistro(false);
                    setEditandoMovimiento(null);
                    setNuevoMovimiento({
                      tipo: "ingreso",
                      categoria: "ventas",
                      concepto: "",
                      monto: "",
                      notas: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary disabled:opacity-50"
                  disabled={guardando}
                >
                  {guardando ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </span>
                  ) : editandoMovimiento ? (
                    "💾 Guardar Cambios"
                  ) : (
                    "💾 Registrar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DepositoLayout>
  );
}
