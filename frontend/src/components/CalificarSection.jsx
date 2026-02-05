import { useState, useEffect, useCallback } from "react";
import { calificacionesService } from "@/services/api";
import CalificarModal from "./CalificarModal";
import StarRating from "./StarRating";
import Icons from "./Icons";
import { showSuccessAlert, showErrorAlert } from "@/utils/alerts";

/**
 * Sección para calificar usuarios pendientes después de entregas
 */
export default function CalificarSection({ colorPrimary = "primary" }) {
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioACalificar, setUsuarioACalificar] = useState(null);
  const [pedidoActual, setPedidoActual] = useState(null);
  const [expandido, setExpandido] = useState(false);

  const cargarPendientes = useCallback(async () => {
    try {
      setCargando(true);
      const response = await calificacionesService.getPendientes();
      const data = response.data || response;
      setPendientes(data.pendientes || []);
    } catch (error) {
      console.error("Error al cargar pendientes:", error);
      setPendientes([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPendientes();
  }, [cargarPendientes]);

  const handleCalificar = (usuario, pedidoId) => {
    setUsuarioACalificar(usuario);
    setPedidoActual(pedidoId);
  };

  const handleCalificado = async () => {
    await cargarPendientes();
    setUsuarioACalificar(null);
    setPedidoActual(null);
  };

  const handleCalificarRapido = async (usuario, pedidoId, puntuacion) => {
    try {
      await calificacionesService.crear({
        calificadoId: usuario.id,
        pedidoId,
        puntuacion,
        comentario: "",
      });
      showSuccessAlert(
        "¡Calificación enviada!",
        `Has calificado a ${usuario.nombre} con ${puntuacion} estrellas`,
      );
      await cargarPendientes();
    } catch (error) {
      showErrorAlert(
        "Error",
        error.message || "No se pudo enviar la calificación",
      );
    }
  };

  const getTipoIcono = (tipo) => {
    const iconos = {
      cliente: "👤",
      deposito: "🏭",
      flete: "🚚",
    };
    return iconos[tipo] || "👤";
  };

  const getRolTexto = (rol) => {
    const roles = {
      cliente: "Cliente",
      deposito: "Depósito",
      flete: "Flete",
    };
    return roles[rol] || rol;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora - date;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias === 0) return "Hoy";
    if (diffDias === 1) return "Ayer";
    if (diffDias < 7) return `Hace ${diffDias} días`;
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  };

  // Total de usuarios pendientes
  const totalPendientes = pendientes.reduce(
    (acc, p) => acc + p.participantes.length,
    0,
  );

  // Mostrar solo los primeros 3 pedidos si no está expandido
  const pedidosMostrar = expandido ? pendientes : pendientes.slice(0, 3);

  if (cargando) {
    return (
      <div className="card !p-4">
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (totalPendientes === 0) {
    return null; // No mostrar si no hay pendientes
  }

  return (
    <>
      <div className="card !p-3 sm:!p-4 lg:!p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">⭐</span>
            <h3 className="font-semibold text-sm sm:text-base text-neutral-800 dark:text-neutral-100">
              Calificar
            </h3>
            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
              {totalPendientes} pendiente{totalPendientes > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Lista de pendientes */}
        <div className="space-y-3">
          {pedidosMostrar.map((pedido) => (
            <div
              key={pedido.pedidoId}
              className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3"
            >
              {/* Info del pedido */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Pedido #{pedido.numeroPedido}
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {formatearFecha(pedido.fechaEntrega)}
                </span>
              </div>

              {/* Participantes */}
              <div className="space-y-2">
                {pedido.participantes.map((p) => (
                  <div
                    key={`${pedido.pedidoId}-${p.usuario.id}`}
                    className="flex items-center justify-between bg-white dark:bg-neutral-700/50 rounded-lg p-2 sm:p-3"
                  >
                    {/* Usuario info */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {p.usuario.foto ? (
                          <img
                            src={p.usuario.foto}
                            alt={p.usuario.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm sm:text-lg">
                            {getTipoIcono(p.usuario.tipoUsuario)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 truncate">
                          {p.usuario.nombre}
                        </p>
                        <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                          {getRolTexto(p.rol)}
                        </p>
                      </div>
                    </div>

                    {/* Acciones de calificación */}
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {/* Calificación rápida - solo en desktop */}
                      <div className="hidden sm:flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() =>
                              handleCalificarRapido(
                                p.usuario,
                                pedido.pedidoId,
                                star,
                              )
                            }
                            className="p-0.5 hover:scale-125 transition-transform"
                            title={`${star} estrella${star > 1 ? "s" : ""}`}
                          >
                            <Icons.Star className="w-4 h-4 text-neutral-300 dark:text-neutral-500 hover:text-yellow-400 transition-colors" />
                          </button>
                        ))}
                      </div>

                      {/* Botón calificar con comentario */}
                      <button
                        onClick={() =>
                          handleCalificar(p.usuario, pedido.pedidoId)
                        }
                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] sm:text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Icons.Star className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Calificar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Ver más/menos */}
        {pendientes.length > 3 && (
          <button
            onClick={() => setExpandido(!expandido)}
            className="w-full mt-3 py-2 text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            {expandido
              ? "Ver menos"
              : `Ver ${pendientes.length - 3} pedido${pendientes.length - 3 > 1 ? "s" : ""} más`}
          </button>
        )}
      </div>

      {/* Modal de calificación */}
      {usuarioACalificar && (
        <CalificarModalMejorado
          usuario={usuarioACalificar}
          pedidoId={pedidoActual}
          onClose={() => {
            setUsuarioACalificar(null);
            setPedidoActual(null);
          }}
          onCalificado={handleCalificado}
        />
      )}
    </>
  );
}

/**
 * Modal de calificación mejorado con soporte para pedidoId
 */
function CalificarModalMejorado({ usuario, pedidoId, onClose, onCalificado }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [hover, setHover] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (puntuacion === 0) {
      showErrorAlert("Error", "Selecciona una puntuación");
      return;
    }

    setEnviando(true);

    try {
      await calificacionesService.crear({
        calificadoId: usuario.id,
        pedidoId,
        puntuacion,
        comentario: comentario.trim(),
      });

      showSuccessAlert(
        "¡Gracias por tu calificación!",
        `Has calificado a ${usuario.nombre} con ${puntuacion} estrella${puntuacion > 1 ? "s" : ""}`,
      );
      onCalificado?.();
    } catch (error) {
      showErrorAlert(
        "Error",
        error.message || "No se pudo enviar la calificación",
      );
    } finally {
      setEnviando(false);
    }
  };

  const getTipoIcono = (tipo) => {
    const iconos = { cliente: "👤", deposito: "🏭", flete: "🚚" };
    return iconos[tipo] || "👤";
  };

  const getTipoNombre = (tipo) => {
    const nombres = {
      cliente: "Cliente",
      deposito: "Depósito",
      flete: "Flete",
    };
    return nombres[tipo] || tipo;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>⭐</span>
              Calificar
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <Icons.X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Usuario info */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-2xl sm:text-3xl overflow-hidden">
              {usuario.foto ? (
                <img
                  src={usuario.foto}
                  alt={usuario.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                getTipoIcono(usuario.tipoUsuario)
              )}
            </div>
            <div>
              <h4 className="font-semibold text-base sm:text-lg text-neutral-800 dark:text-neutral-100">
                {usuario.nombre}
              </h4>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                {getTipoNombre(usuario.tipoUsuario)}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-5">
          {/* Estrellas */}
          <div className="text-center mb-4 sm:mb-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              ¿Cómo fue tu experiencia?
            </p>
            <div className="flex justify-center gap-1 sm:gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setPuntuacion(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Icons.Star
                    className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                      star <= (hover || puntuacion)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-neutral-300 dark:text-neutral-600"
                    }`}
                  />
                </button>
              ))}
            </div>
            {puntuacion > 0 && (
              <p className="mt-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                {puntuacion === 1 && "Malo"}
                {puntuacion === 2 && "Regular"}
                {puntuacion === 3 && "Bueno"}
                {puntuacion === 4 && "Muy bueno"}
                {puntuacion === 5 && "¡Excelente!"}
              </p>
            )}
          </div>

          {/* Comentario */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos más sobre tu experiencia..."
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 text-sm resize-none"
              maxLength={500}
            />
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 text-right">
              {comentario.length}/500
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 sm:py-2.5 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || puntuacion === 0}
              className="flex-1 px-4 py-2 sm:py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
            >
              {enviando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Icons.Star className="w-4 h-4" />
                  Calificar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
