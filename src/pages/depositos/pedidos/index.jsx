import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import { formatNumber } from "@/utils/formatters";
import { useState } from "react";
import Link from "next/link";
import { showConfirmAlert, showSuccessAlert, showToast } from "@/utils/alerts";

export default function PedidosDeposito() {
  const { pedidos, cambiarEstadoPedido } = useDeposito();
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const cumpleEstado =
      filtroEstado === "todos" || pedido.estado === filtroEstado;
    const cumplePrioridad =
      filtroPrioridad === "todas" || pedido.prioridad === filtroPrioridad;
    const cumpleBusqueda =
      pedido.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.id.toString().includes(busqueda);
    return cumpleEstado && cumplePrioridad && cumpleBusqueda;
  });

  const handleCambiarEstado = async (id, nuevoEstado, textoEstado) => {
    const confirmado = await showConfirmAlert(
      "Cambiar estado",
      `¿Marcar pedido #${id} como "${textoEstado}"?`,
    );

    if (confirmado) {
      cambiarEstadoPedido(id, nuevoEstado);
      showToast("success", `Pedido #${id} actualizado a ${textoEstado}`);
    }
  };

  // Contadores por estado
  const contadores = {
    pendiente: pedidos.filter((p) => p.estado === "pendiente").length,
    preparando: pedidos.filter((p) => p.estado === "preparando").length,
    listo: pedidos.filter((p) => p.estado === "listo").length,
    enviado: pedidos.filter((p) => p.estado === "enviado").length,
    entregado: pedidos.filter((p) => p.estado === "entregado").length,
  };

  return (
    <DepositoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de Pedidos
          </h1>
          <p className="text-gray-600">
            Procesa y gestiona los pedidos de los clientes
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroEstado("todos")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === "todos"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Todos ({pedidos.length})
          </button>
          <button
            onClick={() => setFiltroEstado("pendiente")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === "pendiente"
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            ⏳ Pendientes ({contadores.pendiente})
          </button>
          <button
            onClick={() => setFiltroEstado("preparando")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === "preparando"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            📋 Preparando ({contadores.preparando})
          </button>
          <button
            onClick={() => setFiltroEstado("listo")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === "listo"
                ? "bg-purple-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            ✅ Listos ({contadores.listo})
          </button>
          <button
            onClick={() => setFiltroEstado("enviado")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroEstado === "enviado"
                ? "bg-green-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            🚚 Enviados ({contadores.enviado})
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar por cliente o ID..."
                className="input-field"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                className="input-field"
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
              >
                <option value="todas">Todas</option>
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Media</option>
                <option value="baja">🟢 Baja</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {pedidosFiltrados.length === 0 ? (
            <div className="card text-center py-12">
              <span className="text-6xl mb-4 block">📦</span>
              <h3 className="text-xl font-semibold text-gray-700">
                No hay pedidos
              </h3>
              <p className="text-gray-500 mt-2">
                No se encontraron pedidos con los filtros aplicados
              </p>
            </div>
          ) : (
            pedidosFiltrados.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onCambiarEstado={handleCambiarEstado}
              />
            ))
          )}
        </div>
      </div>
    </DepositoLayout>
  );
}

function PedidoCard({ pedido, onCambiarEstado }) {
  const [expandido, setExpandido] = useState(false);

  const tipoEnvioInfo = {
    envio: { icon: "🚚", texto: "Envío a domicilio" },
    flete: { icon: "🚛", texto: "Flete" },
    retiro: { icon: "🏭", texto: "Retiro en depósito" },
  };

  const prioridadInfo = {
    alta: { color: "bg-red-500", texto: "Alta" },
    media: { color: "bg-yellow-500", texto: "Media" },
    baja: { color: "bg-green-500", texto: "Baja" },
  };

  const siguienteEstado = {
    pendiente: { estado: "preparando", texto: "Preparando" },
    preparando: { estado: "listo", texto: "Listo" },
    listo: { estado: "enviado", texto: "Enviado" },
    enviado: { estado: "entregado", texto: "Entregado" },
  };

  return (
    <div className="card border-l-4 border-l-primary">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full ${prioridadInfo[pedido.prioridad].color}`}
            />
            <span className="text-xs text-gray-500 mt-1">
              {prioridadInfo[pedido.prioridad].texto}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <h3 className="font-semibold text-gray-800">
                Pedido #{pedido.id}
              </h3>
              <EstadoBadge estado={pedido.estado} />
            </div>
            <p className="text-lg font-medium text-gray-700 mt-1">
              {pedido.cliente}
            </p>
            <p className="text-sm text-gray-500">
              {pedido.clienteId} • {pedido.fecha}
            </p>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col md:items-end">
          <p className="text-xl font-bold text-gray-800">
            ${formatNumber(pedido.total)}
          </p>
          <p className="text-sm text-gray-500">
            {tipoEnvioInfo[pedido.tipoEnvio].icon}{" "}
            {tipoEnvioInfo[pedido.tipoEnvio].texto}
          </p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-1 text-gray-600">
          <span>📦</span>
          <span>{pedido.productos.length} productos</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-600">
          <span>📍</span>
          <span>{pedido.direccion}</span>
        </div>
      </div>

      {/* Actions & Details Toggle */}
      <div className="mt-4 pt-4 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button
          onClick={() => setExpandido(!expandido)}
          className="text-primary hover:underline text-sm flex items-center space-x-1"
        >
          <span>{expandido ? "Ocultar detalles" : "Ver detalles"}</span>
          <span>{expandido ? "▲" : "▼"}</span>
        </button>

        {/* Action Buttons */}
        {pedido.estado !== "entregado" && siguienteEstado[pedido.estado] && (
          <div className="flex space-x-2">
            <button
              onClick={() =>
                onCambiarEstado(
                  pedido.id,
                  siguienteEstado[pedido.estado].estado,
                  siguienteEstado[pedido.estado].texto,
                )
              }
              className="btn-primary text-sm"
            >
              Marcar como {siguienteEstado[pedido.estado].texto}
            </button>
            <Link
              href={`/depositos/pedidos/${pedido.id}`}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Ver Detalle
            </Link>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expandido && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* Products Table */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Productos</h4>
            <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left pb-2">Producto</th>
                    <th className="text-center pb-2">Cantidad</th>
                    <th className="text-right pb-2">Precio</th>
                    <th className="text-right pb-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.productos.map((prod, idx) => (
                    <tr key={idx}>
                      <td className="py-1">{prod.nombre}</td>
                      <td className="text-center py-1">{prod.cantidad}</td>
                      <td className="text-right py-1">${prod.precio}</td>
                      <td className="text-right py-1 font-medium">
                        ${formatNumber(prod.cantidad * prod.precio)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td colSpan={3} className="pt-2 font-medium">
                      Total
                    </td>
                    <td className="pt-2 text-right font-bold text-primary">
                      ${formatNumber(pedido.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-700 mb-2">
                📍 Información de Entrega
              </h4>
              <p className="text-gray-600">{pedido.direccion}</p>
              <p className="text-gray-500 text-sm mt-1">
                Tipo: {tipoEnvioInfo[pedido.tipoEnvio].texto}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-700 mb-2">
                👤 Datos del Cliente
              </h4>
              <p className="text-gray-600">{pedido.cliente}</p>
              <p className="text-gray-500 text-sm mt-1">{pedido.clienteId}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const estilos = {
    pendiente: "bg-yellow-100 text-yellow-800",
    preparando: "bg-blue-100 text-blue-800",
    listo: "bg-purple-100 text-purple-800",
    enviado: "bg-green-100 text-green-800",
    entregado: "bg-gray-100 text-gray-800",
  };

  const textos = {
    pendiente: "⏳ Pendiente",
    preparando: "📋 Preparando",
    listo: "✅ Listo",
    enviado: "🚚 Enviado",
    entregado: "✔️ Entregado",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${estilos[estado]}`}
    >
      {textos[estado]}
    </span>
  );
}
