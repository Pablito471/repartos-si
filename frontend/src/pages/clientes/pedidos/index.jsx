import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useCliente } from "@/context/ClienteContext";
import { useState } from "react";
import Link from "next/link";
import {
  showConfirmAlert,
  showSuccessAlert,
  showErrorAlert,
} from "@/utils/alerts";

export default function MisPedidos() {
  const { pedidos, cancelarPedido, cargandoPedidos } = useCliente();
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const cumpleFiltro =
      filtroEstado === "todos" || pedido.estado === filtroEstado;
    const cumpleBusqueda =
      pedido.deposito.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.id.toString().includes(busqueda);
    return cumpleFiltro && cumpleBusqueda;
  });

  const handleCancelar = async (id) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (pedido.estado !== "pendiente") {
      showErrorAlert(
        "No se puede cancelar",
        "Solo puedes cancelar pedidos pendientes",
      );
      return;
    }

    const confirmado = await showConfirmAlert(
      "¿Cancelar pedido?",
      `¿Estás seguro de cancelar el pedido #${id}?`,
    );

    if (confirmado) {
      cancelarPedido(id);
      showSuccessAlert(
        "Pedido cancelado",
        "El pedido ha sido cancelado exitosamente",
      );
    }
  };

  // Mostrar loading mientras se cargan los pedidos
  if (cargandoPedidos) {
    return (
      <ClienteLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando pedidos...</span>
        </div>
      </ClienteLayout>
    );
  }

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mis Pedidos</h1>
            <p className="text-gray-600">
              Gestiona y visualiza todos tus pedidos
            </p>
          </div>
          <Link
            href="/clientes/pedidos/nuevo"
            className="mt-4 md:mt-0 btn-primary inline-flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Nuevo Pedido</span>
          </Link>
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
                placeholder="Buscar por ID o depósito..."
                className="input-field"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                className="input-field"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_camino">En Camino</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
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
                onCancelar={handleCancelar}
              />
            ))
          )}
        </div>
      </div>
    </ClienteLayout>
  );
}

function PedidoCard({ pedido, onCancelar }) {
  const [expandido, setExpandido] = useState(false);

  const tipoEnvioTexto = {
    envio: "🚚 Envío a domicilio",
    flete: "🚛 Flete",
    retiro: "🏭 Retiro en depósito",
  };

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📦</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-800">
                Pedido #{pedido.id}
              </h3>
              <EstadoBadge estado={pedido.estado} />
            </div>
            <p className="text-sm text-gray-500">{pedido.fecha}</p>
            <p className="text-sm text-gray-600 mt-1">{pedido.deposito}</p>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col md:items-end">
          <p className="text-xl font-bold text-gray-800">
            ${pedido.total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            {tipoEnvioTexto[pedido.tipoEnvio]}
          </p>
        </div>
      </div>

      {/* Expandible Details */}
      <div className="mt-4 pt-4 border-t">
        <button
          onClick={() => setExpandido(!expandido)}
          className="text-primary hover:underline text-sm flex items-center space-x-1"
        >
          <span>{expandido ? "Ocultar detalles" : "Ver detalles"}</span>
          <span>{expandido ? "▲" : "▼"}</span>
        </button>

        {expandido && (
          <div className="mt-4 space-y-4">
            {/* Products */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Productos</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="text-left pb-2">Producto</th>
                      <th className="text-center pb-2">Cant.</th>
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
                          ${(prod.cantidad * prod.precio).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">
                  Dirección de entrega
                </h4>
                <p className="text-gray-600">{pedido.direccion}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">
                  Tipo de envío
                </h4>
                <p className="text-gray-600">
                  {tipoEnvioTexto[pedido.tipoEnvio]}
                </p>
              </div>
            </div>

            {/* Actions */}
            {pedido.estado === "pendiente" && (
              <div className="flex space-x-3 pt-2">
                <Link
                  href={`/clientes/pedidos/${pedido.id}/editar`}
                  className="btn-primary text-sm"
                >
                  ✏️ Modificar
                </Link>
                <button
                  onClick={() => onCancelar(pedido.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  ❌ Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EstadoBadge({ estado }) {
  const estilos = {
    pendiente: "bg-yellow-100 text-yellow-800",
    en_camino: "bg-blue-100 text-blue-800",
    entregado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  };

  const textos = {
    pendiente: "Pendiente",
    en_camino: "En Camino",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${estilos[estado]}`}
    >
      {textos[estado]}
    </span>
  );
}
