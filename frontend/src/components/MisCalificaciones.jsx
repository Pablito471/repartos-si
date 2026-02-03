import { useAuth } from "@/context/AuthContext";
import StarRating, { RatingDistribution } from "./StarRating";
import { useState, useEffect } from "react";

/**
 * Componente para mostrar las calificaciones y comentarios propios
 * @param {string} colorPrimary - Color primario del tema (blue, green, orange)
 */
export default function MisCalificaciones({ colorPrimary = "blue" }) {
  const { usuario, getCalificacionesUsuario, getPromedioCalificaciones } =
    useAuth();
  const [verTodas, setVerTodas] = useState(false);
  const [calificaciones, setCalificaciones] = useState([]);
  const [promedio, setPromedio] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      if (usuario?.id) {
        const [cals, prom] = await Promise.all([
          getCalificacionesUsuario(usuario.id),
          getPromedioCalificaciones(usuario.id),
        ]);
        setCalificaciones(Array.isArray(cals) ? cals : []);
        setPromedio(prom || 0);
      }
      setCargando(false);
    };
    cargarDatos();
  }, [usuario?.id, getCalificacionesUsuario, getPromedioCalificaciones]);

  // Asegurar que calificaciones siempre sea un array
  const calificacionesArray = Array.isArray(calificaciones)
    ? calificaciones
    : [];
  const calificacionesMostrar = verTodas
    ? calificacionesArray
    : calificacionesArray.slice(0, 5);

  const colorClasses = {
    primary: {
      header: "from-primary-600 to-primary-700",
      badge:
        "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300",
      button:
        "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
      border: "border-primary-200 dark:border-primary-800",
    },
    blue: {
      header: "from-primary-600 to-primary-700",
      badge:
        "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300",
      button:
        "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
      border: "border-primary-200 dark:border-primary-800",
    },
    green: {
      header: "from-primary-600 to-primary-700",
      badge:
        "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300",
      button:
        "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
      border: "border-primary-200 dark:border-primary-800",
    },
    orange: {
      header: "from-primary-600 to-primary-700",
      badge:
        "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300",
      button:
        "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
      border: "border-primary-200 dark:border-primary-800",
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
      cliente:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      deposito:
        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      flete:
        "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
    };
    return (
      badges[tipo] ||
      "bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-300"
    );
  };

  if (cargando) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (calificacionesArray.length === 0) {
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
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">
            Aún no tienes calificaciones
          </p>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-2">
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
          {calificacionesArray.length}{" "}
          {calificacionesArray.length === 1 ? "calificación" : "calificaciones"}{" "}
          recibidas
        </p>
      </div>

      {/* Distribución de estrellas */}
      <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
        <RatingDistribution calificaciones={calificaciones} />
      </div>

      {/* Lista de comentarios */}
      <div>
        <h4 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
          <span>💬</span>
          Comentarios recientes
        </h4>

        {calificaciones.some((c) => c.comentario) ? (
          <div className="space-y-3">
            {calificacionesMostrar.map((calificacion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${colors.border} bg-white dark:bg-neutral-800 hover:shadow-md dark:hover:shadow-neutral-900/50 transition-shadow`}
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
                      <span className="text-neutral-400 dark:text-neutral-500">
                        •
                      </span>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
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
                      <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
                        "{calificacion.comentario}"
                      </p>
                    ) : (
                      <p className="text-neutral-400 dark:text-neutral-500 text-sm italic">
                        Sin comentario
                      </p>
                    )}
                  </div>

                  {/* Puntuación destacada */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      calificacion.puntuacion >= 4
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        : calificacion.puntuacion >= 3
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
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
            {calificacionesArray.length > 5 && (
              <button
                onClick={() => setVerTodas(!verTodas)}
                className={`w-full py-2 text-sm font-medium ${colors.button} transition-colors`}
              >
                {verTodas
                  ? `Mostrar menos ↑`
                  : `Ver todas las ${calificacionesArray.length} calificaciones ↓`}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-neutral-500 dark:text-neutral-400">
            <p>
              Has recibido {calificacionesArray.length} calificaciones pero
              ninguna incluye comentarios.
            </p>
          </div>
        )}
      </div>

      {/* Resumen rápido */}
      <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {calificaciones.filter((c) => c.puntuacion >= 4).length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Excelentes
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {calificaciones.filter((c) => c.puntuacion === 3).length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Regulares
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {calificaciones.filter((c) => c.puntuacion < 3).length}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Bajas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
