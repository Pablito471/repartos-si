import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import { formatNumber } from "@/utils/formatters";
import { useState } from "react";
import { showSuccessAlert, showConfirmAlert, showToast } from "@/utils/alerts";

export default function Inventario() {
  const {
    inventario,
    actualizarStock,
    agregarProducto,
    getProductosStockBajo,
  } = useDeposito();
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroStock, setFiltroStock] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalMovimiento, setMostrarModalMovimiento] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
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
  });
  const [movimiento, setMovimiento] = useState({
    cantidad: 0,
    tipo: "entrada",
    motivo: "",
  });

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

  const handleAgregarProducto = async (e) => {
    e.preventDefault();
    const confirmado = await showConfirmAlert(
      "Agregar producto",
      `¿Agregar "${nuevoProducto.nombre}" al inventario?`,
    );

    if (confirmado) {
      agregarProducto(nuevoProducto);
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
      showSuccessAlert(
        "¡Producto agregado!",
        "El producto se agregó al inventario",
      );
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
      actualizarStock(
        productoSeleccionado.id,
        movimiento.cantidad,
        movimiento.tipo,
      );
      setMostrarModalMovimiento(false);
      setProductoSeleccionado(null);
      setMovimiento({ cantidad: 0, tipo: "entrada", motivo: "" });
      showToast("success", "Stock actualizado correctamente");
    }
  };

  const abrirModalMovimiento = (producto, tipo) => {
    setProductoSeleccionado(producto);
    setMovimiento({ cantidad: 0, tipo, motivo: "" });
    setMostrarModalMovimiento(true);
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
            <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
            <p className="text-gray-600">
              Control de stock y productos del depósito
            </p>
          </div>
          <button
            onClick={() => setMostrarModal(true)}
            className="mt-4 md:mt-0 btn-primary inline-flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Agregar Producto</span>
          </button>
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
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                className="input-field"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
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
                onChange={(e) => setFiltroStock(e.target.value)}
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
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((producto) => (
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
                        <div className="flex items-center justify-center space-x-2">
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Agregar Producto */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Agregar Producto
                </h2>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleAgregarProducto} className="p-6 space-y-4">
              {/* Imagen Preview */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Agregar Producto
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
