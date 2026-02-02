import { useState } from "react";
import FleteLayout from "@/components/layouts/FleteLayout";
import { useFlete } from "@/context/FleteContext";
import { formatNumber, formatDate } from "@/utils/formatters";

export default function FleteHistorial() {
  const { envios } = useFlete();
  const [filtroMes, setFiltroMes] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  // Filtrar solo entregados y con problemas (histórico)
  const enviosHistoricos = envios.filter(
    (e) =>
      e.estado === "entregado" ||
      e.estado === "problema" ||
      e.estado === "cancelado",
  );

  // Filtrar por búsqueda
  let enviosFiltrados = enviosHistoricos;
  if (busqueda) {
    enviosFiltrados = enviosFiltrados.filter(
      (e) =>
        e.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.direccion.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.numeroPedido.toLowerCase().includes(busqueda.toLowerCase()),
    );
  }

  // Calcular estadísticas del historial
  const totalEntregados = enviosHistoricos.filter(
    (e) => e.estado === "entregado",
  ).length;
  const totalProblemas = enviosHistoricos.filter(
    (e) => e.estado === "problema",
  ).length;
  const totalCancelados = enviosHistoricos.filter(
    (e) => e.estado === "cancelado",
  ).length;
  const totalCobrado = enviosHistoricos
    .filter((e) => e.estado === "entregado")
    .reduce((sum, e) => sum + e.total, 0);
  const tasaExito =
    enviosHistoricos.length > 0
      ? Math.round((totalEntregados / enviosHistoricos.length) * 100)
      : 0;

  const getEstadoColor = (estado) => {
    const colores = {
      entregado: "bg-green-100 text-green-800",
      problema: "bg-orange-100 text-orange-800",
      cancelado: "bg-red-100 text-red-800",
    };
    return colores[estado] || "bg-gray-100 text-gray-800";
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      entregado: "Entregado",
      problema: "Problema",
      cancelado: "Cancelado",
    };
    return textos[estado] || estado;
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      entregado: "✅",
      problema: "⚠️",
      cancelado: "❌",
    };
    return icons[estado] || "📦";
  };

  return (
    <FleteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Historial de Envíos
          </h1>
          <p className="text-gray-600">
            Registro de todas tus entregas anteriores
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-gray-800">
              {enviosHistoricos.length}
            </p>
            <p className="text-sm text-gray-500">Total Histórico</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">
              {totalEntregados}
            </p>
            <p className="text-sm text-gray-500">Entregados</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-orange-600">
              {totalProblemas}
            </p>
            <p className="text-sm text-gray-500">Con Problemas</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-blue-600">{tasaExito}%</p>
            <p className="text-sm text-gray-500">Tasa de Éxito</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">
              ${formatNumber(totalCobrado)}
            </p>
            <p className="text-sm text-gray-500">Total Cobrado</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por cliente, dirección o número de pedido..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="input-field pl-10 w-full"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  🔍
                </span>
              </div>
            </div>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="input-field w-full md:w-48"
            >
              <option value="todos">Todos los meses</option>
              <option value="enero">Enero 2025</option>
              <option value="febrero">Febrero 2025</option>
              <option value="marzo">Marzo 2025</option>
            </select>
          </div>
        </div>

        {/* Lista de Historial */}
        {enviosFiltrados.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-5xl block mb-4">📭</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Sin historial
            </h3>
            <p className="text-gray-500">
              No hay envíos completados que coincidan con tu búsqueda
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            {/* Tabla para desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Pedido
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Dirección
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {enviosFiltrados.map((envio) => (
                    <tr
                      key={envio.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {envio.numeroPedido}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          {envio.cliente}
                        </p>
                        <p className="text-sm text-gray-500">
                          {envio.telefono}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {envio.direccion}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(envio.fecha)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getEstadoColor(envio.estado)}`}
                        >
                          <span>{getEstadoIcon(envio.estado)}</span>
                          {getEstadoTexto(envio.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        ${formatNumber(envio.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards para móvil */}
            <div className="md:hidden divide-y">
              {enviosFiltrados.map((envio) => (
                <div key={envio.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {envio.numeroPedido}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getEstadoColor(envio.estado)}`}
                    >
                      <span>{getEstadoIcon(envio.estado)}</span>
                      {getEstadoTexto(envio.estado)}
                    </span>
                  </div>
                  <p className="font-medium text-gray-800">{envio.cliente}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    {envio.direccion}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {formatDate(envio.fecha)}
                    </span>
                    <span className="font-semibold text-green-600">
                      ${formatNumber(envio.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen mensual */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">
            📊 Resumen de Rendimiento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-2xl font-bold text-green-600">
                {totalEntregados}
              </p>
              <p className="text-sm text-gray-600">Entregas Exitosas</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-4xl mb-2">⏱️</div>
              <p className="text-2xl font-bold text-blue-600">45 min</p>
              <p className="text-sm text-gray-600">Tiempo Promedio</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-4xl mb-2">⭐</div>
              <p className="text-2xl font-bold text-orange-600">4.8</p>
              <p className="text-sm text-gray-600">Calificación Promedio</p>
            </div>
          </div>
        </div>
      </div>
    </FleteLayout>
  );
}
