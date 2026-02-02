import { useState } from "react";
import StarRating from "./StarRating";
import { useAuth } from "@/context/AuthContext";
import {
  showSuccessAlert,
  showErrorAlert,
  showWarningAlert,
} from "@/utils/alerts";

export default function CalificarModal({ usuario, onClose, onCalificado }) {
  const {
    calificarUsuario,
    getCalificacionesUsuario,
    usuario: usuarioActual,
  } = useAuth();
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Verificar si ya calificó a este usuario
  const calificaciones = getCalificacionesUsuario(usuario.id);
  const calificacionExistente = calificaciones.find(
    (c) => c.idCalificador === usuarioActual?.id,
  );

  // Si existe calificación previa, cargar valores
  useState(() => {
    if (calificacionExistente) {
      setPuntuacion(calificacionExistente.puntuacion);
      setComentario(calificacionExistente.comentario || "");
    }
  }, [calificacionExistente]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (puntuacion === 0) {
      showWarningAlert(
        "Selecciona una puntuación",
        "Debes seleccionar al menos 1 estrella",
      );
      return;
    }

    setEnviando(true);

    const resultado = calificarUsuario(
      usuario.id,
      puntuacion,
      comentario.trim(),
    );

    if (resultado.success) {
      showSuccessAlert(
        resultado.actualizado
          ? "¡Calificación actualizada!"
          : "¡Gracias por tu calificación!",
        `Has ${resultado.actualizado ? "actualizado tu calificación de" : "calificado a"} ${usuario.nombre} con ${puntuacion} ${puntuacion === 1 ? "estrella" : "estrellas"}`,
      );
      onCalificado?.();
      onClose();
    } else {
      showErrorAlert("Error", resultado.error);
    }

    setEnviando(false);
  };

  const tipoIcono = {
    cliente: "👤",
    deposito: "🏭",
    flete: "🚚",
  };

  const tipoNombre = {
    cliente: "Cliente",
    deposito: "Depósito",
    flete: "Flete",
  };

  // Calcular promedio actual
  const promedioActual =
    calificaciones.length > 0
      ? calificaciones.reduce((acc, c) => acc + c.puntuacion, 0) /
        calificaciones.length
      : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>⭐</span>
              {calificacionExistente ? "Actualizar calificación" : "Calificar"}
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Usuario info */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-3xl overflow-hidden">
              {usuario.foto ? (
                <img
                  src={usuario.foto}
                  alt={usuario.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                tipoIcono[usuario.tipoUsuario]
              )}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 text-lg">
                {usuario.nombre}
              </h4>
              <p className="text-gray-500 text-sm">
                {tipoNombre[usuario.tipoUsuario]}
              </p>
              {calificaciones.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <StarRating rating={promedioActual} size="sm" />
                  <span className="text-sm text-gray-500">
                    ({calificaciones.length})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Estrellas */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ¿Cómo calificas a {usuario.nombre}?
            </label>
            <div className="flex justify-center">
              <StarRating
                rating={puntuacion}
                onRate={setPuntuacion}
                size="lg"
              />
            </div>
            {puntuacion > 0 && (
              <p className="mt-2 text-gray-600 font-medium">
                {puntuacion === 1 && "😞 Muy malo"}
                {puntuacion === 2 && "😕 Malo"}
                {puntuacion === 3 && "😐 Regular"}
                {puntuacion === 4 && "😊 Bueno"}
                {puntuacion === 5 && "🤩 Excelente"}
              </p>
            )}
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentario (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escribe tu experiencia..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {comentario.length}/200
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando || puntuacion === 0}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                puntuacion > 0
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {enviando
                ? "Enviando..."
                : calificacionExistente
                  ? "Actualizar"
                  : "Calificar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
