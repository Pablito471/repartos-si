import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import Icons from "@/components/Icons";
import { formatDate } from "@/utils/formatters";

export default function AdminDashboard() {
  const { getUsuariosVisibles } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const data = await getUsuariosVisibles();
        setUsuarios(data || []);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setUsuarios([]);
      } finally {
        setCargando(false);
      }
    };
    cargarUsuarios();
  }, [getUsuariosVisibles]);

  const stats = {
    totalUsuarios: usuarios.length,
    clientes: usuarios.filter((u) => u.tipoUsuario === "cliente").length,
    depositos: usuarios.filter((u) => u.tipoUsuario === "deposito").length,
    fletes: usuarios.filter((u) => u.tipoUsuario === "flete").length,
    activos: usuarios.filter((u) => !u.desactivado && u.activo !== false)
      .length,
    desactivados: usuarios.filter((u) => u.desactivado || u.activo === false)
      .length,
  };

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
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-semibold text-neutral-800 dark:text-white">
                Últimos Usuarios Registrados
              </h2>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-neutral-500 dark:text-neutral-400 text-sm">
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Nombre</th>
                      <th className="pb-3 font-medium">Tipo</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Registro</th>
                      <th className="pb-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {usuarios
                      .slice(-5)
                      .reverse()
                      .map((u) => (
                        <tr
                          key={u.id}
                          className="text-neutral-700 dark:text-neutral-300"
                        >
                          <td className="py-3 font-mono text-sm">{u.id}</td>
                          <td className="py-3">{u.nombre}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                u.tipoUsuario === "cliente"
                                  ? "bg-blue-900 text-blue-300"
                                  : u.tipoUsuario === "deposito"
                                    ? "bg-green-900 text-green-300"
                                    : "bg-orange-900 text-orange-300"
                              }`}
                            >
                              {u.tipoUsuario}
                            </span>
                          </td>
                          <td className="py-3 text-sm">{u.email}</td>
                          <td className="py-3 text-sm">
                            {formatDate(u.fechaRegistro)}
                          </td>
                          <td className="py-3">
                            {u.desactivado ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300">
                                Desactivado
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                                Activo
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/admin/usuarios"
              className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:border-primary-500 dark:hover:border-primary-600 transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <span className="text-4xl">👥</span>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Gestionar Usuarios
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    Ver, desactivar o eliminar cuentas
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/admin/desactivados"
              className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 hover:border-primary-500 dark:hover:border-primary-600 transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <span className="text-4xl">🚫</span>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Cuentas Desactivadas
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    Reactivar o eliminar permanentemente
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
