import { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import StarRating, { RatingDistribution } from "@/components/StarRating";
import Link from "next/link";

const UMBRAL_CALIFICACION_BAJA = 3; // Usuarios con promedio menor a esto se consideran en alerta
const DIAS_USUARIO_NUEVO = 30; // Usuarios con menos de estos días se consideran "nuevos"

// Función para calcular días desde registro
const calcularDiasRegistro = (fechaRegistro) => {
  if (!fechaRegistro) return 999; // Si no hay fecha, asumir antiguo
  const registro = new Date(fechaRegistro);
  const hoy = new Date();
  const diffTime = Math.abs(hoy - registro);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Determinar si es usuario nuevo
const esUsuarioNuevo = (fechaRegistro) => {
  return calcularDiasRegistro(fechaRegistro) <= DIAS_USUARIO_NUEVO;
};

// Badge para antigüedad
const BadgeAntiguedad = ({ fechaRegistro }) => {
  const dias = calcularDiasRegistro(fechaRegistro);
  const esNuevo = dias <= DIAS_USUARIO_NUEVO;

  if (esNuevo) {
    return (
      <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
        🆕 Nuevo ({dias} días)
      </span>
    );
  }

  const meses = Math.floor(dias / 30);
  return (
    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
      📅{" "}
      {meses > 0 ? `${meses} ${meses === 1 ? "mes" : "meses"}` : `${dias} días`}
    </span>
  );
};

// Card de usuario en alerta
const AlertaUsuarioCard = ({
  usuario,
  esUrgente,
  usuarioSeleccionado,
  setUsuarioSeleccionado,
}) => {
  return (
    <div
      className={`rounded-lg p-4 flex items-center justify-between gap-4 ${
        esUrgente
          ? "bg-red-950/50 border border-red-500/40"
          : "bg-yellow-950/30 border border-yellow-500/20"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${
            esUrgente ? "ring-2 ring-red-500" : "ring-2 ring-yellow-500/50"
          }`}
        >
          {usuario.foto ? (
            <img
              src={usuario.foto}
              alt={usuario.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl bg-gray-700">
              {usuario.tipo === "cliente"
                ? "👤"
                : usuario.tipo === "deposito"
                  ? "🏭"
                  : "🚚"}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white">{usuario.nombre}</span>
            <BadgeTipo tipo={usuario.tipo} />
            <BadgeAntiguedad fechaRegistro={usuario.fechaRegistro} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={usuario.promedio} size="sm" />
            <span
              className={`text-sm font-medium ${esUrgente ? "text-red-400" : "text-yellow-400"}`}
            >
              {usuario.promedio.toFixed(1)} / 5
            </span>
            <span className="text-gray-500 text-xs">
              ({usuario.totalCalificaciones} reseñas)
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            setUsuarioSeleccionado(
              usuarioSeleccionado?.id === usuario.id ? null : usuario,
            )
          }
          className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
        >
          Ver detalles
        </button>
        <Link
          href="/admin/usuarios"
          className={`px-3 py-1.5 rounded-lg text-sm text-white transition-colors ${
            esUrgente
              ? "bg-red-600 hover:bg-red-700"
              : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          {esUrgente ? "Desactivar" : "Revisar"}
        </Link>
      </div>
    </div>
  );
};

const tiposUsuario = [
  { value: "todos", label: "Todos", color: "gray" },
  { value: "cliente", label: "Clientes", color: "blue" },
  { value: "deposito", label: "Depósitos", color: "green" },
  { value: "flete", label: "Fletes", color: "orange" },
];

const BadgeTipo = ({ tipo }) => {
  const colores = {
    cliente: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    deposito: "bg-green-500/20 text-green-400 border-green-500/30",
    flete: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

  const nombres = {
    cliente: "Cliente",
    deposito: "Depósito",
    flete: "Flete",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full border ${colores[tipo]}`}>
      {nombres[tipo]}
    </span>
  );
};

export default function CalificacionesPage() {
  const {
    getEstadisticasCalificaciones,
    getCalificacionesUsuario,
    desactivarCuenta,
  } = useAuth();
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    ranking: [],
    statsPorTipo: [],
    totalCalificaciones: 0,
    promedioGlobal: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      const data = await getEstadisticasCalificaciones();
      setEstadisticas(data);
      setCargando(false);
    };
    cargarEstadisticas();
  }, [getEstadisticasCalificaciones]);

  const rankingFiltrado = useMemo(() => {
    if (filtroTipo === "todos") return estadisticas.ranking;
    return estadisticas.ranking.filter((u) => u.tipo === filtroTipo);
  }, [estadisticas.ranking, filtroTipo]);

  // Usuarios con calificaciones bajas (promedio < UMBRAL)
  const usuariosEnAlerta = useMemo(() => {
    const enAlerta = estadisticas.ranking
      .filter(
        (u) =>
          u.promedio < UMBRAL_CALIFICACION_BAJA && u.totalCalificaciones >= 2,
      )
      .map((u) => ({
        ...u,
        esNuevo: esUsuarioNuevo(u.fechaRegistro),
        diasRegistro: calcularDiasRegistro(u.fechaRegistro),
      }))
      .sort((a, b) => {
        // Primero los antiguos (más urgente), luego los nuevos
        if (a.esNuevo !== b.esNuevo) return a.esNuevo ? 1 : -1;
        // Dentro del mismo grupo, ordenar por promedio (peor primero)
        return a.promedio - b.promedio;
      });

    return {
      todos: enAlerta,
      antiguos: enAlerta.filter((u) => !u.esNuevo),
      nuevos: enAlerta.filter((u) => u.esNuevo),
    };
  }, [estadisticas.ranking]);

  const getDistribucion = (calificaciones) => {
    const distribucion = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    calificaciones.forEach((c) => {
      distribucion[c.puntuacion]++;
    });
    const total = calificaciones.length;
    const promedio =
      total > 0
        ? calificaciones.reduce((acc, c) => acc + c.puntuacion, 0) / total
        : 0;
    return { distribucion, total, promedio };
  };

  if (cargando) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>⭐</span> Calificaciones
            </h1>
            <p className="text-gray-400 mt-1">
              Estadísticas y ranking de calificaciones de usuarios
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Calificaciones</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {estadisticas.totalCalificaciones}
                </p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Promedio Global</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-3xl font-bold text-yellow-400">
                    {estadisticas.promedioGlobal.toFixed(1)}
                  </p>
                  <span className="text-2xl">⭐</span>
                </div>
              </div>
              <div className="text-4xl">🌟</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Usuarios Calificados</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {estadisticas.ranking.length}
                </p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div
            className={`rounded-xl p-6 border ${usuariosEnAlerta.todos.length > 0 ? "bg-red-900/30 border-red-500/50" : "bg-gray-800 border-gray-700"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${usuariosEnAlerta.todos.length > 0 ? "text-red-400" : "text-gray-400"}`}
                >
                  En Alerta
                </p>
                <p
                  className={`text-3xl font-bold mt-1 ${usuariosEnAlerta.todos.length > 0 ? "text-red-400" : "text-white"}`}
                >
                  {usuariosEnAlerta.todos.length}
                </p>
                {usuariosEnAlerta.todos.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {usuariosEnAlerta.antiguos.length} antiguos ·{" "}
                    {usuariosEnAlerta.nuevos.length} nuevos
                  </p>
                )}
              </div>
              <div className="text-4xl">
                {usuariosEnAlerta.todos.length > 0 ? "⚠️" : "✅"}
              </div>
            </div>
          </div>
        </div>

        {/* Alerta de Calificaciones Bajas */}
        {usuariosEnAlerta.todos.length > 0 && (
          <div className="space-y-4">
            {/* Usuarios ANTIGUOS con calificaciones bajas - URGENTE */}
            {usuariosEnAlerta.antiguos.length > 0 && (
              <div className="bg-red-900/40 rounded-xl p-6 border-2 border-red-500">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🚨</div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-red-400 mb-1 flex items-center gap-2">
                      Usuarios Antiguos con Problemas
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                        URGENTE
                      </span>
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                      Estos usuarios llevan más de {DIAS_USUARIO_NUEVO} días y
                      mantienen calificaciones bajas.
                      <strong className="text-red-400">
                        {" "}
                        Se recomienda desactivar sus cuentas.
                      </strong>
                    </p>

                    <div className="space-y-3">
                      {usuariosEnAlerta.antiguos.map((usuario) => (
                        <AlertaUsuarioCard
                          key={usuario.id}
                          usuario={usuario}
                          esUrgente={true}
                          usuarioSeleccionado={usuarioSeleccionado}
                          setUsuarioSeleccionado={setUsuarioSeleccionado}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Usuarios NUEVOS con calificaciones bajas - EN OBSERVACIÓN */}
            {usuariosEnAlerta.nuevos.length > 0 && (
              <div className="bg-yellow-900/30 rounded-xl p-6 border border-yellow-500/50">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">👀</div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-yellow-400 mb-1 flex items-center gap-2">
                      Usuarios Nuevos en Observación
                      <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        EN REVISIÓN
                      </span>
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                      Estos usuarios tienen menos de {DIAS_USUARIO_NUEVO} días.
                      <strong className="text-yellow-400">
                        {" "}
                        Dales tiempo para mejorar antes de tomar acción.
                      </strong>
                    </p>

                    <div className="space-y-3">
                      {usuariosEnAlerta.nuevos.map((usuario) => (
                        <AlertaUsuarioCard
                          key={usuario.id}
                          usuario={usuario}
                          esUrgente={false}
                          usuarioSeleccionado={usuarioSeleccionado}
                          setUsuarioSeleccionado={setUsuarioSeleccionado}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sin alertas - Todo bien */}
        {usuariosEnAlerta.todos.length === 0 &&
          estadisticas.ranking.length > 0 && (
            <div className="bg-green-900/30 rounded-xl p-6 border border-green-500/50">
              <div className="flex items-center gap-4">
                <div className="text-4xl">✅</div>
                <div>
                  <h2 className="text-lg font-semibold text-green-400">
                    Todo en orden
                  </h2>
                  <p className="text-gray-400 text-sm">
                    No hay usuarios con calificaciones bajas que requieran
                    atención.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Stats por tipo */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Estadísticas por Tipo de Usuario
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {estadisticas.statsPorTipo.map((stat) => (
              <div
                key={stat.tipo}
                className={`rounded-lg p-4 border ${
                  stat.tipo === "cliente"
                    ? "bg-blue-500/10 border-blue-500/30"
                    : stat.tipo === "deposito"
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-orange-500/10 border-orange-500/30"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className={`font-semibold ${
                      stat.tipo === "cliente"
                        ? "text-blue-400"
                        : stat.tipo === "deposito"
                          ? "text-green-400"
                          : "text-orange-400"
                    }`}
                  >
                    {stat.tipo === "cliente"
                      ? "👤 Clientes"
                      : stat.tipo === "deposito"
                        ? "🏭 Depósitos"
                        : "🚚 Fletes"}
                  </h3>
                  <span className="text-2xl">
                    {stat.tipo === "cliente"
                      ? "💙"
                      : stat.tipo === "deposito"
                        ? "💚"
                        : "🧡"}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total usuarios:</span>
                    <span className="text-white font-medium">
                      {stat.totalUsuarios}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Con calificaciones:</span>
                    <span className="text-white font-medium">
                      {stat.usuariosConCalificaciones}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total reviews:</span>
                    <span className="text-white font-medium">
                      {stat.totalCalificaciones}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-600">
                    <span className="text-gray-400">Promedio:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 font-bold">
                        {stat.promedioGeneral > 0
                          ? stat.promedioGeneral.toFixed(1)
                          : "—"}
                      </span>
                      {stat.promedioGeneral > 0 && (
                        <span className="text-yellow-400">⭐</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros y Ranking */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>🏅</span> Ranking de Usuarios
            </h2>
            <div className="flex gap-2">
              {tiposUsuario.map((tipo) => (
                <button
                  key={tipo.value}
                  onClick={() => setFiltroTipo(tipo.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filtroTipo === tipo.value
                      ? tipo.value === "cliente"
                        ? "bg-blue-500 text-white"
                        : tipo.value === "deposito"
                          ? "bg-green-500 text-white"
                          : tipo.value === "flete"
                            ? "bg-orange-500 text-white"
                            : "bg-red-500 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          {rankingFiltrado.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-5xl mb-4">⭐</div>
              <p className="text-gray-400">
                No hay usuarios con calificaciones
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Las calificaciones aparecerán aquí cuando los usuarios se
                califiquen entre sí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {rankingFiltrado.map((usuario, index) => {
                const { distribucion, total, promedio } = getDistribucion(
                  usuario.calificaciones,
                );
                const esCalificacionBaja =
                  usuario.promedio < UMBRAL_CALIFICACION_BAJA &&
                  usuario.totalCalificaciones >= 2;
                return (
                  <div
                    key={usuario.id}
                    className={`p-4 hover:bg-gray-700/50 transition-colors ${esCalificacionBaja ? "bg-red-900/20 border-l-4 border-red-500" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Alerta de calificación baja */}
                      {esCalificacionBaja && (
                        <div
                          className="text-red-500 text-xl"
                          title="Calificación baja"
                        >
                          ⚠️
                        </div>
                      )}

                      {/* Posición */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          esCalificacionBaja
                            ? "bg-red-600 text-white"
                            : index === 0
                              ? "bg-yellow-500 text-yellow-900"
                              : index === 1
                                ? "bg-gray-300 text-gray-700"
                                : index === 2
                                  ? "bg-orange-600 text-orange-100"
                                  : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {index + 1}
                      </div>

                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                        {usuario.foto ? (
                          <img
                            src={usuario.foto}
                            alt={usuario.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {usuario.tipo === "cliente"
                              ? "👤"
                              : usuario.tipo === "deposito"
                                ? "🏭"
                                : "🚚"}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white truncate">
                            {usuario.nombre}
                          </h3>
                          <BadgeTipo tipo={usuario.tipo} />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={usuario.promedio} size="sm" />
                          <span className="text-gray-400 text-sm">
                            ({usuario.totalCalificaciones}{" "}
                            {usuario.totalCalificaciones === 1
                              ? "reseña"
                              : "reseñas"}
                            )
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${esCalificacionBaja ? "text-red-400" : "text-yellow-400"}`}
                        >
                          {usuario.promedio.toFixed(1)}
                        </div>
                        <div
                          className={`text-sm ${esCalificacionBaja ? "text-red-400" : "text-yellow-400"}`}
                        >
                          {esCalificacionBaja ? "⚠️ bajo" : "⭐ promedio"}
                        </div>
                      </div>

                      {/* Ver detalles */}
                      <button
                        onClick={() =>
                          setUsuarioSeleccionado(
                            usuarioSeleccionado?.id === usuario.id
                              ? null
                              : usuario,
                          )
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          usuarioSeleccionado?.id === usuario.id
                            ? "bg-red-500 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {usuarioSeleccionado?.id === usuario.id
                          ? "Ocultar"
                          : "Ver detalles"}
                      </button>
                    </div>

                    {/* Detalles expandidos */}
                    {usuarioSeleccionado?.id === usuario.id && (
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Distribución */}
                          <div>
                            <h4 className="font-medium text-gray-300 mb-3">
                              Distribución de calificaciones
                            </h4>
                            <RatingDistribution
                              ratings={usuario.calificaciones}
                              darkMode={true}
                            />
                          </div>

                          {/* Últimas reseñas */}
                          <div>
                            <h4 className="font-medium text-gray-300 mb-3">
                              Últimas reseñas
                            </h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                              {usuario.calificaciones
                                .slice()
                                .sort(
                                  (a, b) =>
                                    new Date(b.fecha) - new Date(a.fecha),
                                )
                                .slice(0, 5)
                                .map((cal) => (
                                  <div
                                    key={cal.id}
                                    className="bg-gray-700/50 rounded-lg p-3"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-gray-300">
                                        {cal.nombreCalificador}
                                      </span>
                                      <StarRating
                                        rating={cal.puntuacion}
                                        size="sm"
                                      />
                                    </div>
                                    {cal.comentario && (
                                      <p className="text-sm text-gray-400 italic">
                                        "{cal.comentario}"
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(cal.fecha).toLocaleDateString(
                                        "es-AR",
                                        {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        },
                                      )}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
