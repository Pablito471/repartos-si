import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useCliente } from "@/context/ClienteContext";
import CalendarioContabilidad from "@/components/CalendarioContabilidad";
import { useState } from "react";
import { showSuccessAlert, showConfirmAlert, showToast } from "@/utils/alerts";

export default function Contabilidad() {
  const {
    movimientos,
    agregarMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
    calcularTotales,
    cargandoMovimientos,
  } = useCliente();
  const totales = calcularTotales();

  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoMovimiento, setEditandoMovimiento] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: "ingreso",
    concepto: "",
    monto: "",
    categoria: "ventas",
  });

  const categorias = {
    ventas: { nombre: "Ventas", icono: "💵", color: "green" },
    compras: { nombre: "Compras", icono: "🛒", color: "red" },
    cobranzas: { nombre: "Cobranzas", icono: "📥", color: "blue" },
    logistica: { nombre: "Logística", icono: "🚚", color: "yellow" },
    servicios: { nombre: "Servicios", icono: "⚡", color: "purple" },
    otros: { nombre: "Otros", icono: "📋", color: "gray" },
  };

  const movimientosFiltrados = movimientos.filter((mov) => {
    const cumpleTipo = filtroTipo === "todos" || mov.tipo === filtroTipo;
    const cumpleCategoria =
      filtroCategoria === "todas" || mov.categoria === filtroCategoria;
    const cumpleBusqueda = mov.concepto
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    return cumpleTipo && cumpleCategoria && cumpleBusqueda;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nuevoMovimiento.concepto || !nuevoMovimiento.monto) {
      showToast("error", "Completa todos los campos");
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
          });
        } else {
          resultado = await agregarMovimiento({
            tipo: nuevoMovimiento.tipo,
            concepto: nuevoMovimiento.concepto,
            monto: parseFloat(nuevoMovimiento.monto),
            categoria: nuevoMovimiento.categoria,
          });
        }

        if (resultado.success) {
          setNuevoMovimiento({
            tipo: "ingreso",
            concepto: "",
            monto: "",
            categoria: "ventas",
          });
          setMostrarModal(false);
          setEditandoMovimiento(null);
          showSuccessAlert(
            editandoMovimiento ? "¡Actualizado!" : "¡Registrado!",
            `El movimiento ha sido ${editandoMovimiento ? "actualizado" : "registrado"} exitosamente`,
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
      concepto: movimiento.concepto,
      monto: movimiento.monto.toString(),
      categoria: movimiento.categoria,
    });
    setMostrarModal(true);
  };

  const handleEliminar = async (movimiento) => {
    const confirmado = await showConfirmAlert(
      "Eliminar movimiento",
      `¿Seguro que deseas eliminar "${movimiento.concepto}" por $${movimiento.monto.toLocaleString()}?`,
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

  const exportarCSV = () => {
    const headers = [
      "Fecha",
      "Tipo",
      "Concepto",
      "Monto",
      "Categoría",
      "Notas",
    ];
    const rows = movimientos.map((m) => [
      m.fecha,
      m.tipo,
      m.concepto,
      m.monto.toString(),
      m.categoria,
      m.notas || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contabilidad_cliente_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Calcular totales por categoría
  const totalesPorCategoria = Object.keys(categorias)
    .map((cat) => {
      const ingresos = movimientos
        .filter((m) => m.categoria === cat && m.tipo === "ingreso")
        .reduce((sum, m) => sum + m.monto, 0);
      const egresos = movimientos
        .filter((m) => m.categoria === cat && m.tipo === "egreso")
        .reduce((sum, m) => sum + m.monto, 0);
      return {
        categoria: cat,
        ingresos,
        egresos,
        balance: ingresos - egresos,
      };
    })
    .filter((t) => t.ingresos > 0 || t.egresos > 0);

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Contabilidad</h1>
            <p className="text-gray-600">Gestiona las finanzas de tu local</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={exportarCSV}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>📥</span>
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={() => setMostrarModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Nuevo Movimiento</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Ingresos Totales</p>
                <p className="text-3xl font-bold">
                  ${totales.ingresos.toLocaleString()}
                </p>
              </div>
              <span className="text-4xl opacity-80">📈</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Egresos Totales</p>
                <p className="text-3xl font-bold">
                  ${totales.egresos.toLocaleString()}
                </p>
              </div>
              <span className="text-4xl opacity-80">📉</span>
            </div>
          </div>

          <div
            className={`card text-white ${
              totales.balance >= 0
                ? "bg-gradient-to-br from-blue-500 to-blue-600"
                : "bg-gradient-to-br from-orange-500 to-orange-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Balance</p>
                <p className="text-3xl font-bold">
                  {totales.balance >= 0 ? "+" : ""}$
                  {totales.balance.toLocaleString()}
                </p>
              </div>
              <span className="text-4xl opacity-80">💰</span>
            </div>
          </div>
        </div>

        {/* Calendario de Contabilidad */}
        <CalendarioContabilidad movimientos={movimientos} colorPrimary="blue" />

        {/* Category Summary */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">
            Resumen por Categoría
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {totalesPorCategoria.map(
              ({ categoria, ingresos, egresos, balance }) => (
                <div key={categoria} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">
                      {categorias[categoria].icono}
                    </span>
                    <span className="font-medium text-gray-700">
                      {categorias[categoria].nombre}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ingresos:</span>
                      <span className="text-green-600 font-medium">
                        +${ingresos.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Egresos:</span>
                      <span className="text-red-600 font-medium">
                        -${egresos.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-gray-700">Balance:</span>
                      <span
                        className={`font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {balance >= 0 ? "+" : ""}${balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Movimientos</h3>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por concepto..."
                className="input-field"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="md:w-40">
              <select
                className="input-field"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="ingreso">Ingresos</option>
                <option value="egreso">Egresos</option>
              </select>
            </div>
            <div className="md:w-40">
              <select
                className="input-field"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="todas">Todas</option>
                {Object.keys(categorias).map((cat) => (
                  <option key={cat} value={cat}>
                    {categorias[cat].nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Movements Table */}
          <div className="overflow-x-auto">
            {cargandoMovimientos ? (
              <div className="py-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-gray-500">Cargando movimientos...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Concepto</th>
                    <th className="pb-3">Categoría</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3 text-right">Monto</th>
                    <th className="pb-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-gray-500"
                      >
                        No hay movimientos con los filtros aplicados
                      </td>
                    </tr>
                  ) : (
                    movimientosFiltrados.map((mov) => (
                      <tr
                        key={mov.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-3 text-gray-600">{mov.fecha}</td>
                        <td className="py-3 font-medium text-gray-800">
                          {mov.concepto}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                            {categorias[mov.categoria]?.icono}{" "}
                            {categorias[mov.categoria]?.nombre}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              mov.tipo === "ingreso"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {mov.tipo === "ingreso" ? "↑ Ingreso" : "↓ Egreso"}
                          </span>
                        </td>
                        <td
                          className={`py-3 text-right font-bold ${
                            mov.tipo === "ingreso"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {mov.tipo === "ingreso" ? "+" : "-"}$
                          {mov.monto.toLocaleString()}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleEditar(mov)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                              title="Editar movimiento"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleEliminar(mov)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="Eliminar movimiento"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {editandoMovimiento
                    ? "Editar Movimiento"
                    : "Nuevo Movimiento"}
                </h2>
                <button
                  onClick={() => {
                    setMostrarModal(false);
                    setEditandoMovimiento(null);
                    setNuevoMovimiento({
                      tipo: "ingreso",
                      concepto: "",
                      monto: "",
                      categoria: "ventas",
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de movimiento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setNuevoMovimiento({
                        ...nuevoMovimiento,
                        tipo: "ingreso",
                      })
                    }
                    className={`p-3 rounded-lg border-2 transition-all ${
                      nuevoMovimiento.tipo === "ingreso"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl block mb-1">📈</span>
                    <span className="font-medium">Ingreso</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNuevoMovimiento({ ...nuevoMovimiento, tipo: "egreso" })
                    }
                    className={`p-3 rounded-lg border-2 transition-all ${
                      nuevoMovimiento.tipo === "egreso"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl block mb-1">📉</span>
                    <span className="font-medium">Egreso</span>
                  </button>
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                >
                  {Object.keys(categorias).map((cat) => (
                    <option key={cat} value={cat}>
                      {categorias[cat].icono} {categorias[cat].nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Describe el movimiento..."
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

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    className="input-field pl-8"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
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
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModal(false);
                    setEditandoMovimiento(null);
                    setNuevoMovimiento({
                      tipo: "ingreso",
                      concepto: "",
                      monto: "",
                      categoria: "ventas",
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary disabled:opacity-50"
                  disabled={guardando}
                >
                  {guardando
                    ? editandoMovimiento
                      ? "Guardando..."
                      : "Registrando..."
                    : editandoMovimiento
                      ? "Guardar Cambios"
                      : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ClienteLayout>
  );
}
