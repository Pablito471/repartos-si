import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import Icons from "@/components/Icons";
import { formatDate, formatDateTime } from "@/utils/formatters";
import Link from "next/link";

export default function AdminDashboard() {
  const { getUsuariosVisibles, getEstadisticasCalificaciones, usuario } =
    useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [estadisticasCalif, setEstadisticasCalif] = useState({
    ranking: [],
    totalCalificaciones: 0,
    promedioGlobal: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [usuariosData, estadisticasData] = await Promise.all([
          getUsuariosVisibles(),
          getEstadisticasCalificaciones(),
        ]);
        setUsuarios(usuariosData || []);
        setEstadisticasCalif(
          estadisticasData || {
            ranking: [],
            totalCalificaciones: 0,
            promedioGlobal: 0,
          },
        );
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setUsuarios([]);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [getUsuariosVisibles, getEstadisticasCalificaciones]);

  const stats = useMemo(
    () => ({
      totalUsuarios: usuarios.length,
      clientes: usuarios.filter((u) => u.tipoUsuario === "cliente").length,
      depositos: usuarios.filter((u) => u.tipoUsuario === "deposito").length,
      fletes: usuarios.filter((u) => u.tipoUsuario === "flete").length,
      activos: usuarios.filter((u) => !u.desactivado && u.activo !== false)
        .length,
      desactivados: usuarios.filter((u) => u.desactivado || u.activo === false)
        .length,
    }),
    [usuarios],
  );

  // Usuarios con calificaciones bajas (promedio < 3)
  const usuariosEnAlerta = useMemo(() => {
    return estadisticasCalif.ranking
      .filter((u) => u.promedio < 3 && u.totalCalificaciones >= 2)
      .slice(0, 3);
  }, [estadisticasCalif.ranking]);

  // Usuarios nuevos (últimos 7 días)
  const usuariosNuevos = useMemo(() => {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    return usuarios.filter((u) => {
      const fechaRegistro = new Date(u.fechaRegistro);
      return fechaRegistro >= hace7Dias;
    });
  }, [usuarios]);

  return (
    <AdminLayout>
      {cargando ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">
              Panel de Administración
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Bienvenido al centro de control del sistema
            </p>
          </div>

          {/* Warning Banner */}
          <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <Icons.Alert className="w-8 h-8 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">
                  Zona de Administración
                </h3>
                <p className="text-red-700 dark:text-red-400 text-sm">
                  Las acciones realizadas aquí son irreversibles. Procede con
                  precaución.
                </p>
              </div>
            </div>
          </div>

          {/* Mi Perfil Admin */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800 dark:text-white flex items-center gap-2">
                <Icons.User className="w-5 h-5" />
                Mi Perfil
              </h3>
              <Link
                href="/admin/perfil"
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                Editar
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
                  {usuario?.foto ? (
                    <img
                      src={usuario.foto}
                      alt={usuario.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icons.User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Nombre
                  </p>
                  <p className="font-medium text-neutral-800 dark:text-white">
                    {usuario?.nombre || "-"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Email
                </p>
                <p className="font-medium text-neutral-800 dark:text-white truncate">
                  {usuario?.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Telefono
                </p>
                <p className="font-medium text-neutral-800 dark:text-white">
                  {usuario?.telefono || "No registrado"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Rol
                </p>
                <p className="font-medium text-neutral-800 dark:text-white capitalize">
                  {usuario?.tipoUsuario || "Administrador"}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Total Usuarios
                  </p>
                  <p className="text-3xl font-bold text-neutral-800 dark:text-white">
                    {stats.totalUsuarios}
                  </p>
                </div>
                <Icons.Users className="w-10 h-10 text-neutral-400 opacity-50" />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Cuentas Activas
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats.activos}
                  </p>
                </div>
                <Icons.CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Cuentas Desactivadas
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {stats.desactivados}
                  </p>
                </div>
                <Icons.Ban className="w-10 h-10 text-red-500 opacity-50" />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-300 text-sm">
                    Clientes
                  </p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                    {stats.clientes}
                  </p>
                </div>
                <Icons.User className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-6 border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-300 text-sm">
                    Depósitos
                  </p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                    {stats.depositos}
                  </p>
                </div>
                <Icons.Building className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-6 border border-orange-200 dark:border-orange-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 dark:text-orange-300 text-sm">
                    Transportistas
                  </p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                    {stats.fletes}
                  </p>
                </div>
                <Icons.Truck className="w-10 h-10 text-orange-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-white flex items-center gap-2">
                <Icons.Users className="w-5 h-5 text-primary-600" />
                Últimos Usuarios Registrados
              </h2>
              <Link
                href="/admin/usuarios"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Ver todos
              </Link>
            </div>
            <div className="p-4">
              {usuarios.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  <Icons.Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay usuarios registrados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-neutral-500 dark:text-neutral-400 text-sm border-b border-neutral-200 dark:border-neutral-700">
                        <th className="pb-3 font-medium">Usuario</th>
                        <th className="pb-3 font-medium">Tipo</th>
                        <th className="pb-3 font-medium hidden md:table-cell">
                          Email
                        </th>
                        <th className="pb-3 font-medium hidden sm:table-cell">
                          Registro
                        </th>
                        <th className="pb-3 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                      {usuarios
                        .slice(-8)
                        .reverse()
                        .map((u) => (
                          <tr
                            key={u.id}
                            className="text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                          >
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {u.foto ? (
                                    <img
                                      src={u.foto}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-sm">
                                      {u.tipoUsuario === "cliente"
                                        ? "👤"
                                        : u.tipoUsuario === "deposito"
                                          ? "🏪"
                                          : "🚚"}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-neutral-800 dark:text-white truncate">
                                    {u.nombre}
                                  </p>
                                  <p className="text-xs text-neutral-500 font-mono truncate">
                                    {u.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  u.tipoUsuario === "cliente"
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : u.tipoUsuario === "deposito"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                      : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                }`}
                              >
                                {u.tipoUsuario}
                              </span>
                            </td>
                            <td className="py-3 text-sm hidden md:table-cell truncate max-w-[200px]">
                              {u.email}
                            </td>
                            <td className="py-3 text-sm text-neutral-500 hidden sm:table-cell">
                              {formatDate(u.fechaRegistro)}
                            </td>
                            <td className="py-3">
                              {u.desactivado ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                  Desactivado
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                  Activo
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/usuarios"
              className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-600 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Gestionar Usuarios
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    {stats.activos} activos
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/desactivados"
              className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 hover:border-red-500 dark:hover:border-red-600 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                  <Icons.Ban className="w-6 h-6 text-red-600 dark:text-red-400" />
                  {stats.desactivados > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {stats.desactivados}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    Desactivados
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    {stats.desactivados} cuentas
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/calificaciones"
              className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 hover:border-yellow-500 dark:hover:border-yellow-600 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                  <Icons.Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  {usuariosEnAlerta.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      !
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                    Calificaciones
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    {estadisticasCalif.promedioGlobal?.toFixed(1) || "0.0"}{" "}
                    promedio
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/chat"
              className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700 hover:border-green-500 dark:hover:border-green-600 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icons.ChatMultiple className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    Chat Soporte
                  </h3>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Atender usuarios
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Alertas del Sistema */}
          {(usuariosEnAlerta.length > 0 ||
            stats.desactivados > 0 ||
            usuariosNuevos.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Usuarios con calificaciones bajas */}
              {usuariosEnAlerta.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
                      <Icons.Alert className="w-5 h-5" />
                      Usuarios en Alerta
                    </h3>
                    <Link
                      href="/admin/calificaciones"
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Ver todos
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {usuariosEnAlerta.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between bg-white dark:bg-neutral-800 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                            {u.tipo === "cliente"
                              ? "👤"
                              : u.tipo === "deposito"
                                ? "🏪"
                                : "🚚"}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-800 dark:text-white text-sm">
                              {u.nombre}
                            </p>
                            <p className="text-xs text-neutral-500 capitalize">
                              {u.tipo}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600 dark:text-red-400">
                            {u.promedio.toFixed(1)} ⭐
                          </p>
                          <p className="text-xs text-neutral-500">
                            {u.totalCalificaciones} reseñas
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Usuarios nuevos */}
              {usuariosNuevos.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      <Icons.User className="w-5 h-5" />
                      Nuevos Registros (7 días)
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                      +{usuariosNuevos.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {usuariosNuevos.slice(0, 4).map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between bg-white dark:bg-neutral-800 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              u.tipoUsuario === "cliente"
                                ? "bg-blue-500"
                                : u.tipoUsuario === "deposito"
                                  ? "bg-green-500"
                                  : "bg-orange-500"
                            }`}
                          ></div>
                          <div>
                            <p className="font-medium text-neutral-800 dark:text-white text-sm">
                              {u.nombre}
                            </p>
                            <p className="text-xs text-neutral-500 capitalize">
                              {u.tipoUsuario}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {formatDate(u.fechaRegistro)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
