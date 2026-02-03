import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import { formatNumber, formatDateTime } from "@/utils/formatters";
import { useState } from "react";
import { showSuccessAlert, showConfirmAlert, showToast } from "@/utils/alerts";

export default function Envios() {
  const {
    envios,
    vehiculos,
    conductores,
    fletes,
    actualizarEstadoEnvio,
    pedidos,
    crearEnvio,
    cambiarEstadoPedido,
    cargandoEnvios,
    cargandoPedidos,
  } = useDeposito();
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nuevoEnvio, setNuevoEnvio] = useState({
    pedidoId: "",
    vehiculo: "",
    conductor: "",
    fleteId: "",
    notas: "",
  });

  // Mostrar loading mientras se cargan los datos
  if (cargandoEnvios || cargandoPedidos) {
    return (
      <DepositoLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando envíos...</span>
        </div>
      </DepositoLayout>
    );
  }

  // Pedidos listos para enviar
  const pedidosListos = pedidos.filter(
    (p) => p.estado === "listo" && p.tipoEnvio !== "retiro",
  );

  const enviosFiltrados = envios.filter((envio) => {
    const cumpleEstado =
      filtroEstado === "todos" || envio.estado === filtroEstado;
    const cumpleTipo = filtroTipo === "todos" || envio.tipo === filtroTipo;
    return cumpleEstado && cumpleTipo;
  });

  const handleActualizarEstado = async (envioId, nuevoEstado, texto) => {
    const confirmado = await showConfirmAlert(
      "Actualizar estado",
      `¿Marcar envío como "${texto}"?`,
    );

    if (confirmado) {
      try {
        await actualizarEstadoEnvio(envioId, nuevoEstado);
        showToast("success", `Envío actualizado a ${texto}`);
      } catch (error) {
        showToast(
          "error",
          "Error al actualizar envío: " +
            (error.message || "Error desconocido"),
        );
      }
    }
  };

  const handleCrearEnvio = async (e) => {
    e.preventDefault();

    if (!nuevoEnvio.pedidoId || !nuevoEnvio.vehiculo || !nuevoEnvio.conductor) {
      showToast("error", "Completa todos los campos");
      return;
    }

    const pedido = pedidos.find(
      (p) => String(p.id) === String(nuevoEnvio.pedidoId),
    );
    const vehiculo = vehiculos.find(
      (v) => String(v.id) === String(nuevoEnvio.vehiculo),
    );
    const conductor = conductores.find(
      (c) => String(c.id) === String(nuevoEnvio.conductor),
    );

    const envioData = {
      pedidoId: pedido.id,
      fleteId: nuevoEnvio.fleteId || null, // Importante: asignar el flete
      cliente: pedido.cliente,
      tipo: pedido.tipoEnvio,
      vehiculo: vehiculo.nombre,
      conductor: conductor.nombre,
      direccion: pedido.direccion,
      estado: "en_transito",
      fechaSalida: formatDateTime(new Date()),
      fechaEstimada: formatDateTime(new Date(Date.now() + 2 * 60 * 60 * 1000)),
      notas: nuevoEnvio.notas,
    };

    try {
      await crearEnvio(envioData);
      await cambiarEstadoPedido(pedido.id, "enviado");
      setMostrarModalNuevo(false);
      setNuevoEnvio({
        pedidoId: "",
        vehiculo: "",
        conductor: "",
        fleteId: "",
        notas: "",
      });
      showSuccessAlert("¡Envío creado!", "El envío ha sido despachado");
    } catch (error) {
      showToast(
        "error",
        "Error al crear envío: " + (error.message || "Error desconocido"),
      );
    }
  };

  // Estadísticas
  const stats = {
    enTransito: envios.filter((e) => e.estado === "en_transito").length,
    esperandoRetiro: envios.filter((e) => e.estado === "esperando_retiro")
      .length,
    entregados: envios.filter((e) => e.estado === "entregado").length,
    vehiculosEnUso: vehiculos.filter((v) => v.estado === "en_uso").length,
    vehiculosDisponibles: vehiculos.filter((v) => v.estado === "disponible")
      .length,
  };

  return (
    <DepositoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Gestión de Envíos
            </h1>
            <p className="text-gray-600">
              Controla y rastrea todos los envíos del depósito
            </p>
          </div>
          {pedidosListos.length > 0 && (
            <button
              onClick={() => setMostrarModalNuevo(true)}
              className="mt-4 md:mt-0 btn-primary inline-flex items-center space-x-2"
            >
              <span>🚚</span>
              <span>Nuevo Envío</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🚚</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.enTransito}
                </p>
                <p className="text-xs text-gray-500">En Tránsito</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏭</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.esperandoRetiro}
                </p>
                <p className="text-xs text-gray-500">Esp. Retiro</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.entregados}
                </p>
                <p className="text-xs text-gray-500">Entregados</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🚛</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.vehiculosEnUso}
                </p>
                <p className="text-xs text-gray-500">Vehículos en Uso</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🅿️</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.vehiculosDisponibles}
                </p>
                <p className="text-xs text-gray-500">Vehículos Disp.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehicles */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <span>🚛</span>
              <span>Flota de Vehículos</span>
            </h3>
            <div className="space-y-2">
              {vehiculos.map((vehiculo) => (
                <div
                  key={vehiculo.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {vehiculo.tipo === "camioneta"
                        ? "🚐"
                        : vehiculo.tipo === "camion"
                          ? "🚛"
                          : "🏍️"}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">
                        {vehiculo.nombre}
                      </p>
                      <p className="text-sm text-gray-500">
                        {vehiculo.patente} • {vehiculo.capacidad}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vehiculo.estado === "disponible"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {vehiculo.estado === "disponible" ? "Disponible" : "En uso"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Drivers */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <span>👤</span>
              <span>Conductores</span>
            </h3>
            <div className="space-y-2">
              {conductores.map((conductor) => (
                <div
                  key={conductor.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      👤
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {conductor.nombre}
                      </p>
                      <p className="text-sm text-gray-500">
                        📞 {conductor.telefono}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      conductor.estado === "disponible"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {conductor.estado === "disponible"
                      ? "Disponible"
                      : "En ruta"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
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
                <option value="en_transito">En Tránsito</option>
                <option value="esperando_retiro">Esperando Retiro</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                className="input-field"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="envio">🚚 Envío</option>
                <option value="flete">🚛 Flete</option>
                <option value="retiro">🏭 Retiro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shipments List */}
        <div className="space-y-4">
          {enviosFiltrados.length === 0 ? (
            <div className="card text-center py-12">
              <span className="text-6xl mb-4 block">🚚</span>
              <h3 className="text-xl font-semibold text-gray-700">
                No hay envíos
              </h3>
              <p className="text-gray-500 mt-2">
                No se encontraron envíos con los filtros aplicados
              </p>
            </div>
          ) : (
            enviosFiltrados.map((envio) => (
              <EnvioCard
                key={envio.id}
                envio={envio}
                onActualizarEstado={handleActualizarEstado}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal Nuevo Envío */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Nuevo Envío</h2>
                <button
                  onClick={() => setMostrarModalNuevo(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleCrearEnvio} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pedido
                </label>
                <select
                  className="input-field"
                  value={nuevoEnvio.pedidoId}
                  onChange={(e) =>
                    setNuevoEnvio({ ...nuevoEnvio, pedidoId: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccionar pedido...</option>
                  {pedidosListos.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} - {p.cliente} (${p.total})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehículo
                </label>
                <select
                  className="input-field"
                  value={nuevoEnvio.vehiculo}
                  onChange={(e) =>
                    setNuevoEnvio({ ...nuevoEnvio, vehiculo: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccionar vehículo...</option>
                  {vehiculos
                    .filter((v) => v.estado === "disponible")
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nombre} - {v.patente} ({v.capacidad})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conductor
                </label>
                <select
                  className="input-field"
                  value={nuevoEnvio.conductor}
                  onChange={(e) =>
                    setNuevoEnvio({ ...nuevoEnvio, conductor: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccionar conductor...</option>
                  {conductores
                    .filter((c) => c.estado === "disponible")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} - {c.telefono}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flete asignado{" "}
                  {fletes && fletes.length > 0 && (
                    <span className="text-orange-500">*</span>
                  )}
                </label>
                <select
                  className="input-field"
                  value={nuevoEnvio.fleteId}
                  onChange={(e) =>
                    setNuevoEnvio({ ...nuevoEnvio, fleteId: e.target.value })
                  }
                  required={fletes && fletes.length > 0}
                >
                  <option value="">Seleccionar flete...</option>
                  {fletes &&
                    fletes.map((f) => (
                      <option key={f.id} value={f.id}>
                        🚚 {f.nombre} {f.telefono && `- ${f.telefono}`}
                      </option>
                    ))}
                </select>
                {(!fletes || fletes.length === 0) && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay fletes relacionados. Puedes crear el envío sin
                    asignar flete.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Instrucciones especiales..."
                  value={nuevoEnvio.notas}
                  onChange={(e) =>
                    setNuevoEnvio({ ...nuevoEnvio, notas: e.target.value })
                  }
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  🚚 Despachar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DepositoLayout>
  );
}

function EnvioCard({ envio, onActualizarEstado }) {
  const tipoInfo = {
    envio: { icon: "🚚", texto: "Envío" },
    flete: { icon: "🚛", texto: "Flete" },
    retiro: { icon: "🏭", texto: "Retiro" },
    propio: { icon: "🚐", texto: "Propio" },
    default: { icon: "📦", texto: "Envío" },
  };

  const estadoInfo = {
    pendiente: {
      estilo: "bg-gray-100 text-gray-800",
      texto: "Pendiente",
      icon: "⏳",
    },
    en_transito: {
      estilo: "bg-blue-100 text-blue-800",
      texto: "En Tránsito",
      icon: "🚚",
    },
    esperando_retiro: {
      estilo: "bg-yellow-100 text-yellow-800",
      texto: "Esperando Retiro",
      icon: "🏭",
    },
    entregado: {
      estilo: "bg-green-100 text-green-800",
      texto: "Entregado",
      icon: "✅",
    },
    default: {
      estilo: "bg-gray-100 text-gray-800",
      texto: "Desconocido",
      icon: "❓",
    },
  };

  // Usar fallback si el tipo o estado no existe
  const tipoActual = tipoInfo[envio.tipo] || tipoInfo.default;
  const estadoActual = estadoInfo[envio.estado] || estadoInfo.default;

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-2xl">{tipoActual.icon}</span>
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <h3 className="font-semibold text-gray-800">
                Envío #{envio.id} - Pedido #{envio.pedidoId}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${estadoActual.estilo}`}
              >
                {estadoActual.icon} {estadoActual.texto}
              </span>
            </div>
            <p className="text-lg text-gray-700 mt-1">{envio.cliente}</p>
            <p className="text-sm text-gray-500">📍 {envio.direccion}</p>
          </div>
        </div>

        <div className="mt-4 md:mt-0 text-right">
          {envio.vehiculo && (
            <p className="text-sm text-gray-600">
              🚛 {envio.vehiculo} • 👤 {envio.conductor}
            </p>
          )}
          {envio.fechaEstimada && (
            <p className="text-sm text-gray-500">
              ⏰ Estimado: {envio.fechaEstimada}
            </p>
          )}
        </div>
      </div>

      {envio.notas && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
          📝 {envio.notas}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
        {envio.estado === "en_transito" && (
          <button
            onClick={() =>
              onActualizarEstado(envio.id, "entregado", "Entregado")
            }
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
          >
            ✅ Confirmar Entrega
          </button>
        )}

        {envio.estado === "esperando_retiro" && (
          <button
            onClick={() =>
              onActualizarEstado(envio.id, "entregado", "Entregado")
            }
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
          >
            🏭 Confirmar Retiro
          </button>
        )}

        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm">
          📞 Contactar
        </button>

        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm">
          📍 Ver Ubicación
        </button>
      </div>
    </div>
  );
}
