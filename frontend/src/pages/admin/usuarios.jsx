import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/formatters";
import Swal from "sweetalert2";

export default function GestionUsuarios() {
  const { getUsuariosVisibles, desactivarCuenta, eliminarCuentaPermanente } =
    useAuth();
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarUsuarios = async () => {
      const data = await getUsuariosVisibles();
      setUsuarios(data || []);
      setCargando(false);
    };
    cargarUsuarios();
  }, [getUsuariosVisibles]);

  // Filtrar solo usuarios activos
  const usuariosActivos = usuarios.filter((u) => !u.desactivado);

  const usuariosFiltrados = usuariosActivos.filter((u) => {
    const cumpleFiltro = filtroTipo === "todos" || u.tipoUsuario === filtroTipo;
    const cumpleBusqueda =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.id.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleFiltro && cumpleBusqueda;
  });

  const handleDesactivar = (usuario) => {
    Swal.fire({
      title: "¿Desactivar cuenta?",
      html: `
        <p>Vas a desactivar la cuenta de:</p>
        <p class="font-bold mt-2">${usuario.nombre}</p>
        <p class="text-sm text-gray-500">${usuario.email}</p>
        <p class="mt-4 text-yellow-600 text-sm">El usuario no podrá iniciar sesión, pero sus datos se conservarán.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await desactivarCuenta(usuario.id);
        if (res.success) {
          // Recargar usuarios después de desactivar
          const data = await getUsuariosVisibles();
          setUsuarios(data || []);
          Swal.fire({
            icon: "success",
            title: "Cuenta desactivada",
            text: "El usuario ya no puede iniciar sesión",
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.error,
          });
        }
      }
    });
  };

  const handleEliminar = (usuario) => {
    Swal.fire({
      title: "⚠️ ELIMINAR PERMANENTEMENTE",
      html: `
        <div class="text-left">
          <p class="text-red-600 font-bold">¡ATENCIÓN! Esta acción es IRREVERSIBLE</p>
          <p class="mt-2">Vas a eliminar permanentemente:</p>
          <div class="bg-gray-100 p-3 rounded mt-2">
            <p><strong>ID:</strong> ${usuario.id}</p>
            <p><strong>Nombre:</strong> ${usuario.nombre}</p>
            <p><strong>Email:</strong> ${usuario.email}</p>
            <p><strong>Tipo:</strong> ${usuario.tipoUsuario}</p>
          </div>
          <p class="mt-4 text-red-600 text-sm">Todos los datos del usuario serán eliminados para siempre.</p>
        </div>
      `,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ELIMINAR PERMANENTEMENTE",
      cancelButtonText: "Cancelar",
      input: "text",
      inputPlaceholder: `Escribe "${usuario.id}" para confirmar`,
      inputValidator: (value) => {
        if (value !== usuario.id) {
          return "Debes escribir el ID exacto para confirmar";
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await eliminarCuentaPermanente(usuario.id);
        if (res.success) {
          // Recargar usuarios después de eliminar
          const data = await getUsuariosVisibles();
          setUsuarios(data || []);
          Swal.fire({
            icon: "success",
            title: "Cuenta eliminada",
            text: "La cuenta ha sido eliminada permanentemente",
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.error,
          });
        }
      }
    });
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "cliente":
        return "bg-blue-900 text-blue-300";
      case "deposito":
        return "bg-green-900 text-green-300";
      case "flete":
        return "bg-orange-900 text-orange-300";
      default:
        return "bg-gray-700 text-gray-300";
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "cliente":
        return "👤";
      case "deposito":
        return "🏪";
      case "flete":
        return "🚚";
      default:
        return "❓";
    }
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
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-gray-400 mt-1">
            Administra las cuentas de usuarios activos
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre, email o ID..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Tipo de usuario
              </label>
              <select
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="cliente">Clientes</option>
                <option value="deposito">Depósitos</option>
                <option value="flete">Transportistas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Activos</p>
            <p className="text-2xl font-bold text-white">
              {usuariosActivos.length}
            </p>
          </div>
          <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700">
            <p className="text-blue-300 text-sm">Clientes</p>
            <p className="text-2xl font-bold text-blue-400">
              {
                usuariosActivos.filter((u) => u.tipoUsuario === "cliente")
                  .length
              }
            </p>
          </div>
          <div className="bg-green-900/30 rounded-lg p-4 border border-green-700">
            <p className="text-green-300 text-sm">Depósitos</p>
            <p className="text-2xl font-bold text-green-400">
              {
                usuariosActivos.filter((u) => u.tipoUsuario === "deposito")
                  .length
              }
            </p>
          </div>
          <div className="bg-orange-900/30 rounded-lg p-4 border border-orange-700">
            <p className="text-orange-300 text-sm">Transportistas</p>
            <p className="text-2xl font-bold text-orange-400">
              {usuariosActivos.filter((u) => u.tipoUsuario === "flete").length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="p-4 font-medium">Usuario</th>
                  <th className="p-4 font-medium">Tipo</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Registro</th>
                  <th className="p-4 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-700/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold overflow-hidden">
                            {usuario.foto ? (
                              <img
                                src={usuario.foto}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getTipoIcon(usuario.tipoUsuario)
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {usuario.nombre}
                            </p>
                            <p className="text-gray-500 text-sm font-mono">
                              {usuario.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(usuario.tipoUsuario)}`}
                        >
                          {usuario.tipoUsuario}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">{usuario.email}</td>
                      <td className="p-4 text-gray-400 text-sm">
                        {formatDate(usuario.fechaRegistro)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleDesactivar(usuario)}
                            className="px-3 py-1.5 bg-yellow-900/50 text-yellow-400 rounded-lg text-sm hover:bg-yellow-900 transition-colors"
                            title="Desactivar cuenta"
                          >
                            🚫 Desactivar
                          </button>
                          <button
                            onClick={() => handleEliminar(usuario)}
                            className="px-3 py-1.5 bg-red-900/50 text-red-400 rounded-lg text-sm hover:bg-red-900 transition-colors"
                            title="Eliminar permanentemente"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div className="text-sm text-gray-400">
              <p>
                <strong className="text-yellow-400">Desactivar:</strong> El
                usuario no podrá iniciar sesión pero sus datos se conservan.
                Puedes reactivar la cuenta más tarde.
              </p>
              <p className="mt-1">
                <strong className="text-red-400">Eliminar:</strong> Borra
                permanentemente la cuenta y todos sus datos. Esta acción es
                IRREVERSIBLE.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
