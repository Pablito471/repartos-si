import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatDateTime } from "@/utils/formatters";
import Swal from "sweetalert2";

export default function CuentasDesactivadas() {
  const { getUsuariosVisibles, reactivarCuenta, eliminarCuentaPermanente } =
    useAuth();
  const [busqueda, setBusqueda] = useState("");

  const usuarios = getUsuariosVisibles();

  // Filtrar solo usuarios desactivados
  const usuariosDesactivados = usuarios.filter((u) => u.desactivado);

  const usuariosFiltrados = usuariosDesactivados.filter((u) => {
    return (
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.id.toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  const handleReactivar = (usuario) => {
    Swal.fire({
      title: "¿Reactivar cuenta?",
      html: `
        <p>Vas a reactivar la cuenta de:</p>
        <p class="font-bold mt-2">${usuario.nombre}</p>
        <p class="text-sm text-gray-500">${usuario.email}</p>
        <p class="mt-4 text-green-600 text-sm">El usuario podrá volver a iniciar sesión.</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, reactivar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        const res = reactivarCuenta(usuario.id);
        if (res.success) {
          Swal.fire({
            icon: "success",
            title: "Cuenta reactivada",
            text: "El usuario puede iniciar sesión nuevamente",
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
            <p><strong>Desactivado:</strong> ${usuario.fechaDesactivacion ? formatDateTime(usuario.fechaDesactivacion) : "N/A"}</p>
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
      inputPlaceholder: `Escribe "ELIMINAR" para confirmar`,
      inputValidator: (value) => {
        if (value !== "ELIMINAR") {
          return 'Debes escribir "ELIMINAR" para confirmar';
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const res = eliminarCuentaPermanente(usuario.id);
        if (res.success) {
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            Cuentas Desactivadas
          </h1>
          <p className="text-gray-400 mt-1">
            Gestiona las cuentas que han sido desactivadas
          </p>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Buscar cuenta desactivada
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre, email o ID..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-red-900/30 rounded-xl p-6 border border-red-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-300 text-sm">Total Cuentas Desactivadas</p>
              <p className="text-4xl font-bold text-red-400">
                {usuariosDesactivados.length}
              </p>
            </div>
            <span className="text-6xl opacity-50">🚫</span>
          </div>
        </div>

        {/* Users List */}
        {usuariosFiltrados.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
            <span className="text-6xl mb-4 block">✅</span>
            <h3 className="text-xl font-semibold text-white">
              No hay cuentas desactivadas
            </h3>
            <p className="text-gray-400 mt-2">
              {busqueda
                ? "No se encontraron cuentas con ese criterio de búsqueda"
                : "Todas las cuentas están activas"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {usuariosFiltrados.map((usuario) => (
              <div
                key={usuario.id}
                className="bg-gray-800 rounded-xl p-6 border border-red-900/50"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-red-900/50 flex items-center justify-center text-2xl">
                      {getTipoIcon(usuario.tipoUsuario)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-white">
                          {usuario.nombre}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTipoColor(usuario.tipoUsuario)}`}
                        >
                          {usuario.tipoUsuario}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{usuario.email}</p>
                      <p className="text-gray-500 text-xs font-mono mt-1">
                        ID: {usuario.id}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-500 text-sm">Desactivado el:</p>
                    <p className="text-red-400 font-medium">
                      {usuario.fechaDesactivacion
                        ? formatDateTime(usuario.fechaDesactivacion)
                        : "Fecha no registrada"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleReactivar(usuario)}
                    className="flex-1 px-4 py-2 bg-green-900/50 text-green-400 rounded-lg hover:bg-green-900 transition-colors font-medium"
                  >
                    ✅ Reactivar cuenta
                  </button>
                  <button
                    onClick={() => handleEliminar(usuario)}
                    className="flex-1 px-4 py-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 transition-colors font-medium"
                  >
                    🗑️ Eliminar permanentemente
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div className="text-sm text-gray-400">
              <p>
                <strong className="text-green-400">Reactivar:</strong> Restaura
                el acceso del usuario. Podrá iniciar sesión nuevamente con sus
                credenciales originales.
              </p>
              <p className="mt-1">
                <strong className="text-red-400">Eliminar:</strong> Borra
                permanentemente la cuenta y todos sus datos. Esta acción NO se
                puede deshacer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
