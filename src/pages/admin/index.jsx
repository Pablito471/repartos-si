import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/formatters";

export default function AdminDashboard() {
  const { getUsuariosVisibles } = useAuth();

  const usuarios = getUsuariosVisibles();

  const stats = {
    totalUsuarios: usuarios.length,
    clientes: usuarios.filter((u) => u.tipoUsuario === "cliente").length,
    depositos: usuarios.filter((u) => u.tipoUsuario === "deposito").length,
    fletes: usuarios.filter((u) => u.tipoUsuario === "flete").length,
    activos: usuarios.filter((u) => !u.desactivado).length,
    desactivados: usuarios.filter((u) => u.desactivado).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            Panel de Administración
          </h1>
          <p className="text-gray-400 mt-1">
            Bienvenido al centro de control del sistema
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-900/50 border border-red-700 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-300">
                Zona de Administración
              </h3>
              <p className="text-red-400 text-sm">
                Las acciones realizadas aquí son irreversibles. Procede con
                precaución.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Usuarios</p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalUsuarios}
                </p>
              </div>
              <span className="text-4xl opacity-50">👥</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Cuentas Activas</p>
                <p className="text-3xl font-bold text-green-400">
                  {stats.activos}
                </p>
              </div>
              <span className="text-4xl opacity-50">✅</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Cuentas Desactivadas</p>
                <p className="text-3xl font-bold text-red-400">
                  {stats.desactivados}
                </p>
              </div>
              <span className="text-4xl opacity-50">🚫</span>
            </div>
          </div>

          <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Clientes</p>
                <p className="text-3xl font-bold text-blue-400">
                  {stats.clientes}
                </p>
              </div>
              <span className="text-4xl opacity-50">👤</span>
            </div>
          </div>

          <div className="bg-green-900/30 rounded-xl p-6 border border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Depósitos</p>
                <p className="text-3xl font-bold text-green-400">
                  {stats.depositos}
                </p>
              </div>
              <span className="text-4xl opacity-50">🏪</span>
            </div>
          </div>

          <div className="bg-orange-900/30 rounded-xl p-6 border border-orange-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm">Transportistas</p>
                <p className="text-3xl font-bold text-orange-400">
                  {stats.fletes}
                </p>
              </div>
              <span className="text-4xl opacity-50">🚚</span>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">
              Últimos Usuarios Registrados
            </h2>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Tipo</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Registro</th>
                    <th className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {usuarios
                    .slice(-5)
                    .reverse()
                    .map((u) => (
                      <tr key={u.id} className="text-gray-300">
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
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-red-600 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <span className="text-4xl">👥</span>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                  Gestionar Usuarios
                </h3>
                <p className="text-gray-400 text-sm">
                  Ver, desactivar o eliminar cuentas
                </p>
              </div>
            </div>
          </a>

          <a
            href="/admin/desactivados"
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-red-600 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <span className="text-4xl">🚫</span>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                  Cuentas Desactivadas
                </h3>
                <p className="text-gray-400 text-sm">
                  Reactivar o eliminar permanentemente
                </p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </AdminLayout>
  );
}
