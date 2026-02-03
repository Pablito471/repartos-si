import { useState, useEffect } from "react";
import FleteLayout from "@/components/layouts/FleteLayout";
import { useFlete } from "@/context/FleteContext";
import { useAuth } from "@/context/AuthContext";
import { formatNumber } from "@/utils/formatters";
import Swal from "sweetalert2";
import StarRating from "@/components/StarRating";
import CalificarModal from "@/components/CalificarModal";

// Componente para mostrar calificación del cliente
function ClienteCalificacion({
  cliente,
  envioEstado,
  onCalificar,
  getPromedioCalificaciones,
  getCalificacionesUsuario,
}) {
  const [promedio, setPromedio] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const cargar = async () => {
      if (cliente?.id) {
        const [prom, cals] = await Promise.all([
          getPromedioCalificaciones(cliente.id),
          getCalificacionesUsuario(cliente.id),
        ]);
        setPromedio(prom || 0);
        setTotal(Array.isArray(cals) ? cals.length : 0);
      }
    };
    cargar();
  }, [cliente?.id, getPromedioCalificaciones, getCalificacionesUsuario]);

  if (!cliente) return null;

  return (
    <div className="flex items-center gap-2 mt-1">
      <StarRating rating={promedio} size="sm" />
      <span className="text-xs text-gray-500">({total})</span>
      {envioEstado === "entregado" && (
        <button
          onClick={() => onCalificar(cliente)}
          className="text-xs text-orange-600 hover:text-orange-800 font-medium"
        >
          Calificar
        </button>
      )}
    </div>
  );
}

export default function FleteEnvios() {
  const {
    envios,
    marcarRecogido,
    marcarEntregado,
    reportarProblema,
    getEnviosPorEstado,
    cargandoEnvios,
  } = useFlete();
  const { usuarios, getPromedioCalificaciones, getCalificacionesUsuario } =
    useAuth();
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [usuarioACalificar, setUsuarioACalificar] = useState(null);

  // Mostrar loading mientras se cargan los envíos
  if (cargandoEnvios) {
    return (
      <FleteLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando envíos...</span>
        </div>
      </FleteLayout>
    );
  }

  // Función para obtener usuario cliente por nombre
  const getUsuarioCliente = (nombreCliente) => {
    return usuarios.find(
      (u) => u.tipoUsuario === "cliente" && u.nombre === nombreCliente,
    );
  };

  const estadosFiltro = [
    { value: "todos", label: "Todos", icon: "📋" },
    { value: "pendiente", label: "Pendientes", icon: "⏳" },
    { value: "en_camino", label: "En Camino", icon: "🚚" },
    { value: "entregado", label: "Entregados", icon: "✅" },
    { value: "problema", label: "Con Problemas", icon: "⚠️" },
  ];

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
      en_camino: "bg-blue-100 text-blue-800 border-blue-300",
      entregado: "bg-green-100 text-green-800 border-green-300",
      cancelado: "bg-red-100 text-red-800 border-red-300",
      problema: "bg-orange-100 text-orange-800 border-orange-300",
    };
    return colores[estado] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      pendiente: "Pendiente",
      en_camino: "En Camino",
      entregado: "Entregado",
      cancelado: "Cancelado",
      problema: "Problema",
    };
    return textos[estado] || estado;
  };

  const getPrioridadBadge = (prioridad) => {
    const badges = {
      alta: { color: "bg-red-500", texto: "Alta", icon: "🔴" },
      media: { color: "bg-yellow-500", texto: "Media", icon: "🟡" },
      baja: { color: "bg-green-500", texto: "Baja", icon: "🟢" },
    };
    return badges[prioridad] || badges.baja;
  };

  let enviosFiltrados =
    filtroEstado === "todos" ? envios : getEnviosPorEstado(filtroEstado);

  if (busqueda) {
    enviosFiltrados = enviosFiltrados.filter(
      (e) =>
        e.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.direccion.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.numeroPedido.toLowerCase().includes(busqueda.toLowerCase()),
    );
  }

  const handleRecoger = async (envio) => {
    const result = await Swal.fire({
      title: "¿Confirmar recogida?",
      html: `
        <p>Estás por marcar como recogido el pedido:</p>
        <p class="font-bold">${envio.numeroPedido}</p>
        <p class="text-gray-500">${envio.deposito}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, recogido",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
    });

    if (result.isConfirmed) {
      try {
        await marcarRecogido(envio.id);
        Swal.fire({
          title: "¡Recogido!",
          text: "El pedido ha sido marcado como en camino",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          title: "Error",
          text:
            "No se pudo actualizar el estado: " +
            (error.message || "Error desconocido"),
          icon: "error",
        });
      }
    }
  };

  const handleEntregar = async (envio) => {
    const result = await Swal.fire({
      title: "¿Confirmar entrega?",
      html: `
        <p>Estás por marcar como entregado el pedido:</p>
        <p class="font-bold">${envio.numeroPedido}</p>
        <p class="text-gray-500">${envio.cliente}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, entregado",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#22c55e",
    });

    if (result.isConfirmed) {
      try {
        await marcarEntregado(envio.id);
        Swal.fire({
          title: "¡Entregado!",
          text: "El pedido ha sido entregado exitosamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          title: "Error",
          text:
            "No se pudo actualizar el estado: " +
            (error.message || "Error desconocido"),
          icon: "error",
        });
      }
    }
  };

  const handleReportarProblema = async (envio) => {
    const { value: descripcion } = await Swal.fire({
      title: "Reportar Problema",
      input: "textarea",
      inputLabel: "Describe el problema",
      inputPlaceholder: "Ej: Cliente no se encuentra, dirección incorrecta...",
      showCancelButton: true,
      confirmButtonText: "Reportar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      inputValidator: (value) => {
        if (!value) {
          return "Debes describir el problema";
        }
      },
    });

    if (descripcion) {
      try {
        await reportarProblema(envio.id, descripcion);
        Swal.fire({
          title: "Problema Reportado",
          text: "Se ha notificado al depósito sobre el problema",
          icon: "warning",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          title: "Error",
          text:
            "No se pudo reportar el problema: " +
            (error.message || "Error desconocido"),
          icon: "error",
        });
      }
    }
  };

  const verDetalles = (envio) => {
    Swal.fire({
      title: `Pedido ${envio.numeroPedido}`,
      html: `
        <div class="text-left space-y-3">
          <div class="border-b pb-2">
            <p class="text-gray-500 text-sm">Cliente</p>
            <p class="font-medium">${envio.cliente}</p>
          </div>
          <div class="border-b pb-2">
            <p class="text-gray-500 text-sm">Dirección</p>
            <p class="font-medium">${envio.direccion}</p>
          </div>
          <div class="border-b pb-2">
            <p class="text-gray-500 text-sm">Depósito de origen</p>
            <p class="font-medium">${envio.deposito}</p>
          </div>
          <div class="border-b pb-2">
            <p class="text-gray-500 text-sm">Horario de entrega</p>
            <p class="font-medium">${envio.horarioEntrega}</p>
          </div>
          <div class="border-b pb-2">
            <p class="text-gray-500 text-sm">Teléfono</p>
            <p class="font-medium">${envio.telefono}</p>
          </div>
          <div>
            <p class="text-gray-500 text-sm">Total a cobrar</p>
            <p class="font-bold text-green-600 text-lg">$${formatNumber(envio.total)}</p>
          </div>
          ${envio.notas ? `<div class="bg-yellow-50 p-2 rounded"><p class="text-gray-500 text-sm">Notas</p><p class="text-sm">${envio.notas}</p></div>` : ""}
        </div>
      `,
      confirmButtonText: "Cerrar",
      confirmButtonColor: "#f97316",
    });
  };

  return (
    <FleteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Entregas</h1>
          <p className="text-gray-600">
            Gestiona y actualiza el estado de tus pedidos asignados
          </p>
        </div>

        {/* Filtros */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Filtro por estado */}
            <div className="flex flex-wrap gap-2">
              {estadosFiltro.map((estado) => (
                <button
                  key={estado.value}
                  onClick={() => setFiltroEstado(estado.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    filtroEstado === estado.value
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{estado.icon}</span>
                  <span>{estado.label}</span>
                </button>
              ))}
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar envío..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-field pl-10 w-full md:w-64"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                🔍
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Envíos */}
        {enviosFiltrados.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-5xl block mb-4">📭</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay envíos
            </h3>
            <p className="text-gray-500">
              No se encontraron envíos con los filtros seleccionados
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {enviosFiltrados.map((envio) => {
              const prioridad = getPrioridadBadge(envio.prioridad);
              return (
                <div
                  key={envio.id}
                  className={`card border-l-4 ${getEstadoColor(envio.estado).split(" ")[2] || "border-gray-300"}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Info principal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {envio.numeroPedido}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(envio.estado)}`}
                        >
                          {getEstadoTexto(envio.estado)}
                        </span>
                        <span
                          className="text-sm"
                          title={`Prioridad ${prioridad.texto}`}
                        >
                          {prioridad.icon} {prioridad.texto}
                        </span>
                      </div>

                      <h3 className="font-semibold text-gray-800 text-lg">
                        {envio.cliente}
                      </h3>
                      <p className="text-gray-600 flex items-center gap-2">
                        <span>📍</span> {envio.direccion}
                      </p>

                      {/* Calificación del cliente */}
                      <ClienteCalificacion
                        cliente={getUsuarioCliente(envio.cliente)}
                        envioEstado={envio.estado}
                        onCalificar={setUsuarioACalificar}
                        getPromedioCalificaciones={getPromedioCalificaciones}
                        getCalificacionesUsuario={getCalificacionesUsuario}
                      />

                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span>🏪</span> {envio.deposito}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>🕐</span> {envio.horarioEntrega}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>📞</span> {envio.telefono}
                        </span>
                      </div>
                    </div>

                    {/* Total y acciones */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total a cobrar</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${formatNumber(envio.total)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => verDetalles(envio)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          👁️ Ver
                        </button>

                        {envio.estado === "pendiente" && (
                          <button
                            onClick={() => handleRecoger(envio)}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          >
                            📦 Recoger
                          </button>
                        )}

                        {envio.estado === "en_camino" && (
                          <>
                            <button
                              onClick={() => handleEntregar(envio)}
                              className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                            >
                              ✅ Entregar
                            </button>
                            <button
                              onClick={() => handleReportarProblema(envio)}
                              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                            >
                              ⚠️ Problema
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {envio.notas && (
                    <div className="mt-3 pt-3 border-t bg-yellow-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">📝 Notas:</span>{" "}
                        {envio.notas}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Resumen */}
        <div className="card bg-gray-50">
          <div className="flex flex-wrap gap-6 justify-center text-center">
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {getEnviosPorEstado("pendiente").length}
              </p>
              <p className="text-sm text-gray-500">Pendientes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {getEnviosPorEstado("en_camino").length}
              </p>
              <p className="text-sm text-gray-500">En Camino</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {getEnviosPorEstado("entregado").length}
              </p>
              <p className="text-sm text-gray-500">Entregados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {getEnviosPorEstado("problema").length}
              </p>
              <p className="text-sm text-gray-500">Con Problemas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Calificación */}
      {usuarioACalificar && (
        <CalificarModal
          usuario={usuarioACalificar}
          onClose={() => setUsuarioACalificar(null)}
        />
      )}
    </FleteLayout>
  );
}
