import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import { useState, useEffect } from "react";
import { enviosService, relacionesService } from "@/services/api";
import {
  showSuccessAlert,
  showConfirmAlert,
  showErrorAlert,
  showToast,
} from "@/utils/alerts";
import Icons from "@/components/Icons";

export default function GestionEnvios() {
  const { envios, pedidos, crearEnvio, actualizarEstadoEnvio, cargandoEnvios } =
    useDeposito();
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [fletesDisponibles, setFletesDisponibles] = useState([]);
  const [cargandoFletes, setCargandoFletes] = useState(false);
  const [fleteSeleccionado, setFleteSeleccionado] = useState("");
  const [fechaEstimada, setFechaEstimada] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const estadosEnvio = {
    pendiente: {
      nombre: "Pendiente",
      color: "bg-yellow-100 text-yellow-800",
      icono: "🕐",
    },
    asignado: {
      nombre: "Asignado",
      color: "bg-blue-100 text-blue-800",
      icono: "👤",
    },
    en_transito: {
      nombre: "En Tránsito",
      color: "bg-purple-100 text-purple-800",
      icono: "🚚",
    },
    entregado: {
      nombre: "Entregado",
      color: "bg-green-100 text-green-800",
      icono: "✅",
    },
    cancelado: {
      nombre: "Cancelado",
      color: "bg-red-100 text-red-800",
      icono: "❌",
    },
  };

  // Pedidos listos para envío (estado "listo" y tipo "envio")
  const pedidosParaEnvio = pedidos.filter(
    (p) =>
      p.estado === "listo" &&
      p.tipoEnvio === "envio" &&
      !envios.some((e) => e.pedidoId === p.id),
  );

  // Filtrar envíos
  const enviosFiltrados = envios.filter((envio) => {
    const cumpleEstado =
      filtroEstado === "todos" || envio.estado === filtroEstado;
    const cumpleBusqueda =
      envio.codigoSeguimiento?.toLowerCase().includes(busqueda.toLowerCase()) ||
      envio.direccionDestino?.toLowerCase().includes(busqueda.toLowerCase()) ||
      envio.flete?.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleEstado && cumpleBusqueda;
  });

  const cargarFletesDisponibles = async () => {
    setCargandoFletes(true);
    try {
      const response = await relacionesService.getMisFletes();
      setFletesDisponibles(response.data || []);
    } catch (error) {
      console.error("Error al cargar fletes:", error);
      setFletesDisponibles([]);
    } finally {
      setCargandoFletes(false);
    }
  };

  const handleAbrirModalAsignar = (pedido) => {
    setPedidoSeleccionado(pedido);
    setFleteSeleccionado("");
    setFechaEstimada("");
    setNotas("");
    setMostrarModalAsignar(true);
    cargarFletesDisponibles();
  };

  const handleCrearEnvio = async (e) => {
    e.preventDefault();

    if (!fleteSeleccionado) {
      showToast("error", "Selecciona un flete");
      return;
    }

    const confirmado = await showConfirmAlert(
      "Crear envío",
      `¿Confirmas crear el envío para el pedido #${pedidoSeleccionado.numero || pedidoSeleccionado.id.slice(-6)}?`,
    );

    if (confirmado) {
      setGuardando(true);
      try {
        await crearEnvio({
          pedidoId: pedidoSeleccionado.id,
          fleteId: fleteSeleccionado,
          direccionOrigen: pedidoSeleccionado.direccionOrigen || "Depósito",
          direccionDestino:
            pedidoSeleccionado.direccionEntrega ||
            pedidoSeleccionado.cliente?.direccion,
          fechaEstimada: fechaEstimada || null,
          notas: notas,
        });

        setMostrarModalAsignar(false);
        showSuccessAlert(
          "¡Envío creado!",
          "El envío ha sido asignado al flete",
        );
      } catch (error) {
        showErrorAlert(
          "Error",
          error.response?.data?.message || "No se pudo crear el envío",
        );
      } finally {
        setGuardando(false);
      }
    }
  };

  const handleCambiarEstado = async (envio, nuevoEstado) => {
    const confirmado = await showConfirmAlert(
      "Cambiar estado",
      `¿Cambiar el estado del envío a "${estadosEnvio[nuevoEstado].nombre}"?`,
    );

    if (confirmado) {
      try {
        await actualizarEstadoEnvio(envio.id, nuevoEstado);
        showToast("success", "Estado actualizado");
      } catch (error) {
        showToast("error", "Error al actualizar estado");
      }
    }
  };

  const handleCancelarEnvio = async (envio) => {
    const confirmado = await showConfirmAlert(
      "Cancelar envío",
      "¿Estás seguro de cancelar este envío? Esta acción no se puede deshacer.",
      "warning",
    );

    if (confirmado) {
      try {
        await actualizarEstadoEnvio(envio.id, "cancelado");
        showToast("success", "Envío cancelado");
      } catch (error) {
        showToast("error", "Error al cancelar envío");
      }
    }
  };

  if (cargandoEnvios) {
    return (
      <DepositoLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando envíos...</span>
        </div>
      </DepositoLayout>
    );
  }

  return (
    <DepositoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Gestión de Envíos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Administra los envíos y asigna fletes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {envios.length} envío{envios.length !== 1 ? "s" : ""} total
              {envios.length !== 1 ? "es" : ""}
            </span>
          </div>
        </div>

        {/* Pedidos listos para envío */}
        {pedidosParaEnvio.length > 0 && (
          <div className="card border-l-4 border-l-orange-500">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              📦 Pedidos listos para envío ({pedidosParaEnvio.length})
            </h2>
            <div className="grid gap-3">
              {pedidosParaEnvio.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      Pedido #{pedido.numero || pedido.id.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pedido.cliente?.nombre || pedido.clienteNombre} •{" "}
                      {pedido.direccionEntrega || pedido.cliente?.direccion}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAbrirModalAsignar(pedido)}
                    className="btn-primary text-sm"
                  >
                    🚚 Asignar Flete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por código, dirección o flete..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltroEstado("todos")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroEstado === "todos"
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Todos
              </button>
              {Object.entries(estadosEnvio).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setFiltroEstado(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtroEstado === key
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {value.icono} {value.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de envíos */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Envíos Activos
          </h2>

          {enviosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Icons.Truck className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {filtroEstado === "todos"
                  ? "No hay envíos registrados"
                  : `No hay envíos con estado "${estadosEnvio[filtroEstado]?.nombre}"`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {enviosFiltrados.map((envio) => (
                <div
                  key={envio.id}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            estadosEnvio[envio.estado]?.color ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {estadosEnvio[envio.estado]?.icono}{" "}
                          {estadosEnvio[envio.estado]?.nombre || envio.estado}
                        </span>
                        {envio.codigoSeguimiento && (
                          <span className="text-sm text-gray-500 font-mono">
                            #{envio.codigoSeguimiento}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        📍 {envio.direccionDestino || "Sin dirección"}
                      </p>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span>🚚 Flete: {envio.flete || "Sin asignar"}</span>
                        {envio.fechaEstimada && (
                          <span className="ml-4">
                            📅 Estimada:{" "}
                            {new Date(envio.fechaEstimada).toLocaleDateString(
                              "es-AR",
                            )}
                          </span>
                        )}
                      </div>
                      {envio.notas && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          "{envio.notas}"
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      {envio.estado === "pendiente" && (
                        <button
                          onClick={() => handleCambiarEstado(envio, "asignado")}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                        >
                          Confirmar asignación
                        </button>
                      )}
                      {envio.estado === "asignado" && (
                        <button
                          onClick={() =>
                            handleCambiarEstado(envio, "en_transito")
                          }
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
                        >
                          Iniciar tránsito
                        </button>
                      )}
                      {envio.estado === "en_transito" && (
                        <button
                          onClick={() =>
                            handleCambiarEstado(envio, "entregado")
                          }
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                        >
                          Marcar entregado
                        </button>
                      )}
                      {envio.estado !== "entregado" &&
                        envio.estado !== "cancelado" && (
                          <button
                            onClick={() => handleCancelarEnvio(envio)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Asignar Flete */}
        {mostrarModalAsignar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Asignar Flete al Envío
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pedido #
                  {pedidoSeleccionado?.numero ||
                    pedidoSeleccionado?.id.slice(-6)}
                </p>
              </div>

              <form onSubmit={handleCrearEnvio} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Flete *
                  </label>
                  {cargandoFletes ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                    </div>
                  ) : fletesDisponibles.length === 0 ? (
                    <p className="text-sm text-red-500 py-2">
                      No tienes fletes vinculados. Ve a "Fletes" para vincular
                      uno.
                    </p>
                  ) : (
                    <select
                      value={fleteSeleccionado}
                      onChange={(e) => setFleteSeleccionado(e.target.value)}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Seleccionar flete...</option>
                      {fletesDisponibles.map((flete) => (
                        <option key={flete.id} value={flete.id}>
                          {flete.nombre} -{" "}
                          {flete.vehiculoTipo || "Sin vehículo"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección de entrega
                  </label>
                  <input
                    type="text"
                    value={
                      pedidoSeleccionado?.direccionEntrega ||
                      pedidoSeleccionado?.cliente?.direccion ||
                      ""
                    }
                    disabled
                    className="input-field w-full bg-gray-100 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha estimada de entrega
                  </label>
                  <input
                    type="date"
                    value={fechaEstimada}
                    onChange={(e) => setFechaEstimada(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows="2"
                    placeholder="Instrucciones especiales..."
                    className="input-field w-full"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setMostrarModalAsignar(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando || !fleteSeleccionado}
                    className="btn-primary disabled:opacity-50"
                  >
                    {guardando ? "Creando..." : "Crear Envío"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DepositoLayout>
  );
}
