import { useState } from "react";
import FleteLayout from "@/components/layouts/FleteLayout";
import { useFlete } from "@/context/FleteContext";
import { formatNumber } from "@/utils/formatters";
import { movimientosService } from "@/services/api";
import Swal from "sweetalert2";

export default function FleteRuta() {
  const {
    getEnviosDelDia,
    getEnviosPorEstado,
    marcarRecogido,
    marcarEntregado,
    cargandoEnvios,
  } = useFlete();
  const [vistaOptimizada, setVistaOptimizada] = useState(true);

  // Mostrar loading mientras se cargan los envíos
  if (cargandoEnvios) {
    return (
      <FleteLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando ruta...</span>
        </div>
      </FleteLayout>
    );
  }

  const enviosHoy = getEnviosDelDia();

  // Ordenar por prioridad y estado
  const enviosOrdenados = [...enviosHoy].sort((a, b) => {
    // Primero por estado (pendiente > en_camino > entregado)
    const ordenEstado = {
      pendiente: 0,
      en_camino: 1,
      entregado: 2,
      problema: 3,
    };
    if (ordenEstado[a.estado] !== ordenEstado[b.estado]) {
      return ordenEstado[a.estado] - ordenEstado[b.estado];
    }
    // Luego por prioridad
    const ordenPrioridad = { alta: 0, media: 1, baja: 2 };
    return ordenPrioridad[a.prioridad] - ordenPrioridad[b.prioridad];
  });

  const pendientes = getEnviosPorEstado("pendiente").filter((e) =>
    enviosHoy.some((eh) => eh.id === e.id),
  );
  const enCamino = getEnviosPorEstado("en_camino").filter((e) =>
    enviosHoy.some((eh) => eh.id === e.id),
  );
  const entregados = getEnviosPorEstado("entregado").filter((e) =>
    enviosHoy.some((eh) => eh.id === e.id),
  );

  const progreso =
    enviosHoy.length > 0
      ? Math.round((entregados.length / enviosHoy.length) * 100)
      : 0;

  const getEstadoIcon = (estado) => {
    const icons = {
      pendiente: "⏳",
      en_camino: "🚚",
      entregado: "✅",
      problema: "⚠️",
    };
    return icons[estado] || "📦";
  };

  const handleAccionRapida = async (envio) => {
    if (envio.estado === "pendiente") {
      const result = await Swal.fire({
        title: "Recoger Pedido",
        text: `¿Recoger pedido de ${envio.deposito}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, recoger",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#f97316",
      });
      if (result.isConfirmed) {
        try {
          await marcarRecogido(envio.id);
          Swal.fire({
            icon: "success",
            title: "¡En camino!",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message || "No se pudo actualizar el estado",
          });
        }
      }
    } else if (envio.estado === "en_camino") {
      const result = await Swal.fire({
        title: "Entregar Pedido",
        text: `¿Confirmar entrega a ${envio.cliente}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, entregar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#22c55e",
      });
      if (result.isConfirmed) {
        try {
          await marcarEntregado(envio.id);
          Swal.fire({
            icon: "success",
            title: "¡Entregado!",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message || "No se pudo actualizar el estado",
          });
        }
      }
    }
  };

  const abrirMapa = (direccion) => {
    const query = encodeURIComponent(direccion);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      "_blank",
    );
  };

  const llamarCliente = (telefono) => {
    window.open(`tel:${telefono}`);
  };

  return (
    <FleteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Ruta del Día</h1>
            <p className="text-gray-600">
              {new Date().toLocaleDateString("es-AR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={() => setVistaOptimizada(!vistaOptimizada)}
              className={`px-4 py-2 rounded-lg transition-colors ${vistaOptimizada
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
                }`}
            >
              {vistaOptimizada ? "🗺️ Vista Optimizada" : "📋 Vista Lista"}
            </button>
          </div>
        </div>

        {/* Progreso del día */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Progreso del Día</h3>
            <span className="text-2xl font-bold text-orange-600">
              {progreso}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-yellow-600">
              ⏳ {pendientes.length} Pendientes
            </span>
            <span className="text-blue-600">
              🚚 {enCamino.length} En Camino
            </span>
            <span className="text-green-600">
              ✅ {entregados.length} Entregados
            </span>
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold text-gray-800">
              {enviosHoy.length}
            </p>
            <p className="text-sm text-gray-500">Total Envíos</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">
              ${formatNumber(enviosHoy.reduce((sum, e) => sum + e.total, 0))}
            </p>
            <p className="text-sm text-gray-500">Total a Cobrar</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-blue-600">
              {enviosHoy.filter((e) => e.prioridad === "alta").length}
            </p>
            <p className="text-sm text-gray-500">Prioridad Alta</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-orange-600">
              ${formatNumber(entregados.reduce((sum, e) => sum + e.total, 0))}
            </p>
            <p className="text-sm text-gray-500">Cobrado Hoy</p>
          </div>
        </div>

        {/* Lista de Paradas */}
        {enviosHoy.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-5xl block mb-4">🎉</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              ¡Día libre!
            </h3>
            <p className="text-gray-500">
              No tienes envíos programados para hoy
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span>📍</span> Paradas del Día
              <span className="text-sm font-normal text-gray-500">
                (ordenadas por prioridad)
              </span>
            </h3>

            {vistaOptimizada ? (
              // Vista de timeline
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {enviosOrdenados.map((envio, index) => (
                  <div key={envio.id} className="relative pl-14 pb-6">
                    {/* Punto en timeline */}
                    <div
                      className={`absolute left-4 w-5 h-5 rounded-full border-4 border-white ${envio.estado === "entregado"
                        ? "bg-green-500"
                        : envio.estado === "en_camino"
                          ? "bg-blue-500"
                          : envio.prioridad === "alta"
                            ? "bg-red-500"
                            : "bg-orange-500"
                        }`}
                    ></div>

                    {/* Número de parada */}
                    <div className="absolute left-0 -top-1 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                      {index + 1}
                    </div>

                    {/* Card de parada */}
                    <div
                      className={`card ${envio.estado === "entregado"
                        ? "opacity-60 bg-gray-50"
                        : envio.estado === "en_camino"
                          ? "border-2 border-blue-400 bg-blue-50"
                          : envio.prioridad === "alta"
                            ? "border-2 border-red-400"
                            : ""
                        }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">
                              {getEstadoIcon(envio.estado)}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {envio.cliente}
                            </span>
                            {envio.prioridad === "alta" && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                                Urgente
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">
                            {envio.direccion}
                          </p>

                          {/* Productos del envío */}
                          {envio.productos && envio.productos.length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                              <p className="text-xs font-medium text-gray-500 mb-1">
                                📦 Productos:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {envio.productos.map((prod, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-white px-2 py-1 rounded border"
                                  >
                                    {prod.cantidad}x {prod.nombre}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>🏪 {envio.deposito}</span>
                            <span>🕐 {envio.horarioEntrega}</span>
                            <span className="font-medium text-green-600">
                              ${formatNumber(envio.total)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => abrirMapa(envio.direccion)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Ver en mapa"
                          >
                            🗺️
                          </button>
                          <button
                            onClick={() => llamarCliente(envio.telefono)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Llamar cliente"
                          >
                            📞
                          </button>
                          {envio.estado !== "entregado" && (
                            <button
                              onClick={() => handleAccionRapida(envio)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${envio.estado === "pendiente"
                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                : "bg-green-500 text-white hover:bg-green-600"
                                }`}
                            >
                              {envio.estado === "pendiente"
                                ? "Recoger"
                                : "Entregar"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Vista de lista simple
              <div className="space-y-3">
                {enviosOrdenados.map((envio, index) => (
                  <div
                    key={envio.id}
                    className={`card ${envio.estado === "entregado" ? "opacity-50" : ""
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{envio.cliente}</p>
                        <p className="text-sm text-gray-500">
                          {envio.direccion}
                        </p>
                      </div>
                      <span className="text-xl">
                        {getEstadoIcon(envio.estado)}
                      </span>
                      <span className="font-bold text-green-600">
                        ${formatNumber(envio.total)}
                      </span>
                    </div>
                    {/* Productos en vista lista */}
                    {envio.productos && envio.productos.length > 0 && (
                      <div className="mt-2 ml-14 p-2 bg-gray-50 rounded">
                        <div className="flex flex-wrap gap-1">
                          {envio.productos.map((prod, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-white px-2 py-1 rounded border"
                            >
                              {prod.cantidad}x {prod.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Acciones de la ruta */}
        <div className="card bg-gradient-to-r from-orange-50 to-yellow-50">
          <h3 className="font-semibold text-gray-800 mb-4">Acciones de Ruta</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => {
                const direcciones = enviosOrdenados
                  .filter((e) => e.estado !== "entregado")
                  .map((e) => e.direccion)
                  .join("/");
                if (direcciones) {
                  window.open(
                    `https://www.google.com/maps/dir/${encodeURIComponent(direcciones)}`,
                    "_blank",
                  );
                }
              }}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <span className="text-2xl block mb-2">🗺️</span>
              <span className="text-sm font-medium">Abrir Ruta en Maps</span>
            </button>
            <button
              onClick={() => {
                Swal.fire({
                  title: "Resumen del Día",
                  html: `
                    <div class="text-left space-y-2">
                      <p>📦 Total envíos: <b>${enviosHoy.length}</b></p>
                      <p>✅ Entregados: <b>${entregados.length}</b></p>
                      <p>⏳ Pendientes: <b>${pendientes.length + enCamino.length}</b></p>
                      <p>💰 Cobrado: <b>$${formatNumber(entregados.reduce((s, e) => s + e.total, 0))}</b></p>
                      <p>💵 Por cobrar: <b>$${formatNumber([...pendientes, ...enCamino].reduce((s, e) => s + e.total, 0))}</b></p>
                    </div>
                  `,
                  confirmButtonColor: "#f97316",
                });
              }}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <span className="text-2xl block mb-2">📊</span>
              <span className="text-sm font-medium">Ver Resumen</span>
            </button>
            <button
              onClick={async () => {
                const { value: novedad } = await Swal.fire({
                  title: "Reportar Novedad",
                  input: "textarea",
                  inputPlaceholder: "Describe la novedad...",
                  showCancelButton: true,
                  confirmButtonText: "Enviar",
                  confirmButtonColor: "#f97316",
                  inputValidator: (value) => {
                    if (!value) {
                      return "Debes escribir algo";
                    }
                  },
                });

                if (novedad) {
                  try {
                    await movimientosService.crear({
                      tipo: "egreso",
                      monto: 0,
                      concepto: `Novedad de ruta: ${novedad.substring(0, 50)}`,
                      categoria: "otros",
                      notas: novedad,
                    });

                    Swal.fire({
                      icon: "success",
                      title: "Novedad reportada",
                      text: "Tu reporte fue guardado correctamente",
                      timer: 1500,
                      showConfirmButton: false,
                    });
                  } catch (error) {
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: "No se pudo guardar la novedad",
                    });
                  }
                }
              }}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <span className="text-2xl block mb-2">📝</span>
              <span className="text-sm font-medium">Reportar Novedad</span>
            </button>
            <button
              onClick={() => {
                Swal.fire({
                  title: "Finalizar Día",
                  text: "¿Estás seguro de finalizar tu jornada?",
                  icon: "question",
                  showCancelButton: true,
                  confirmButtonText: "Sí, finalizar",
                  cancelButtonText: "Cancelar",
                  confirmButtonColor: "#f97316",
                }).then((result) => {
                  if (result.isConfirmed) {
                    Swal.fire({
                      icon: "success",
                      title: "¡Buen trabajo!",
                      text: "Tu jornada ha sido registrada",
                      confirmButtonColor: "#f97316",
                    });
                  }
                });
              }}
              className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <span className="text-2xl block mb-2">🏁</span>
              <span className="text-sm font-medium">Finalizar Día</span>
            </button>
          </div>
        </div>
      </div>
    </FleteLayout>
  );
}
