import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatDateTime } from "@/utils/formatters";
import Swal from "sweetalert2";
import Icons from "@/components/Icons";
import Link from "next/link";

export default function CuentasDesactivadas() {
  const { getUsuariosVisibles, reactivarCuenta, eliminarCuentaPermanente } =
    useAuth();
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionados, setSeleccionados] = useState([]);

  useEffect(() => {
    const cargarUsuarios = async () => {
      const data = await getUsuariosVisibles();
      setUsuarios(data || []);
      setCargando(false);
    };
    cargarUsuarios();
  }, [getUsuariosVisibles]);

  // Filtrar solo usuarios desactivados
  const usuariosDesactivados = useMemo(
    () => usuarios.filter((u) => u.desactivado),
    [usuarios],
  );

  const usuariosFiltrados = useMemo(() => {
    return usuariosDesactivados
      .filter((u) => {
        const textoBusqueda = busqueda.toLowerCase();
        const cumpleBusqueda =
          u.nombre?.toLowerCase().includes(textoBusqueda) ||
          u.email?.toLowerCase().includes(textoBusqueda) ||
          u.id?.toLowerCase().includes(textoBusqueda);
        const cumpleFiltro =
          filtroTipo === "todos" || u.tipoUsuario === filtroTipo;
        return cumpleBusqueda && cumpleFiltro;
      })
      .sort((a, b) => {
        // Ordenar por fecha de desactivación (más recientes primero)
        const fechaA = new Date(a.fechaDesactivacion || 0);
        const fechaB = new Date(b.fechaDesactivacion || 0);
        return fechaB - fechaA;
      });
  }, [usuariosDesactivados, busqueda, filtroTipo]);

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const seleccionarTodos = () => {
    if (seleccionados.length === usuariosFiltrados.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(usuariosFiltrados.map((u) => u.id));
    }
  };

  const handleReactivarMultiple = async () => {
    if (seleccionados.length === 0) return;

    const result = await Swal.fire({
      title: `¿Reactivar ${seleccionados.length} cuentas?`,
      text: "Todos los usuarios seleccionados podrán volver a iniciar sesión.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Sí, reactivar ${seleccionados.length}`,
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      let exitosos = 0;
      for (const id of seleccionados) {
        const res = await reactivarCuenta(id);
        if (res.success) exitosos++;
      }

      const data = await getUsuariosVisibles();
      setUsuarios(data || []);
      setSeleccionados([]);

      Swal.fire({
        icon: "success",
        title: "Cuentas reactivadas",
        text: `Se reactivaron ${exitosos} de ${seleccionados.length} cuentas`,
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

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
    }).then(async (result) => {
      if (result.isConfirmed) {
        const res = await reactivarCuenta(usuario.id);
        if (res.success) {
          // Recargar usuarios después de reactivar
          const data = await getUsuariosVisibles();
          setUsuarios(data || []);
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
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "deposito":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "flete":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
      default:
        return "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300";
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-white">
              Cuentas Desactivadas
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Gestiona las cuentas que han sido desactivadas
            </p>
          </div>
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Icons.Users className="w-4 h-4" />
            Ver usuarios activos
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
                  Total Desactivadas
                </p>
                <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-300">
                  {usuariosDesactivados.length}
                </p>
              </div>
              <Icons.Ban className="w-8 h-8 text-red-500/50 hidden sm:block" />
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-blue-600 dark:text-blue-300 text-xs sm:text-sm">
              Clientes
            </p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
              {
                usuariosDesactivados.filter((u) => u.tipoUsuario === "cliente")
                  .length
              }
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <p className="text-green-600 dark:text-green-300 text-xs sm:text-sm">
              Depósitos
            </p>
            <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">
              {
                usuariosDesactivados.filter((u) => u.tipoUsuario === "deposito")
                  .length
              }
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <p className="text-orange-600 dark:text-orange-300 text-xs sm:text-sm">
              Transportistas
            </p>
            <p className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-400">
              {
                usuariosDesactivados.filter((u) => u.tipoUsuario === "flete")
                  .length
              }
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Buscar cuenta desactivada
              </label>
              <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-800 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Tipo de usuario
              </label>
              <select
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="todos">Todos los tipos</option>
                <option value="cliente">Clientes</option>
                <option value="deposito">Depósitos</option>
                <option value="flete">Transportistas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Acciones masivas */}
        {seleccionados.length > 0 && (
          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-primary-700 dark:text-primary-300 font-medium">
              {seleccionados.length} cuenta{seleccionados.length > 1 ? "s" : ""}{" "}
              seleccionada{seleccionados.length > 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSeleccionados([])}
                className="px-3 py-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReactivarMultiple}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Icons.CheckCircle className="w-4 h-4" />
                Reactivar seleccionadas
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        {usuariosFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-12 border border-neutral-200 dark:border-neutral-700 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Icons.CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-800 dark:text-white">
              {busqueda || filtroTipo !== "todos"
                ? "Sin resultados"
                : "No hay cuentas desactivadas"}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2">
              {busqueda || filtroTipo !== "todos"
                ? "No se encontraron cuentas con ese criterio de búsqueda"
                : "Todas las cuentas están activas actualmente"}
            </p>
            {(busqueda || filtroTipo !== "todos") && (
              <button
                onClick={() => {
                  setBusqueda("");
                  setFiltroTipo("todos");
                }}
                className="mt-4 text-primary-600 dark:text-primary-400 hover:underline text-sm"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Seleccionar todos */}
            <div className="flex items-center gap-3 px-2">
              <button
                onClick={seleccionarTodos}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                {seleccionados.length === usuariosFiltrados.length
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </button>
              <span className="text-neutral-400 text-sm">
                ({usuariosFiltrados.length} cuenta
                {usuariosFiltrados.length !== 1 ? "s" : ""})
              </span>
            </div>

            {usuariosFiltrados.map((usuario) => (
              <div
                key={usuario.id}
                className={`bg-white dark:bg-neutral-800 rounded-xl p-4 sm:p-5 border transition-all ${
                  seleccionados.includes(usuario.id)
                    ? "border-primary-500 dark:border-primary-600 ring-1 ring-primary-500/20"
                    : "border-red-200 dark:border-red-900/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox de selección */}
                  <button
                    onClick={() => toggleSeleccion(usuario.id)}
                    className={`w-5 h-5 mt-1 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      seleccionados.includes(usuario.id)
                        ? "bg-primary-600 border-primary-600"
                        : "border-neutral-300 dark:border-neutral-600 hover:border-primary-500"
                    }`}
                  >
                    {seleccionados.includes(usuario.id) && (
                      <Icons.Check className="w-3 h-3 text-white" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
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
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-neutral-800 dark:text-white truncate">
                              {usuario.nombre}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTipoColor(usuario.tipoUsuario)}`}
                            >
                              {usuario.tipoUsuario}
                            </span>
                          </div>
                          <p className="text-neutral-500 dark:text-neutral-400 text-sm truncate">
                            {usuario.email}
                          </p>
                          <p className="text-neutral-400 text-xs font-mono mt-0.5">
                            ID: {usuario.id}
                          </p>
                        </div>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-neutral-500 text-xs">
                          Desactivado el:
                        </p>
                        <p className="text-red-600 dark:text-red-400 font-medium text-sm">
                          {usuario.fechaDesactivacion
                            ? formatDateTime(usuario.fechaDesactivacion)
                            : "Fecha no registrada"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleReactivar(usuario)}
                        className="flex-1 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Icons.CheckCircle className="w-4 h-4" />
                        Reactivar cuenta
                      </button>
                      <button
                        onClick={() => handleEliminar(usuario)}
                        className="flex-1 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <Icons.Trash className="w-4 h-4" />
                        Eliminar permanentemente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start space-x-3">
            <Icons.Alert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <p>
                <strong className="text-green-600 dark:text-green-400">
                  Reactivar:
                </strong>{" "}
                Restaura el acceso del usuario. Podrá iniciar sesión nuevamente
                con sus credenciales originales.
              </p>
              <p className="mt-1">
                <strong className="text-red-600 dark:text-red-400">
                  Eliminar:
                </strong>{" "}
                Borra permanentemente la cuenta y todos sus datos. Esta acción
                NO se puede deshacer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
