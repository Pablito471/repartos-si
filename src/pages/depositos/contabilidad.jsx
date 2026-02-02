import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import CalendarioContabilidad from "@/components/CalendarioContabilidad";
import { formatNumber } from "@/utils/formatters";
import { useState } from "react";
import { showSuccessAlert, showToast } from "@/utils/alerts";

export default function Contabilidad() {
  const { movimientos, pedidos, envios } = useDeposito();
  const [periodo, setPeriodo] = useState("mes");
  const [tipoMovimiento, setTipoMovimiento] = useState("todos");
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: "ingreso",
    categoria: "",
    descripcion: "",
    monto: "",
    referencia: "",
  });

  // Filtrar movimientos
  const movimientosFiltrados = movimientos.filter((mov) => {
    if (tipoMovimiento === "todos") return true;
    return mov.tipo === tipoMovimiento;
  });

  // Calcular totales
  const totalIngresos = movimientos
    .filter((m) => m.tipo === "ingreso")
    .reduce((sum, m) => sum + m.monto, 0);

  const totalEgresos = movimientos
    .filter((m) => m.tipo === "egreso")
    .reduce((sum, m) => sum + m.monto, 0);

  const balance = totalIngresos - totalEgresos;

  // Stats de operaciones
  const pedidosEntregados = pedidos.filter(
    (p) => p.estado === "entregado",
  ).length;
  const totalVentas = pedidos
    .filter((p) => p.estado !== "cancelado")
    .reduce((sum, p) => sum + p.total, 0);
  const enviosCompletados = envios.filter(
    (e) => e.estado === "entregado",
  ).length;

  const handleRegistrarMovimiento = (e) => {
    e.preventDefault();

    if (!nuevoMovimiento.categoria || !nuevoMovimiento.monto) {
      showToast("error", "Completa los campos requeridos");
      return;
    }

    // Aquí normalmente se agregaría el movimiento a través del contexto
    showSuccessAlert(
      "¡Movimiento registrado!",
      "El movimiento ha sido añadido correctamente",
    );
    setMostrarModalRegistro(false);
    setNuevoMovimiento({
      tipo: "ingreso",
      categoria: "",
      descripcion: "",
      monto: "",
      referencia: "",
    });
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
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Ingresos</p>
                <p className="text-3xl font-bold mt-1">
                  ${formatNumber(totalIngresos)}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
            <p className="text-green-100 text-sm mt-2">
              +12% vs período anterior
            </p>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Egresos</p>
                <p className="text-3xl font-bold mt-1">
                  ${formatNumber(totalEgresos)}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📉</span>
              </div>
            </div>
            <p className="text-red-100 text-sm mt-2">-5% vs período anterior</p>
          </div>

          <div
            className={`card ${balance >= 0 ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-orange-500 to-orange-600"} text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Balance</p>
                <p className="text-3xl font-bold mt-1">
                  ${formatNumber(balance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{balance >= 0 ? "💰" : "⚠️"}</span>
              </div>
            </div>
            <p className="text-blue-100 text-sm mt-2">
              {balance >= 0 ? "Resultado positivo" : "Revisar gastos"}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Margen</p>
                <p className="text-3xl font-bold mt-1">
                  {totalIngresos > 0
                    ? ((balance / totalIngresos) * 100).toFixed(1)
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

        {/* Calendario de Contabilidad */}
        <CalendarioContabilidad
          movimientos={movimientos}
          colorPrimary="green"
        />

        {/* Operations Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">📦</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Ventas (pedidos)</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${formatNumber(totalVentas)}
                </p>
                <p className="text-sm text-green-600">
                  {pedidosEntregados} pedidos entregados
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🚚</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Costo de Envíos</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${formatNumber(enviosCompletados * 250)}
                </p>
                <p className="text-sm text-blue-600">
                  {enviosCompletados} envíos completados
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
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referencia
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movimientosFiltrados.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {mov.fecha}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-800">
                        {mov.concepto}
                      </p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {mov.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {mov.referencia || "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <span
                        className={`text-sm font-bold ${mov.tipo === "ingreso" ? "text-green-600" : "text-red-600"}`}
                      >
                        {mov.tipo === "ingreso" ? "+" : "-"}$
                        {formatNumber(mov.monto)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              {[
                { cat: "Ventas", monto: 45000, pct: 75 },
                { cat: "Servicios de Envío", monto: 12000, pct: 20 },
                { cat: "Otros", monto: 3000, pct: 5 },
              ].map((item) => (
                <div key={item.cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.cat}</span>
                    <span className="font-medium text-gray-800">
                      ${formatNumber(item.monto)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full transition-all"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <span className="text-red-500">📉</span>
              <span>Egresos por Categoría</span>
            </h3>
            <div className="space-y-3">
              {[
                { cat: "Combustible", monto: 8500, pct: 45 },
                { cat: "Mantenimiento", monto: 5000, pct: 26 },
                { cat: "Salarios", monto: 4000, pct: 21 },
                { cat: "Otros", monto: 1500, pct: 8 },
              ].map((item) => (
                <div key={item.cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.cat}</span>
                    <span className="font-medium text-gray-800">
                      ${formatNumber(item.monto)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-red-500 rounded-full transition-all"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Registrar Movimiento */}
      {mostrarModalRegistro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Registrar Movimiento
                </h2>
                <button
                  onClick={() => setMostrarModalRegistro(false)}
                  className="text-gray-500 hover:text-gray-700"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        : "bg-gray-100 text-gray-600"
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
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    📉 Egreso
                  </button>
                </div>
              </div>

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
                  required
                >
                  <option value="">Seleccionar categoría...</option>
                  {nuevoMovimiento.tipo === "ingreso" ? (
                    <>
                      <option value="Ventas">Ventas</option>
                      <option value="Servicios de Envío">
                        Servicios de Envío
                      </option>
                      <option value="Otros Ingresos">Otros Ingresos</option>
                    </>
                  ) : (
                    <>
                      <option value="Combustible">Combustible</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Salarios">Salarios</option>
                      <option value="Servicios">Servicios</option>
                      <option value="Otros Gastos">Otros Gastos</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Detalle del movimiento..."
                  value={nuevoMovimiento.descripcion}
                  onChange={(e) =>
                    setNuevoMovimiento({
                      ...nuevoMovimiento,
                      descripcion: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencia (opcional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: Factura #123"
                  value={nuevoMovimiento.referencia}
                  onChange={(e) =>
                    setNuevoMovimiento({
                      ...nuevoMovimiento,
                      referencia: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalRegistro(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  💾 Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DepositoLayout>
  );
}
