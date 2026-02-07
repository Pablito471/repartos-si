import { useState, useEffect } from "react";
import DepositoLayout from "@/components/layouts/DepositoLayout";
import { empleadosAPI } from "@/services/api";
import Swal from "sweetalert2";

export default function EmpleadosDeposito() {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
  });

  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);
  const [vistaActual, setVistaActual] = useState("lista"); // "lista" o "estadisticas"
  const [filtroFechas, setFiltroFechas] = useState({
    desde: "",
    hasta: "",
  });

  useEffect(() => {
    cargarEmpleados();
  }, []);

  useEffect(() => {
    if (vistaActual === "estadisticas") {
      cargarEstadisticas();
    }
  }, [vistaActual, filtroFechas]);

  const cargarEmpleados = async () => {
    try {
      setCargando(true);
      const res = await empleadosAPI.listar();
      setEmpleados(res.data || []);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los empleados",
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      setCargandoEstadisticas(true);
      const res = await empleadosAPI.obtenerEstadisticas(
        filtroFechas.desde,
        filtroFechas.hasta,
      );
      setEstadisticas(res.data?.data || null);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setCargandoEstadisticas(false);
    }
  };

  const abrirModal = (empleado = null) => {
    if (empleado) {
      setEmpleadoEditando(empleado);
      setForm({
        nombre: empleado.nombre,
        email: empleado.email,
        password: "",
        telefono: empleado.telefono || "",
      });
    } else {
      setEmpleadoEditando(null);
      setForm({
        nombre: "",
        email: "",
        password: "",
        telefono: "",
      });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEmpleadoEditando(null);
    setForm({ nombre: "", email: "", password: "", telefono: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (empleadoEditando) {
        // Actualizar
        await empleadosAPI.actualizar(empleadoEditando.id, {
          nombre: form.nombre,
          telefono: form.telefono,
        });
        // Si hay nueva contraseña, actualizarla
        if (form.password) {
          await empleadosAPI.cambiarPassword(
            empleadoEditando.id,
            form.password,
          );
        }
        Swal.fire({
          icon: "success",
          title: "Empleado actualizado",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // Crear
        if (!form.password) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "La contraseña es requerida para nuevos empleados",
          });
          setGuardando(false);
          return;
        }
        await empleadosAPI.crear(form);
        Swal.fire({
          icon: "success",
          title: "Empleado creado",
          text: "El empleado ya puede acceder con su email y contraseña",
          timer: 2000,
          showConfirmButton: false,
        });
      }
      cerrarModal();
      cargarEmpleados();
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "No se pudo guardar el empleado",
      });
    } finally {
      setGuardando(false);
    }
  };

  const toggleEmpleado = async (empleado) => {
    try {
      await empleadosAPI.toggle(empleado.id);
      Swal.fire({
        icon: "success",
        title: empleado.activo ? "Empleado desactivado" : "Empleado activado",
        timer: 1500,
        showConfirmButton: false,
      });
      cargarEmpleados();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cambiar el estado del empleado",
      });
    }
  };

  const eliminarEmpleado = async (empleado) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar empleado?",
      text: `¿Estás seguro de eliminar a ${empleado.nombre}?`,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await empleadosAPI.eliminar(empleado.id);
        Swal.fire({
          icon: "success",
          title: "Empleado eliminado",
          timer: 1500,
          showConfirmButton: false,
        });
        cargarEmpleados();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el empleado",
        });
      }
    }
  };

  return (
    <DepositoLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Empleados
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona los empleados de tu depósito. Solo pueden vender por
              escáner.
            </p>
          </div>
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-xl">+</span>
            Agregar Empleado
          </button>
        </div>

        {/* Tabs de navegación */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setVistaActual("lista")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              vistaActual === "lista"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            👥 Lista de Empleados
          </button>
          <button
            onClick={() => setVistaActual("estadisticas")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              vistaActual === "estadisticas"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            📊 Estadísticas de Ventas
          </button>
        </div>

        {vistaActual === "estadisticas" ? (
          // Vista de estadísticas
          <div>
            {/* Filtros de fecha */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={filtroFechas.desde}
                    onChange={(e) =>
                      setFiltroFechas({
                        ...filtroFechas,
                        desde: e.target.value,
                      })
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={filtroFechas.hasta}
                    onChange={(e) =>
                      setFiltroFechas({
                        ...filtroFechas,
                        hasta: e.target.value,
                      })
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => setFiltroFechas({ desde: "", hasta: "" })}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            {cargandoEstadisticas ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : estadisticas ? (
              <>
                {/* Resumen general */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Empleados
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {estadisticas.resumen?.totalEmpleados || 0}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Empleados Activos
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {estadisticas.resumen?.empleadosActivos || 0}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Ventas
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      $
                      {(
                        estadisticas.resumen?.totalVentas || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Transacciones
                    </p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {estadisticas.resumen?.totalTransacciones || 0}
                    </p>
                  </div>
                </div>

                {/* Tabla de estadísticas por empleado */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Ventas por Empleado
                    </h3>
                  </div>
                  {estadisticas.empleados?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              Empleado
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                              Estado
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                              Ventas
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                              Total
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                              Última Venta
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {estadisticas.empleados.map((emp) => (
                            <tr
                              key={emp.empleado.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <span className="text-sm">👤</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {emp.empleado.nombre}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {emp.empleado.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    emp.empleado.activo
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  }`}
                                >
                                  {emp.empleado.activo ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                {emp.cantidadVentas}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                                ${emp.totalVentas.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                                {emp.ultimaVenta
                                  ? new Date(
                                      emp.ultimaVenta,
                                    ).toLocaleDateString()
                                  : "Sin ventas"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No hay datos de ventas para mostrar
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                <span className="text-4xl mb-4 block">📊</span>
                <p className="text-gray-500 dark:text-gray-400">
                  No hay estadísticas disponibles
                </p>
              </div>
            )}
          </div>
        ) : (
          // Vista de lista (contenido original)
          <>
            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    ¿Qué pueden hacer los empleados?
                  </h3>
                  <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Vender productos usando el escáner</li>
                    <li>• Ver el inventario disponible</li>
                    <li className="text-red-600 dark:text-red-400">
                      • NO pueden ver la contabilidad
                    </li>
                    <li className="text-red-600 dark:text-red-400">
                      • NO pueden modificar el stock ni inventario
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Lista de empleados */}
            {cargando ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : empleados.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                <span className="text-6xl mb-4 block">👥</span>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No tienes empleados registrados
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Agrega empleados para que puedan vender por escáner sin acceso
                  a tu contabilidad.
                </p>
                <button
                  onClick={() => abrirModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Agregar primer empleado
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {empleados.map((empleado) => (
                  <div
                    key={empleado.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 border ${
                      empleado.activo
                        ? "border-gray-200 dark:border-gray-700"
                        : "border-red-200 dark:border-red-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-xl">👤</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {empleado.nombre}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {empleado.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          empleado.activo
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {empleado.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    {empleado.telefono && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        📱 {empleado.telefono}
                      </p>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => abrirModal(empleado)}
                        className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleEmpleado(empleado)}
                        className={`flex-1 text-sm py-2 rounded-lg transition-colors ${
                          empleado.activo
                            ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-400"
                            : "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400"
                        }`}
                      >
                        {empleado.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => eliminarEmpleado(empleado)}
                        className="px-3 text-sm bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 py-2 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {modalAbierto && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {empleadoEditando ? "Editar Empleado" : "Nuevo Empleado"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm({ ...form, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    required
                    disabled={!!empleadoEditando}
                  />
                  {empleadoEditando && (
                    <p className="text-xs text-gray-500 mt-1">
                      El email no se puede cambiar
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contraseña{" "}
                    {empleadoEditando ? "(dejar vacío para no cambiar)" : "*"}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required={!empleadoEditando}
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) =>
                      setForm({ ...form, telefono: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {guardando
                      ? "Guardando..."
                      : empleadoEditando
                        ? "Actualizar"
                        : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DepositoLayout>
  );
}
