import { useState } from "react";
import FleteLayout from "@/components/layouts/FleteLayout";
import { useFlete } from "@/context/FleteContext";
import CalendarioContabilidad from "@/components/CalendarioContabilidad";
import { formatNumber, formatDate } from "@/utils/formatters";
import Swal from "sweetalert2";

export default function FleteContabilidad() {
  const {
    movimientos,
    agregarMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
    calcularTotales,
    cargandoMovimientos,
  } = useFlete();
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoMovimiento, setEditandoMovimiento] = useState(null);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: "ingreso",
    concepto: "",
    monto: "",
    descripcion: "",
  });

  // Mostrar loading mientras se carga
  if (cargandoMovimientos) {
    return (
      <FleteLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando contabilidad...</span>
        </div>
      </FleteLayout>
    );
  }

  const totales = calcularTotales();

  const categorias = {
    ingreso: [
      "Flete de envío",
      "Propina",
      "Bonificación",
      "Cobro de pedido",
      "Otro ingreso",
    ],
    egreso: [
      "Combustible",
      "Mantenimiento",
      "Peaje",
      "Estacionamiento",
      "Seguro",
      "Multa",
      "Otro gasto",
    ],
  };

  let movimientosFiltrados = movimientos;
  if (filtroTipo !== "todos") {
    movimientosFiltrados = movimientos.filter((m) => m.tipo === filtroTipo);
  }

  // Ordenar por fecha más reciente
  movimientosFiltrados = [...movimientosFiltrados].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nuevoMovimiento.concepto || !nuevoMovimiento.monto) {
      Swal.fire({
        icon: "error",
        title: "Campos incompletos",
        text: "Por favor completa todos los campos requeridos",
      });
      return;
    }

    const movimiento = {
      tipo: nuevoMovimiento.tipo,
      concepto: nuevoMovimiento.concepto,
      monto: parseFloat(nuevoMovimiento.monto),
      notas: nuevoMovimiento.descripcion || null,
    };

    let resultado;
    if (editandoMovimiento) {
      resultado = await actualizarMovimiento(editandoMovimiento.id, movimiento);
    } else {
      resultado = await agregarMovimiento(movimiento);
    }

    if (resultado?.success) {
      Swal.fire({
        icon: "success",
        title: editandoMovimiento
          ? "Movimiento actualizado"
          : "Movimiento registrado",
        text: `${nuevoMovimiento.tipo === "ingreso" ? "Ingreso" : "Egreso"} de $${formatNumber(movimiento.monto)} ${editandoMovimiento ? "actualizado" : "registrado"} correctamente`,
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: resultado?.error || "No se pudo guardar el movimiento",
      });
    }

    setNuevoMovimiento({
      tipo: "ingreso",
      concepto: "",
      monto: "",
      descripcion: "",
    });
    setMostrarFormulario(false);
    setEditandoMovimiento(null);
  };

  const handleEditar = (mov) => {
    setEditandoMovimiento(mov);
    setNuevoMovimiento({
      tipo: mov.tipo,
      concepto: mov.concepto,
      monto: mov.monto.toString(),
      descripcion: mov.notas || mov.descripcion || "",
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (mov) => {
    const result = await Swal.fire({
      title: "¿Eliminar movimiento?",
      text: `Se eliminará el ${mov.tipo} de $${formatNumber(mov.monto)}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const resultado = await eliminarMovimiento(mov.id);
      if (resultado?.success) {
        Swal.fire({
          icon: "success",
          title: "Eliminado",
          text: "Movimiento eliminado correctamente",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: resultado?.error || "No se pudo eliminar el movimiento",
        });
      }
    }
  };

  const exportarCSV = () => {
    const headers = ["Fecha", "Tipo", "Concepto", "Monto", "Notas"];
    const rows = movimientos.map((m) => [
      m.fecha,
      m.tipo,
      m.concepto,
      m.monto.toString(),
      m.notas || m.descripcion || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contabilidad_flete_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <FleteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Mi Contabilidad
            </h1>
            <p className="text-gray-600">Gestiona tus ingresos y gastos</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={exportarCSV}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center space-x-2"
            >
              <span>📥</span>
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={() => {
                setMostrarFormulario(!mostrarFormulario);
                if (!mostrarFormulario) {
                  setEditandoMovimiento(null);
                  setNuevoMovimiento({
                    tipo: "ingreso",
                    concepto: "",
                    monto: "",
                    descripcion: "",
                  });
                }
              }}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center space-x-2"
            >
              <span>{mostrarFormulario ? "✕" : "+"}</span>
              <span>{mostrarFormulario ? "Cancelar" : "Nuevo Movimiento"}</span>
            </button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Ingresos</p>
                <p className="text-3xl font-bold">
                  ${formatNumber(totales.ingresos)}
                </p>
              </div>
              <span className="text-4xl opacity-80">💰</span>
            </div>
            <p className="text-green-100 text-sm mt-2">Este mes</p>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Egresos</p>
                <p className="text-3xl font-bold">
                  ${formatNumber(totales.egresos)}
                </p>
              </div>
              <span className="text-4xl opacity-80">💸</span>
            </div>
            <p className="text-red-100 text-sm mt-2">Este mes</p>
          </div>

          <div
            className={`card bg-gradient-to-br ${
              totales.balance >= 0
                ? "from-blue-500 to-blue-600"
                : "from-orange-500 to-orange-600"
            } text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Balance</p>
                <p className="text-3xl font-bold">
                  {totales.balance >= 0 ? "" : "-"}$
                  {formatNumber(Math.abs(totales.balance))}
                </p>
              </div>
              <span className="text-4xl opacity-80">
                {totales.balance >= 0 ? "📈" : "📉"}
              </span>
            </div>
            <p className="text-blue-100 text-sm mt-2">Este mes</p>
          </div>
        </div>

        {/* Calendario de Contabilidad */}
        <CalendarioContabilidad
          movimientos={movimientos}
          colorPrimary="orange"
        />

        {/* Formulario de nuevo movimiento */}
        {mostrarFormulario && (
          <div className="card border-2 border-orange-200 bg-orange-50">
            <h3 className="font-semibold text-gray-800 mb-4">
              {editandoMovimiento
                ? "Editar Movimiento"
                : "Registrar Nuevo Movimiento"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Movimiento
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNuevoMovimiento({
                          ...nuevoMovimiento,
                          tipo: "ingreso",
                          concepto: "",
                        })
                      }
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        nuevoMovimiento.tipo === "ingreso"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      💰 Ingreso
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNuevoMovimiento({
                          ...nuevoMovimiento,
                          tipo: "egreso",
                          concepto: "",
                        })
                      }
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        nuevoMovimiento.tipo === "egreso"
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      💸 Egreso
                    </button>
                  </div>
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={nuevoMovimiento.monto}
                      onChange={(e) =>
                        setNuevoMovimiento({
                          ...nuevoMovimiento,
                          monto: e.target.value,
                        })
                      }
                      className="input-field pl-8 w-full"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto *
                </label>
                <select
                  value={nuevoMovimiento.concepto}
                  onChange={(e) =>
                    setNuevoMovimiento({
                      ...nuevoMovimiento,
                      concepto: e.target.value,
                    })
                  }
                  className="input-field w-full"
                  required
                >
                  <option value="">Seleccionar concepto...</option>
                  {categorias[nuevoMovimiento.tipo].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={nuevoMovimiento.descripcion}
                  onChange={(e) =>
                    setNuevoMovimiento({
                      ...nuevoMovimiento,
                      descripcion: e.target.value,
                    })
                  }
                  className="input-field w-full"
                  rows={2}
                  placeholder="Detalles adicionales..."
                />
              </div>

              {/* Botón submit */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setEditandoMovimiento(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  {editandoMovimiento
                    ? "Guardar Cambios"
                    : "Registrar Movimiento"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="card">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "todos", label: "Todos", icon: "📋" },
              { value: "ingreso", label: "Ingresos", icon: "💰" },
              { value: "egreso", label: "Egresos", icon: "💸" },
            ].map((filtro) => (
              <button
                key={filtro.value}
                onClick={() => setFiltroTipo(filtro.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  filtroTipo === filtro.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>{filtro.icon}</span>
                <span>{filtro.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Movimientos */}
        {movimientosFiltrados.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-5xl block mb-4">📭</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Sin movimientos
            </h3>
            <p className="text-gray-500">
              No hay movimientos registrados con el filtro seleccionado
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {movimientosFiltrados.map((mov) => (
              <div
                key={mov.id}
                className={`card flex items-center justify-between border-l-4 ${
                  mov.tipo === "ingreso" ? "border-green-500" : "border-red-500"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      mov.tipo === "ingreso"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <span className="text-2xl">
                      {mov.tipo === "ingreso" ? "💰" : "💸"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{mov.concepto}</p>
                    {(mov.descripcion || mov.notas) && (
                      <p className="text-sm text-gray-500">
                        {mov.descripcion || mov.notas}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDate(mov.fecha)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p
                      className={`text-xl font-bold ${
                        mov.tipo === "ingreso"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {mov.tipo === "ingreso" ? "+" : "-"}$
                      {formatNumber(mov.monto)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditar(mov)}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleEliminar(mov)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resumen por categoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ingresos por categoría */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>💰</span> Ingresos por Categoría
            </h3>
            <div className="space-y-3">
              {categorias.ingreso.map((cat) => {
                const totalCat = movimientos
                  .filter((m) => m.tipo === "ingreso" && m.concepto === cat)
                  .reduce((sum, m) => sum + m.monto, 0);
                if (totalCat === 0) return null;
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-gray-600">{cat}</span>
                    <span className="font-medium text-green-600">
                      ${formatNumber(totalCat)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Egresos por categoría */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>💸</span> Egresos por Categoría
            </h3>
            <div className="space-y-3">
              {categorias.egreso.map((cat) => {
                const totalCat = movimientos
                  .filter((m) => m.tipo === "egreso" && m.concepto === cat)
                  .reduce((sum, m) => sum + m.monto, 0);
                if (totalCat === 0) return null;
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-gray-600">{cat}</span>
                    <span className="font-medium text-red-600">
                      ${formatNumber(totalCat)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </FleteLayout>
  );
}
