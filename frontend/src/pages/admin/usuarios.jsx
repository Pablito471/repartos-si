import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/formatters";
import Swal from "sweetalert2";
import Icons from "@/components/Icons";
import Link from "next/link";

const ITEMS_POR_PAGINA = 10;

export default function GestionUsuarios() {
  const { getUsuariosVisibles, desactivarCuenta, eliminarCuentaPermanente } =
    useAuth();
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ordenarPor, setOrdenarPor] = useState("fechaRegistro");
  const [ordenAsc, setOrdenAsc] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [usuarioExpandido, setUsuarioExpandido] = useState(null);

  useEffect(() => {
    const cargarUsuarios = async () => {
      const data = await getUsuariosVisibles();
      setUsuarios(data || []);
      setCargando(false);
    };
    cargarUsuarios();
  }, [getUsuariosVisibles]);

  // Filtrar solo usuarios activos
  const usuariosActivos = useMemo(
    () => usuarios.filter((u) => !u.desactivado),
    [usuarios],
  );

  const usuariosFiltrados = useMemo(() => {
    let filtrados = usuariosActivos.filter((u) => {
      const cumpleFiltro =
        filtroTipo === "todos" || u.tipoUsuario === filtroTipo;
      const textoBusqueda = busqueda.toLowerCase();
      const cumpleBusqueda =
        u.nombre?.toLowerCase().includes(textoBusqueda) ||
        u.email?.toLowerCase().includes(textoBusqueda) ||
        u.id?.toLowerCase().includes(textoBusqueda) ||
        u.telefono?.toLowerCase().includes(textoBusqueda);
      return cumpleFiltro && cumpleBusqueda;
    });

    // Ordenar
    filtrados.sort((a, b) => {
      let valorA = a[ordenarPor];
      let valorB = b[ordenarPor];

      if (ordenarPor === "fechaRegistro") {
        valorA = new Date(valorA || 0);
        valorB = new Date(valorB || 0);
      } else if (typeof valorA === "string") {
        valorA = valorA?.toLowerCase() || "";
        valorB = valorB?.toLowerCase() || "";
      }

      if (valorA < valorB) return ordenAsc ? -1 : 1;
      if (valorA > valorB) return ordenAsc ? 1 : -1;
      return 0;
    });

    return filtrados;
  }, [usuariosActivos, filtroTipo, busqueda, ordenarPor, ordenAsc]);

  // Paginación
  const totalPaginas = Math.ceil(usuariosFiltrados.length / ITEMS_POR_PAGINA);
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return usuariosFiltrados.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [usuariosFiltrados, paginaActual]);

  // Reset página cuando cambian filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTipo, busqueda]);

  const handleSort = (campo) => {
    if (ordenarPor === campo) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenarPor(campo);
      setOrdenAsc(true);
    }
  };

  const SortIcon = ({ campo }) => {
    if (ordenarPor !== campo)
      return <Icons.ChevronDown className="w-4 h-4 opacity-30" />;
    return ordenAsc ? (
      <Icons.ChevronUp className="w-4 h-4" />
    ) : (
      <Icons.ChevronDown className="w-4 h-4" />
    );
  };

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
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "deposito":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "flete":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
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
              Gestión de Usuarios
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Administra las cuentas de usuarios activos
            </p>
          </div>
          <Link
            href="/admin/desactivados"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Icons.Ban className="w-4 h-4" />
            Ver desactivados ({usuarios.filter((u) => u.desactivado).length})
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Buscar usuario
              </label>
              <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, ID o teléfono..."
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm">
                  Total Activos
                </p>
                <p className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-white">
                  {usuariosActivos.length}
                </p>
              </div>
              <Icons.Users className="w-8 h-8 text-neutral-400 opacity-50 hidden sm:block" />
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-300 text-xs sm:text-sm">
                  Clientes
                </p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {
                    usuariosActivos.filter((u) => u.tipoUsuario === "cliente")
                      .length
                  }
                </p>
              </div>
              <span className="text-2xl hidden sm:block">👤</span>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-300 text-xs sm:text-sm">
                  Depósitos
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">
                  {
                    usuariosActivos.filter((u) => u.tipoUsuario === "deposito")
                      .length
                  }
                </p>
              </div>
              <span className="text-2xl hidden sm:block">🏪</span>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-300 text-xs sm:text-sm">
                  Transportistas
                </p>
                <p className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {
                    usuariosActivos.filter((u) => u.tipoUsuario === "flete")
                      .length
                  }
                </p>
              </div>
              <span className="text-2xl hidden sm:block">🚚</span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Resultados info */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Mostrando{" "}
              <span className="font-medium text-neutral-800 dark:text-white">
                {usuariosPaginados.length}
              </span>{" "}
              de{" "}
              <span className="font-medium text-neutral-800 dark:text-white">
                {usuariosFiltrados.length}
              </span>{" "}
              usuarios
            </p>
            {busqueda || filtroTipo !== "todos" ? (
              <button
                onClick={() => {
                  setBusqueda("");
                  setFiltroTipo("todos");
                }}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                <tr className="text-left text-neutral-600 dark:text-neutral-400 text-sm">
                  <th
                    className="p-4 font-medium cursor-pointer hover:text-neutral-800 dark:hover:text-white transition-colors"
                    onClick={() => handleSort("nombre")}
                  >
                    <div className="flex items-center gap-1">
                      Usuario
                      <SortIcon campo="nombre" />
                    </div>
                  </th>
                  <th
                    className="p-4 font-medium cursor-pointer hover:text-neutral-800 dark:hover:text-white transition-colors"
                    onClick={() => handleSort("tipoUsuario")}
                  >
                    <div className="flex items-center gap-1">
                      Tipo
                      <SortIcon campo="tipoUsuario" />
                    </div>
                  </th>
                  <th className="p-4 font-medium hidden lg:table-cell">
                    Email
                  </th>
                  <th
                    className="p-4 font-medium cursor-pointer hover:text-neutral-800 dark:hover:text-white transition-colors hidden md:table-cell"
                    onClick={() => handleSort("fechaRegistro")}
                  >
                    <div className="flex items-center gap-1">
                      Registro
                      <SortIcon campo="fechaRegistro" />
                    </div>
                  </th>
                  <th className="p-4 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                {usuariosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center">
                      <Icons.Users className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                      <p className="text-neutral-500 dark:text-neutral-400">
                        No se encontraron usuarios
                      </p>
                      {(busqueda || filtroTipo !== "todos") && (
                        <button
                          onClick={() => {
                            setBusqueda("");
                            setFiltroTipo("todos");
                          }}
                          className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  usuariosPaginados.map((usuario) => (
                    <>
                      <tr
                        key={usuario.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer transition-colors"
                        onClick={() =>
                          setUsuarioExpandido(
                            usuarioExpandido === usuario.id ? null : usuario.id,
                          )
                        }
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
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
                              <p className="font-medium text-neutral-800 dark:text-white truncate">
                                {usuario.nombre}
                              </p>
                              <p className="text-neutral-500 text-xs font-mono truncate">
                                {usuario.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTipoColor(usuario.tipoUsuario)}`}
                          >
                            {usuario.tipoUsuario}
                          </span>
                        </td>
                        <td className="p-4 text-neutral-600 dark:text-neutral-300 text-sm hidden lg:table-cell truncate max-w-[200px]">
                          {usuario.email}
                        </td>
                        <td className="p-4 text-neutral-500 text-sm hidden md:table-cell">
                          {formatDate(usuario.fechaRegistro)}
                        </td>
                        <td
                          className="p-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDesactivar(usuario)}
                              className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                              title="Desactivar cuenta"
                            >
                              <Icons.Ban className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEliminar(usuario)}
                              className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                              title="Eliminar permanentemente"
                            >
                              <Icons.Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Fila expandida con detalles */}
                      {usuarioExpandido === usuario.id && (
                        <tr key={`${usuario.id}-details`}>
                          <td
                            colSpan="5"
                            className="bg-neutral-50 dark:bg-neutral-900/50 p-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">
                                  Email
                                </p>
                                <p className="text-sm text-neutral-800 dark:text-white">
                                  {usuario.email}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">
                                  Teléfono
                                </p>
                                <p className="text-sm text-neutral-800 dark:text-white">
                                  {usuario.telefono || "No registrado"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">
                                  Dirección
                                </p>
                                <p className="text-sm text-neutral-800 dark:text-white">
                                  {usuario.direccion || "No registrada"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">
                                  Fecha de registro
                                </p>
                                <p className="text-sm text-neutral-800 dark:text-white">
                                  {formatDate(usuario.fechaRegistro)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500 mb-1">
                                  ID del usuario
                                </p>
                                <p className="text-sm font-mono text-neutral-800 dark:text-white">
                                  {usuario.id}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <button
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <Icons.ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pagina;
                  if (totalPaginas <= 5) {
                    pagina = i + 1;
                  } else if (paginaActual <= 3) {
                    pagina = i + 1;
                  } else if (paginaActual >= totalPaginas - 2) {
                    pagina = totalPaginas - 4 + i;
                  } else {
                    pagina = paginaActual - 2 + i;
                  }
                  return (
                    <button
                      key={pagina}
                      onClick={() => setPaginaActual(pagina)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        paginaActual === pagina
                          ? "bg-primary-600 text-white"
                          : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                      }`}
                    >
                      {pagina}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() =>
                  setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                }
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Siguiente
                <Icons.ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start space-x-3">
            <Icons.Alert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <p>
                <strong className="text-amber-800 dark:text-amber-200">
                  Desactivar:
                </strong>{" "}
                El usuario no podrá iniciar sesión pero sus datos se conservan.
                Puedes reactivar la cuenta más tarde.
              </p>
              <p className="mt-1">
                <strong className="text-red-600 dark:text-red-400">
                  Eliminar:
                </strong>{" "}
                Borra permanentemente la cuenta y todos sus datos. Esta acción
                es IRREVERSIBLE.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
