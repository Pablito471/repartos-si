import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import { formatNumber } from "@/utils/formatters";
import { useState, useEffect } from "react";
import { showSuccessAlert, showConfirmAlert, showToast } from "@/utils/alerts";

export default function Inventario() {
  const {
    inventario,
    actualizarStock,
    agregarProducto,
    editarProducto,
    eliminarProducto,
    eliminarProductoPermanente,
    reactivarProducto,
    productosInactivos,
    cargarProductosInactivos,
    getProductosStockBajo,
    cargandoInventario,
  } = useDeposito();
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalMovimiento, setMostrarModalMovimiento] = useState(false);
  const [mostrarModalInactivos, setMostrarModalInactivos] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    categoria: "Categoría 1",
    stock: 0,
    stockMinimo: 10,
    stockMaximo: 100,
    precio: 0,
    costo: 0,
    ubicacion: "",
    imagen: "",
    registrarCompra: true,
  });
  const [movimiento, setMovimiento] = useState({
    cantidad: 0,
    tipo: "entrada",
    motivo: "",
    registrarContabilidad: true,
  });

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 10;

  // Mostrar loading mientras se carga el inventario
  if (cargandoInventario) {
    return (
      <DepositoLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando inventario...</span>
        </div>
      </DepositoLayout>
    );
  }

  const productosStockBajo = getProductosStockBajo();

  // Obtener categorías únicas
  const categorias = [...new Set(inventario.map((p) => p.categoria))];

  const productosFiltrados = inventario.filter((producto) => {
    const cumpleCategoria =
      filtroCategoria === "todas" || producto.categoria === filtroCategoria;
    const cumpleStock =
      filtroStock === "todos" ||
      (filtroStock === "bajo" && producto.stock <= producto.stockMinimo) ||
      (filtroStock === "normal" &&
        producto.stock > producto.stockMinimo &&
        producto.stock < producto.stockMaximo) ||
      (filtroStock === "alto" && producto.stock >= producto.stockMaximo);
    const cumpleBusqueda =
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleCategoria && cumpleStock && cumpleBusqueda;
  });

  // Calcular paginación
  const totalPaginas = Math.ceil(
    productosFiltrados.length / productosPorPagina,
  );
  const indiceInicio = (paginaActual - 1) * productosPorPagina;
  const indiceFin = indiceInicio + productosPorPagina;
  const productosPaginados = productosFiltrados.slice(indiceInicio, indiceFin);

  // Resetear página cuando cambian los filtros
  const handleFiltroChange = (setter) => (value) => {
    setter(value);
    setPaginaActual(1);
  };

  // Abrir modal para agregar nuevo producto
  const abrirModalAgregar = () => {
    setModoEdicion(false);
    setProductoSeleccionado(null);
    setNuevoProducto({
      nombre: "",
      categoria: "Categoría 1",
      stock: 0,
      stockMinimo: 10,
      stockMaximo: 100,
      precio: 0,
      costo: 0,
      ubicacion: "",
      imagen: "",
      registrarCompra: true,
    });
    setMostrarModal(true);
  };

  // Abrir modal para editar producto
  const abrirModalEditar = (producto) => {
    setModoEdicion(true);
    setProductoSeleccionado(producto);
    setNuevoProducto({
      nombre: producto.nombre || "",
      categoria: producto.categoria || "Categoría 1",
      stock: producto.stock || 0,
      stockMinimo: producto.stockMinimo || 10,
      stockMaximo: producto.stockMaximo || 100,
      precio: producto.precio || 0,
      costo: producto.costo || 0,
      ubicacion: producto.ubicacion || "",
      imagen: producto.imagen || "",
    });
    setMostrarModal(true);
  };

  // Cerrar modal y limpiar
  const cerrarModal = () => {
    setMostrarModal(false);
    setModoEdicion(false);
    setProductoSeleccionado(null);
    setNuevoProducto({
      nombre: "",
      categoria: "Categoría 1",
      stock: 0,
      stockMinimo: 10,
      stockMaximo: 100,
      precio: 0,
      costo: 0,
      ubicacion: "",
      imagen: "",
    });
  };

  const handleGuardarProducto = async (e) => {
    e.preventDefault();

    if (modoEdicion && productoSeleccionado) {
      // Modo edición
      const confirmado = await showConfirmAlert(
        "Guardar cambios",
        `¿Guardar los cambios en "${nuevoProducto.nombre}"?`,
      );

      if (confirmado) {
        try {
          await editarProducto(productoSeleccionado.id, nuevoProducto);
          cerrarModal();
          showSuccessAlert(
            "¡Producto actualizado!",
            "Los cambios se guardaron correctamente",
          );
        } catch (error) {
          showToast(
            "error",
            "Error al actualizar producto: " +
              (error.message || "Error desconocido"),
          );
        }
      }
    } else {
      // Modo agregar
      const confirmado = await showConfirmAlert(
        "Agregar producto",
        `¿Agregar "${nuevoProducto.nombre}" al inventario?`,
      );

      if (confirmado) {
        try {
          await agregarProducto(nuevoProducto);
          cerrarModal();

          // Emitir evento para actualizar contabilidad si se registró compra
          if (
            nuevoProducto.registrarCompra &&
            nuevoProducto.costo > 0 &&
            nuevoProducto.stock > 0
          ) {
            window.dispatchEvent(
              new CustomEvent("contabilidad:movimiento_creado"),
            );
          }

          showSuccessAlert(
            "¡Producto agregado!",
            "El producto se agregó al inventario",
          );
        } catch (error) {
          showToast(
            "error",
            "Error al agregar producto: " +
              (error.message || "Error desconocido"),
          );
        }
      }
    }
  };

  const handleAgregarProducto = async (e) => {
    e.preventDefault();
    const confirmado = await showConfirmAlert(
      "Agregar producto",
      `¿Agregar "${nuevoProducto.nombre}" al inventario?`,
    );

    if (confirmado) {
      try {
        await agregarProducto(nuevoProducto);
        setNuevoProducto({
          nombre: "",
          categoria: "Categoría 1",
          stock: 0,
          stockMinimo: 10,
          stockMaximo: 100,
          precio: 0,
          costo: 0,
          ubicacion: "",
          imagen: "",
        });
        setMostrarModal(false);

        // Emitir evento para actualizar contabilidad si tiene precio y stock
        if (
          (nuevoProducto.precio > 0 || nuevoProducto.costo > 0) &&
          nuevoProducto.stock > 0
        ) {
          window.dispatchEvent(
            new CustomEvent("contabilidad:movimiento_creado"),
          );
        }

        showSuccessAlert(
          "¡Producto agregado!",
          "El producto se agregó al inventario",
        );
      } catch (error) {
        showToast(
          "error",
          "Error al agregar producto: " +
            (error.message || "Error desconocido"),
        );
      }
    }
  };

  const handleMovimientoStock = async (e) => {
    e.preventDefault();
    if (!productoSeleccionado || movimiento.cantidad <= 0) return;

    const confirmado = await showConfirmAlert(
      movimiento.tipo === "entrada" ? "Entrada de stock" : "Salida de stock",
      `¿Confirmar ${movimiento.tipo} de ${movimiento.cantidad} unidades de "${productoSeleccionado.nombre}"?`,
    );

    if (confirmado) {
      try {
        await actualizarStock(
          productoSeleccionado.id,
          movimiento.cantidad,
          movimiento.tipo,
          movimiento.registrarContabilidad,
        );
        setMostrarModalMovimiento(false);
        setProductoSeleccionado(null);

        // Emitir evento para actualizar contabilidad si se registró movimiento
        if (movimiento.registrarContabilidad) {
          window.dispatchEvent(
            new CustomEvent("contabilidad:movimiento_creado"),
          );
        }

        setMovimiento({
          cantidad: 0,
          tipo: "entrada",
          motivo: "",
          registrarContabilidad: true,
        });
        showToast("success", "Stock actualizado correctamente");
      } catch (error) {
        showToast(
          "error",
          "Error al actualizar stock: " +
            (error.message || "Error desconocido"),
        );
      }
    }
  };

  const abrirModalMovimiento = (producto, tipo) => {
    setProductoSeleccionado(producto);
    setMovimiento({
      cantidad: 0,
      tipo,
      motivo: "",
      registrarContabilidad: true,
    });
    setMostrarModalMovimiento(true);
  };

  // Borrado lógico (soft delete) - el producto se puede recuperar
  const handleEliminarProducto = async (producto) => {
    const confirmado = await showConfirmAlert(
      "Desactivar producto",
      `¿Desactivar "${producto.nombre}"? Podrás reactivarlo después desde "Productos Inactivos".`,
    );

    if (confirmado) {
      try {
        await eliminarProducto(producto.id);
        showSuccessAlert(
          "¡Producto desactivado!",
          "El producto fue desactivado. Puedes reactivarlo desde 'Productos Inactivos'.",
        );
      } catch (error) {
        showToast(
          "error",
          "Error al desactivar producto: " +
            (error.message || "Error desconocido"),
        );
      }
    }
  };

  // Borrado permanente (hard delete)
  const handleEliminarPermanente = async (producto) => {
    const confirmado = await showConfirmAlert(
      "⚠️ Eliminar PERMANENTEMENTE",
      `¿Estás seguro de eliminar "${producto.nombre}" de forma PERMANENTE? Esta acción NO se puede deshacer.`,
    );

    if (confirmado) {
      try {
        await eliminarProductoPermanente(producto.id);
        showSuccessAlert(
          "¡Producto eliminado!",
          "El producto se eliminó permanentemente",
        );
      } catch (error) {
        showToast(
          "error",
          "Error al eliminar producto: " +
            (error.message || "Error desconocido"),
        );
      }
    }
  };

  // Reactivar producto
  const handleReactivarProducto = async (producto) => {
    const confirmado = await showConfirmAlert(
      "Reactivar producto",
      `¿Reactivar "${producto.nombre}"? Volverá a aparecer en tu inventario.`,
    );

    if (confirmado) {
      try {
        await reactivarProducto(producto.id);
        showSuccessAlert(
          "¡Producto reactivado!",
          "El producto volvió al inventario activo",
        );
      } catch (error) {
        showToast(
          "error",
          "Error al reactivar producto: " +
            (error.message || "Error desconocido"),
        );
      }
    }
  };

  // Abrir modal de productos inactivos
  const handleVerInactivos = async () => {
    await cargarProductosInactivos();
    setMostrarModalInactivos(true);
  };

  // Calcular estadísticas
  const totalProductos = inventario.length;
  const valorInventario = inventario.reduce(
    (sum, p) => sum + p.stock * p.costo,
    0,
  );
  const totalUnidades = inventario.reduce((sum, p) => sum + p.stock, 0);

  return (
    <DepositoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Inventario
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Control de stock y productos del depósito
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={handleVerInactivos}
              className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors inline-flex items-center space-x-2"
            >
              <span>📦</span>
              <span>Inactivos</span>
            </button>
            <button
              onClick={abrirModalAgregar}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Agregar Producto</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Productos</p>
                <p className="text-3xl font-bold">{totalProductos}</p>
              </div>
              <span className="text-4xl opacity-80">📦</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Unidades</p>
                <p className="text-3xl font-bold">
                  {formatNumber(totalUnidades)}
                </p>
              </div>
              <span className="text-4xl opacity-80">📊</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Valor Inventario</p>
                <p className="text-3xl font-bold">
                  ${formatNumber(valorInventario)}
                </p>
              </div>
              <span className="text-4xl opacity-80">💰</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Stock Bajo</p>
                <p className="text-3xl font-bold">
                  {productosStockBajo.length}
                </p>
              </div>
              <span className="text-4xl opacity-80">⚠️</span>
            </div>
          </div>
        </div>

        {/* Alertas de Stock Bajo */}
        {productosStockBajo.length > 0 && (
          <div className="card bg-red-50 border border-red-200">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-semibold text-red-800">
                Productos con Stock Bajo
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {productosStockBajo.map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {producto.nombre}
                    </p>
                    <p className="text-sm text-gray-500">{producto.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-bold">{producto.stock}</p>
                    <p className="text-xs text-gray-500">
                      Min: {producto.stockMinimo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                className="input-field"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                className="input-field"
                value={filtroCategoria}
                onChange={(e) => {
                  setFiltroCategoria(e.target.value);
                  setPaginaActual(1);
                }}
              >
                <option value="todas">Todas</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado Stock
              </label>
              <select
                className="input-field"
                value={filtroStock}
                onChange={(e) => {
                  setFiltroStock(e.target.value);
                  setPaginaActual(1);
                }}
              >
                <option value="todos">Todos</option>
                <option value="bajo">🔴 Stock Bajo</option>
                <option value="normal">🟡 Normal</option>
                <option value="alto">🟢 Stock Alto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm bg-gray-50">
                  <th className="p-4">Imagen</th>
                  <th className="p-4">Código</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-right">Precio</th>
                  <th className="p-4 text-right">Costo</th>
                  <th className="p-4">Ubicación</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  productosPaginados.map((producto) => (
                    <tr
                      key={producto.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {producto.imagen ? (
                            <img
                              src={producto.imagen}
                              alt={producto.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-600">
                        {producto.codigo}
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-gray-800">
                          {producto.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          Act: {producto.ultimaActualizacion}
                        </p>
                      </td>
                      <td className="p-4 text-gray-600">
                        {producto.categoria}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <StockIndicator producto={producto} />
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">
                        ${producto.precio}
                      </td>
                      <td className="p-4 text-right text-gray-600">
                        ${producto.costo}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                          📍 {producto.ubicacion}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => abrirModalEditar(producto)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar producto"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() =>
                              abrirModalMovimiento(producto, "entrada")
                            }
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Entrada de stock"
                          >
                            ➕
                          </button>
                          <button
                            onClick={() =>
                              abrirModalMovimiento(producto, "salida")
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Salida de stock"
                          >
                            ➖
                          </button>
                          <button
                            onClick={() => handleEliminarProducto(producto)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Eliminar producto"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Mostrando {indiceInicio + 1} -{" "}
                {Math.min(indiceFin, productosFiltrados.length)} de{" "}
                {productosFiltrados.length} productos
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPaginaActual(1)}
                  disabled={paginaActual === 1}
                  className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Primera página"
                >
                  ⏮️
                </button>
                <button
                  onClick={() => setPaginaActual(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Anterior"
                >
                  ◀️
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter((num) => {
                      // Mostrar primera, última, actual y adyacentes
                      if (num === 1 || num === totalPaginas) return true;
                      if (Math.abs(num - paginaActual) <= 1) return true;
                      return false;
                    })
                    .map((num, idx, arr) => (
                      <span key={num} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== num - 1 && (
                          <span className="px-1 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => setPaginaActual(num)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            paginaActual === num
                              ? "bg-orange-500 text-white"
                              : "border hover:bg-gray-100"
                          }`}
                        >
                          {num}
                        </button>
                      </span>
                    ))}
                </div>

                <button
                  onClick={() => setPaginaActual(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Siguiente"
                >
                  ▶️
                </button>
                <button
                  onClick={() => setPaginaActual(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                  className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  ⏭️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar/Editar Producto */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {modoEdicion ? "✏️ Editar Producto" : "➕ Agregar Producto"}
                </h2>
                <button
                  onClick={cerrarModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleGuardarProducto} className="p-6 space-y-4">
              {/* Mostrar código actual en modo edición */}
              {modoEdicion && productoSeleccionado && (
                <div className="bg-gray-100 dark:bg-neutral-700 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Código
                  </p>
                  <p className="font-mono font-bold text-gray-800 dark:text-white">
                    {productoSeleccionado.codigo}
                  </p>
                </div>
              )}

              {/* Imagen Preview */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-neutral-600">
                  {nuevoProducto.imagen ? (
                    <img
                      src={nuevoProducto.imagen}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <span className="text-4xl">📷</span>
                      <p className="text-xs mt-1">Sin imagen</p>
                    </div>
                  )}
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL de imagen (opcional)
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={nuevoProducto.imagen}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        imagen: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del producto
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={nuevoProducto.nombre}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        nombre: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    className="input-field"
                    value={nuevoProducto.categoria}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        categoria: e.target.value,
                      })
                    }
                  >
                    <option value="Categoría 1">Categoría 1</option>
                    <option value="Categoría 2">Categoría 2</option>
                    <option value="Categoría 3">Categoría 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: A-01"
                    value={nuevoProducto.ubicacion}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        ubicacion: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock inicial
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    value={nuevoProducto.stock}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock mínimo
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    value={nuevoProducto.stockMinimo}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        stockMinimo: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock máximo
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    value={nuevoProducto.stockMaximo}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        stockMaximo: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio de venta
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    step="0.01"
                    value={nuevoProducto.precio}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        precio: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="0"
                    step="0.01"
                    value={nuevoProducto.costo}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        costo: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Checkbox para registrar compra */}
              {!modoEdicion &&
                nuevoProducto.costo > 0 &&
                nuevoProducto.stock > 0 && (
                  <div className="flex items-center space-x-2 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      id="registrarCompra"
                      checked={nuevoProducto.registrarCompra}
                      onChange={(e) =>
                        setNuevoProducto({
                          ...nuevoProducto,
                          registrarCompra: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <label
                      htmlFor="registrarCompra"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      📊 Registrar como compra en contabilidad ($
                      {formatNumber(nuevoProducto.costo * nuevoProducto.stock)})
                    </label>
                  </div>
                )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {modoEdicion ? "💾 Guardar Cambios" : "➕ Agregar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Movimiento de Stock */}
      {mostrarModalMovimiento && productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {movimiento.tipo === "entrada"
                    ? "➕ Entrada de Stock"
                    : "➖ Salida de Stock"}
                </h2>
                <button
                  onClick={() => setMostrarModalMovimiento(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleMovimientoStock} className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">
                  {productoSeleccionado.nombre}
                </p>
                <p className="text-sm text-gray-500">
                  {productoSeleccionado.codigo}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Stock actual:{" "}
                  <span className="font-bold">
                    {productoSeleccionado.stock}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  className="input-field"
                  min="1"
                  value={movimiento.cantidad}
                  onChange={(e) =>
                    setMovimiento({
                      ...movimiento,
                      cantidad: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: Compra, Ajuste, Devolución..."
                  value={movimiento.motivo}
                  onChange={(e) =>
                    setMovimiento({ ...movimiento, motivo: e.target.value })
                  }
                />
              </div>

              {movimiento.cantidad > 0 && (
                <div
                  className={`p-3 rounded-lg ${movimiento.tipo === "entrada" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                >
                  <p className="font-medium">
                    Nuevo stock:{" "}
                    {movimiento.tipo === "entrada"
                      ? productoSeleccionado.stock + movimiento.cantidad
                      : Math.max(
                          0,
                          productoSeleccionado.stock - movimiento.cantidad,
                        )}
                  </p>
                </div>
              )}

              {/* Checkbox para registrar en contabilidad */}
              {movimiento.cantidad > 0 &&
                ((movimiento.tipo === "entrada" &&
                  productoSeleccionado.costo > 0) ||
                  (movimiento.tipo === "salida" &&
                    productoSeleccionado.precio > 0)) && (
                  <div className="flex items-center space-x-2 bg-orange-50 p-3 rounded-lg">
                    <input
                      type="checkbox"
                      id="registrarContabilidad"
                      checked={movimiento.registrarContabilidad}
                      onChange={(e) =>
                        setMovimiento({
                          ...movimiento,
                          registrarContabilidad: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <label
                      htmlFor="registrarContabilidad"
                      className="text-sm text-gray-700"
                    >
                      {movimiento.tipo === "entrada"
                        ? `📊 Registrar como compra ($${formatNumber(productoSeleccionado.costo * movimiento.cantidad)})`
                        : `📊 Registrar como venta ($${formatNumber(productoSeleccionado.precio * movimiento.cantidad)})`}
                    </label>
                  </div>
                )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalMovimiento(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${movimiento.tipo === "entrada" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Productos Inactivos */}
      {mostrarModalInactivos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b dark:border-neutral-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  📦 Productos Inactivos
                </h2>
                <button
                  onClick={() => setMostrarModalInactivos(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Productos desactivados que puedes reactivar o eliminar
                permanentemente
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {productosInactivos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-5xl block mb-4">✅</span>
                  <p className="text-lg">No hay productos inactivos</p>
                  <p className="text-sm">Todos tus productos están activos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {productosInactivos.map((producto) => (
                    <div
                      key={producto.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {producto.imagen ? (
                          <img
                            src={producto.imagen}
                            alt={producto.nombre}
                            className="w-12 h-12 rounded-lg object-cover opacity-50"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 dark:bg-neutral-600 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400">📦</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {producto.nombre}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {producto.codigo} • {producto.categoria} • Stock:{" "}
                            {producto.stock}
                          </p>
                          {producto.fechaEliminacion && (
                            <p className="text-xs text-gray-400">
                              Desactivado:{" "}
                              {new Date(
                                producto.fechaEliminacion,
                              ).toLocaleDateString("es-AR")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReactivarProducto(producto)}
                          className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                          ✅ Reactivar
                        </button>
                        <button
                          onClick={() => handleEliminarPermanente(producto)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t dark:border-neutral-700 flex-shrink-0">
              <button
                onClick={() => setMostrarModalInactivos(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </DepositoLayout>
  );
}

function StockIndicator({ producto }) {
  const porcentaje = (producto.stock / producto.stockMaximo) * 100;
  let color = "bg-green-500";
  let textColor = "text-green-600";

  if (producto.stock <= producto.stockMinimo) {
    color = "bg-red-500";
    textColor = "text-red-600";
  } else if (porcentaje < 50) {
    color = "bg-yellow-500";
    textColor = "text-yellow-600";
  }

  return (
    <div className="flex flex-col items-center">
      <span className={`font-bold ${textColor}`}>{producto.stock}</span>
      <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, porcentaje)}%` }}
        />
      </div>
      <span className="text-xs text-gray-400">
        {producto.stockMinimo}-{producto.stockMaximo}
      </span>
    </div>
  );
}
