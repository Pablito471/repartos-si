import { useAuth } from "@/context/AuthContext";
import StarRating, { RatingDistribution } from "./StarRating";
import { useState } from "react";

/**
 * Componente para mostrar las calificaciones y comentarios propios
 * @param {string} colorPrimary - Color primario del tema (blue, green, orange)
 */
export default function MisCalificaciones({ colorPrimary = "blue" }) {
  const { usuario, getCalificacionesUsuario, getPromedioCalificaciones } =
    useAuth();
  const [verTodas, setVerTodas] = useState(false);

  const calificaciones = getCalificacionesUsuario(usuario?.id) || [];
  const promedio = getPromedioCalificaciones(usuario?.id);

  const calificacionesMostrar = verTodas
    ? calificaciones
    : calificaciones.slice(0, 5);

  const colorClasses = {
    blue: {
      header: "from-blue-500 to-blue-600",
      badge: "bg-blue-100 text-blue-800",
      button: "text-blue-600 hover:text-blue-700",
      border: "border-blue-200",
    },
    green: {
      header: "from-green-500 to-green-600",
      badge: "bg-green-100 text-green-800",
      button: "text-green-600 hover:text-green-700",
      border: "border-green-200",
    },
    orange: {
      header: "from-orange-500 to-orange-600",
      badge: "bg-orange-100 text-orange-800",
      button: "text-orange-600 hover:text-orange-700",
      border: "border-orange-200",
    },
  };

  const colors = colorClasses[colorPrimary] || colorClasses.blue;

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "Fecha desconocida";
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora - date;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias === 0) return "Hoy";
    if (diffDias === 1) return "Ayer";
    if (diffDias < 7) return `Hace ${diffDias} días`;
    if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} semanas`;
    if (diffDias < 365) return `Hace ${Math.floor(diffDias / 30)} meses`;
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Obtener tipo de quien calificó
  const getTipoTexto = (tipo) => {
    const tipos = {
      cliente: "Cliente",
      deposito: "Depósito",
      flete: "Flete",
    };
    return tipos[tipo] || tipo;
  };

  const getTipoBadge = (tipo) => {
    const badges = {
      cliente: "bg-blue-100 text-blue-800",
      deposito: "bg-green-100 text-green-800",
      flete: "bg-orange-100 text-orange-800",
    };
    return badges[tipo] || "bg-gray-100 text-gray-800";
  };

  if (calificaciones.length === 0) {
    return (
      <div className="card">
        <div
          className={`-mx-6 -mt-6 px-6 py-4 bg-gradient-to-r ${colors.header} text-white rounded-t-xl mb-4`}
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>⭐</span>
            Mis Calificaciones
          </h3>
        </div>

        <div className="text-center py-8">
          <div className="text-5xl mb-4">⭐</div>
          <p className="text-gray-500 text-lg">Aún no tienes calificaciones</p>
          <p className="text-gray-400 text-sm mt-2">
            Las calificaciones aparecerán aquí cuando otros usuarios te
            califiquen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div
        className={`-mx-6 -mt-6 px-6 py-4 bg-gradient-to-r ${colors.header} text-white rounded-t-xl mb-4`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>⭐</span>
            Mis Calificaciones
          </h3>
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
            <span className="text-2xl font-bold">{promedio.toFixed(1)}</span>
            <span className="text-yellow-300 text-xl">★</span>
          </div>
        </div>
        <p className="text-sm text-white/80 mt-1">
          {calificaciones.length}{" "}
          {calificaciones.length === 1 ? "calificación" : "calificaciones"}{" "}
          recibidas
        </p>
      </div>

      {/* Distribución de estrellas */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <RatingDistribution calificaciones={calificaciones} />
      </div>

      {/* Lista de comentarios */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>💬</span>
          Comentarios recientes
        </h4>

        {calificaciones.some((c) => c.comentario) ? (
          <div className="space-y-3">
            {calificacionesMostrar.map((calificacion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${colors.border} bg-white hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {/* Cabecera: Quien calificó y fecha */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getTipoBadge(calificacion.tipoCalificador)}`}
                      >
                        {getTipoTexto(calificacion.tipoCalificador)}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500">
                        {formatearFecha(calificacion.fecha)}
                      </span>
                    </div>

                    {/* Estrellas */}
                    <div className="mb-2">
                      <StarRating
                        rating={calificacion.puntuacion}
                        size="sm"
                        showValue={false}
                      />
                    </div>

                    {/* Comentario */}
                    {calificacion.comentario ? (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        "{calificacion.comentario}"
                      </p>
                    ) : (
                      <p className="text-gray-400 text-sm italic">
                        Sin comentario
                      </p>
                    )}
                  </div>

                  {/* Puntuación destacada */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      calificacion.puntuacion >= 4
                        ? "bg-green-100 text-green-600"
                        : calificacion.puntuacion >= 3
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    <span className="font-bold text-lg">
                      {calificacion.puntuacion}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Botón ver más/menos */}
            {calificaciones.length > 5 && (
              <button
                onClick={() => setVerTodas(!verTodas)}
                className={`w-full py-2 text-sm font-medium ${colors.button} transition-colors`}
              >
                {verTodas
                  ? `Mostrar menos ↑`
                  : `Ver todas las ${calificaciones.length} calificaciones ↓`}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>
              Has recibido {calificaciones.length} calificaciones pero ninguna
              incluye comentarios.
            </p>
          </div>
        )}
      </div>

      {/* Resumen rápido */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {calificaciones.filter((c) => c.puntuacion >= 4).length}
            </p>
            <p className="text-xs text-gray-500">Excelentes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {calificaciones.filter((c) => c.puntuacion === 3).length}
            </p>
            <p className="text-xs text-gray-500">Regulares</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {calificaciones.filter((c) => c.puntuacion < 3).length}
            </p>
            <p className="text-xs text-gray-500">Bajas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
