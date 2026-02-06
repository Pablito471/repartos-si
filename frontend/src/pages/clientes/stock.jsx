import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { stockService } from "@/services/api";
import { showSuccessAlert, showConfirmAlert, showToast } from "@/utils/alerts";
import Icons from "@/components/Icons";

export default function StockCliente() {
  const { usuario } = useAuth();
  const [stock, setStock] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [totales, setTotales] = useState({
    totalProductos: 0,
    valorTotal: 0,
    productosUnicos: 0,
  });
  const [cargando, setCargando] = useState(true);
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [mostrarModalDescontar, setMostrarModalDescontar] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    cantidad: "",
    precioCosto: "",
    precioVenta: "",
    registrarCompra: true,
  });
  const [descuento, setDescuento] = useState({
    nombre: "",
    cantidad: "",
    precioVenta: "",
    motivo: "Venta",
    registrarVenta: true,
  });
  const [guardando, setGuardando] = useState(false);
  const [editandoPrecio, setEditandoPrecio] = useState(null); // ID del producto editando
  const [precioEditado, setPrecioEditado] = useState("");

  useEffect(() => {
    if (usuario) {
      cargarDatos();
    }
  }, [usuario]);

  // Recargar stock cuando se recibe notificación de envío entregado (stock actualizado automáticamente)
  useEffect(() => {
    const handleEnvioEntregado = (event) => {
      const data = event.detail;
      console.log("Stock: Recibido socket:envio_entregado", data);
      if (data.stockActualizado) {
        showToast("success", "📦 Nuevo stock agregado automáticamente");
        cargarDatos();
      }
    };

    // Recargar cuando se agrega producto desde el escáner
    const handleProductoAgregado = (event) => {
      console.log("Stock: Producto agregado desde escáner", event.detail);
      cargarDatos();
    };

    // Recargar cuando se actualiza producto desde el escáner (venta)
    const handleProductoActualizado = (event) => {
      console.log("Stock: Producto actualizado desde escáner", event.detail);
      cargarDatos();
    };

    window.addEventListener("socket:envio_entregado", handleEnvioEntregado);
    window.addEventListener("stock:producto_agregado", handleProductoAgregado);
    window.addEventListener(
      "stock:producto_actualizado",
      handleProductoActualizado,
    );

    return () => {
      window.removeEventListener(
        "socket:envio_entregado",
        handleEnvioEntregado,
      );
      window.removeEventListener(
        "stock:producto_agregado",
        handleProductoAgregado,
      );
      window.removeEventListener(
        "stock:producto_actualizado",
        handleProductoActualizado,
      );
    };
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [stockRes, totalesRes, historialRes] = await Promise.all([
        stockService.obtenerStock(),
        stockService.obtenerTotales(),
        stockService.obtenerHistorial(),
      ]);

      setStock(stockRes.data || []);
      setTotales(totalesRes.data || {});
      setHistorial(historialRes.data || []);
    } catch (error) {
      console.error("Error al cargar stock:", error);
      showToast("error", "Error al cargar el stock");
    } finally {
      setCargando(false);
    }
  };

  const handleAgregarDesdePedido = async (pedidoId) => {
    const confirmado = await showConfirmAlert(
      "Agregar al stock",
      "¿Agregar los productos de este pedido a tu inventario?",
    );

    if (confirmado) {
      try {
        await stockService.agregarDesdePedido(pedidoId);
        showSuccessAlert("¡Agregado!", "Los productos se agregaron a tu stock");
        cargarDatos();
      } catch (error) {
        showToast(
          "error",
          error.response?.data?.message || "Error al agregar al stock",
        );
      }
    }
  };

  const handleAgregarProducto = async (e) => {
    e.preventDefault();

    if (!nuevoProducto.nombre || !nuevoProducto.cantidad) {
      showToast("error", "Nombre y cantidad son requeridos");
      return;
    }

    if (!nuevoProducto.precioVenta) {
      showToast("error", "El precio de venta es requerido");
      return;
    }

    setGuardando(true);
    try {
      await stockService.agregarProducto({
        nombre: nuevoProducto.nombre,
        cantidad: parseInt(nuevoProducto.cantidad),
        precioCosto: nuevoProducto.precioCosto
          ? parseFloat(nuevoProducto.precioCosto)
          : null,
        precioVenta: nuevoProducto.precioVenta
          ? parseFloat(nuevoProducto.precioVenta)
          : null,
        registrarCompra: nuevoProducto.registrarCompra,
      });

      setNuevoProducto({
        nombre: "",
        cantidad: "",
        precioCosto: "",
        precioVenta: "",
        registrarCompra: true,
      });
      setMostrarModalAgregar(false);
      showSuccessAlert("¡Agregado!", "Producto agregado al stock");
      cargarDatos();

      // Emitir evento para actualizar contabilidad si se registró compra
      if (nuevoProducto.registrarCompra && nuevoProducto.precioCosto) {
        window.dispatchEvent(new CustomEvent("contabilidad:movimiento_creado"));
      }
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Error al agregar producto",
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleDescontarStock = async (e) => {
    e.preventDefault();

    if (!descuento.nombre || !descuento.cantidad) {
      showToast("error", "Producto y cantidad son requeridos");
      return;
    }

    setGuardando(true);
    try {
      await stockService.descontarStock(
        descuento.nombre,
        parseInt(descuento.cantidad),
        descuento.motivo,
        descuento.precioVenta ? parseFloat(descuento.precioVenta) : null,
        descuento.registrarVenta,
      );

      setDescuento({
        nombre: "",
        cantidad: "",
        precioVenta: "",
        motivo: "Venta",
        registrarVenta: true,
      });
      setMostrarModalDescontar(false);
      showSuccessAlert(
        "¡Descontado!",
        descuento.registrarVenta
          ? "Stock actualizado y venta registrada en contabilidad"
          : "Stock actualizado",
      );
      cargarDatos();

      // Emitir evento para actualizar contabilidad si se registró venta
      if (descuento.registrarVenta) {
        window.dispatchEvent(new CustomEvent("contabilidad:movimiento_creado"));
      }
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Error al descontar stock",
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarProducto = async (producto) => {
    const confirmado = await showConfirmAlert(
      "Eliminar producto",
      `¿Estás seguro de eliminar "${producto.nombre}" (${producto.cantidad} unidades) del stock? Esta acción no se puede deshacer.`,
      "warning",
    );

    if (confirmado) {
      try {
        // Usamos el nombre para eliminar todos los registros de ese producto
        await stockService.eliminar(producto.nombre);
        showSuccessAlert("¡Eliminado!", "Producto eliminado del stock");
        cargarDatos();
      } catch (error) {
        showToast(
          "error",
          error.response?.data?.message || "Error al eliminar producto",
        );
      }
    }
  };

  // Iniciar edición de precio de venta
  const iniciarEdicionPrecio = (producto) => {
    setEditandoPrecio(producto.id);
    setPrecioEditado(
      producto.precioVenta?.toString() || producto.precio?.toString() || "",
    );
  };

  // Cancelar edición
  const cancelarEdicionPrecio = () => {
    setEditandoPrecio(null);
    setPrecioEditado("");
  };

  // Guardar precio de venta editado
  const guardarPrecioVenta = async (producto) => {
    if (!precioEditado || parseFloat(precioEditado) <= 0) {
      showToast("error", "Ingresa un precio válido");
      return;
    }

    try {
      await stockService.actualizar(producto.id, {
        precioVenta: parseFloat(precioEditado),
      });
      showToast("success", "Precio actualizado");
      setEditandoPrecio(null);
      setPrecioEditado("");
      cargarDatos();
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Error al actualizar precio",
      );
    }
  };

  if (cargando) {
    return (
      <ClienteLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Cargando stock...</p>
          </div>
        </div>
      </ClienteLayout>
    );
  }

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mi Stock</h1>
            <p className="text-gray-600">
              Productos recibidos de tus pedidos entregados
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={() => setMostrarModalDescontar(true)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <span>📤</span>
              <span>Descontar</span>
            </button>
            <button
              onClick={() => setMostrarModalAgregar(true)}
              className="btn-primary flex items-center gap-2"
            >
              <span>➕</span>
              <span>Agregar</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Icons.Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-800">
                  {totales.totalProductos || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-50 to-orange-100/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Costo Total</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${(totales.costoTotal || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-blue-100/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-xl">🏷️</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor de Venta</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${(totales.valorTotal || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock actual */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icons.Package className="w-5 h-5 text-primary" />
            Inventario Actual
          </h2>

          {/* Advertencia si hay productos sin precio */}
          {stock.length > 0 &&
            stock.some((p) => !p.precioVenta && !p.precio) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-medium text-orange-700">
                    Productos sin precio configurado
                  </p>
                  <p className="text-sm text-orange-600">
                    Haz clic en "Configurar" para asignar un precio de venta a
                    cada producto.
                  </p>
                </div>
              </div>
            )}

          {stock.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Icons.Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Sin productos en stock
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Los productos se agregarán automáticamente cuando recibas tus
                pedidos. También puedes agregarlos manualmente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-3">Producto</th>
                    <th className="pb-3 text-center">Cantidad</th>
                    <th className="pb-3 text-right">💰 Costo</th>
                    <th className="pb-3 text-right">🏷️ Venta</th>
                    <th className="pb-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((producto, idx) => {
                    const precioCosto = parseFloat(producto.precioCosto) || 0;
                    const precioVenta =
                      parseFloat(producto.precioVenta) ||
                      parseFloat(producto.precio) ||
                      0;
                    const sinPrecioConfigurado = precioVenta === 0;

                    return (
                      <tr
                        key={idx}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {producto.imagen ? (
                              <img
                                src={producto.imagen}
                                alt={producto.nombre}
                                className="w-10 h-10 rounded-lg object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                📦
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">
                                {producto.nombre}
                              </p>
                              {producto.categoria &&
                                producto.categoria !== "General" && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                    {producto.categoria}
                                  </span>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                            {producto.cantidad}
                          </span>
                        </td>
                        <td className="py-4 text-right text-gray-500">
                          {precioCosto > 0 ? (
                            `$${precioCosto.toLocaleString()}`
                          ) : (
                            <span className="text-gray-300">Sin costo</span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          {editandoPrecio === producto.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={precioEditado}
                                  onChange={(e) =>
                                    setPrecioEditado(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      guardarPrecioVenta(producto);
                                    if (e.key === "Escape")
                                      cancelarEdicionPrecio();
                                  }}
                                  className="w-24 pl-6 pr-2 py-1 border rounded text-right text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                  autoFocus
                                />
                              </div>
                              <button
                                onClick={() => guardarPrecioVenta(producto)}
                                className="text-green-600 hover:text-green-700 p-1"
                                title="Guardar"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelarEdicionPrecio}
                                className="text-red-500 hover:text-red-600 p-1"
                                title="Cancelar"
                              >
                                ✕
                              </button>
                            </div>
                          ) : sinPrecioConfigurado ? (
                            <button
                              onClick={() => iniciarEdicionPrecio(producto)}
                              className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 px-2 py-1 rounded transition-colors animate-pulse"
                              title="Clic para configurar precio de venta"
                            >
                              ⚠️ Configurar
                            </button>
                          ) : (
                            <button
                              onClick={() => iniciarEdicionPrecio(producto)}
                              className="text-gray-700 hover:text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors group"
                              title="Clic para editar precio de venta"
                            >
                              ${precioVenta.toLocaleString()}
                              <span className="ml-1 text-gray-400 group-hover:text-primary text-xs">
                                ✏️
                              </span>
                            </button>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setDescuento({
                                  nombre: producto.nombre,
                                  cantidad: "",
                                  precioVenta: precioVenta.toString(),
                                  motivo: "Venta",
                                  registrarVenta: true,
                                });
                                setMostrarModalDescontar(true);
                              }}
                              className="text-orange-500 hover:text-orange-700 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                              title="Descontar/Vender"
                            >
                              📤
                            </button>
                            <button
                              onClick={() => handleEliminarProducto(producto)}
                              className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="py-4 font-semibold">
                      Total en Stock
                    </td>
                    <td className="py-4 text-right text-xl font-bold text-primary">
                      ${(totales.valorTotal || 0).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Pedidos pendientes de agregar al stock */}
        {historial.filter((h) => !h.agregadoAlStock).length > 0 && (
          <div className="card border-2 border-yellow-300 bg-yellow-50">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">📦</span>
              Pedidos Entregados - Pendientes de Agregar al Stock
            </h2>
            <div className="space-y-3">
              {historial
                .filter((h) => !h.agregadoAlStock)
                .map((pedido) => (
                  <div
                    key={pedido.pedidoId}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">📦</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Pedido #{pedido.numero}
                        </p>
                        <p className="text-sm text-gray-500">
                          {pedido.productos?.length} productos -{" "}
                          {pedido.deposito}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          ${pedido.total?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pedido.fechaEntrega &&
                            new Date(pedido.fechaEntrega).toLocaleDateString(
                              "es-ES",
                            )}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleAgregarDesdePedido(pedido.pedidoId)
                        }
                        className="btn-primary py-2 px-4"
                      >
                        Agregar al Stock
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Historial de entregas */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icons.Clock className="w-5 h-5 text-primary" />
            Historial de Pedidos Agregados al Stock
          </h2>

          {historial.filter((h) => h.agregadoAlStock).length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Icons.Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                No hay pedidos agregados al stock aún
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historial
                .filter((h) => h.agregadoAlStock)
                .map((pedido) => (
                  <div
                    key={pedido.pedidoId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Icons.CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Pedido #{pedido.numero}
                        </p>
                        <p className="text-sm text-gray-500">
                          {pedido.productos?.length} productos -{" "}
                          {pedido.deposito}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        ${pedido.total?.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Agregado al stock
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-medium text-blue-800 mb-1">
                ¿Cómo funciona?
              </h3>
              <p className="text-sm text-blue-700">
                Cuando recibes un pedido y se marca como entregado, aparecerá en
                la sección "Pendientes de agregar al stock". Haz clic en
                "Agregar al Stock" para registrar los productos en tu
                inventario. También puedes descontar productos cuando los
                vendas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Agregar Producto */}
      {mostrarModalAgregar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Agregar Producto
                </h2>
                <button
                  onClick={() => setMostrarModalAgregar(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleAgregarProducto} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: Coca Cola 2L"
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
                  Cantidad *
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  min="1"
                  value={nuevoProducto.cantidad}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      cantidad: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💰 Precio de costo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      className="input-field pl-8"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={nuevoProducto.precioCosto}
                      onChange={(e) =>
                        setNuevoProducto({
                          ...nuevoProducto,
                          precioCosto: e.target.value,
                        })
                      }
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Opcional</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🏷️ Precio de venta *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      className="input-field pl-8"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={nuevoProducto.precioVenta}
                      onChange={(e) =>
                        setNuevoProducto({
                          ...nuevoProducto,
                          precioVenta: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Requerido</p>
                </div>
              </div>

              {nuevoProducto.precioCosto &&
                parseFloat(nuevoProducto.precioCosto) > 0 && (
                  <div className="flex items-center gap-2">
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
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <label
                      htmlFor="registrarCompra"
                      className="text-sm text-gray-700"
                    >
                      Registrar como compra en contabilidad
                    </label>
                  </div>
                )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalAgregar(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary disabled:opacity-50"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Descontar Stock */}
      {mostrarModalDescontar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Descontar Stock
                </h2>
                <button
                  onClick={() => setMostrarModalDescontar(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleDescontarStock} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto
                </label>
                {stock.length > 0 ? (
                  <select
                    className="input-field"
                    value={descuento.nombre}
                    onChange={(e) =>
                      setDescuento({ ...descuento, nombre: e.target.value })
                    }
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {stock.map((p, idx) => (
                      <option key={idx} value={p.nombre}>
                        {p.nombre} (Stock: {p.cantidad})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nombre del producto"
                    value={descuento.nombre}
                    onChange={(e) =>
                      setDescuento({ ...descuento, nombre: e.target.value })
                    }
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad a descontar
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  min="1"
                  value={descuento.cantidad}
                  onChange={(e) =>
                    setDescuento({ ...descuento, cantidad: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio de venta unitario
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    className="input-field pl-8"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={descuento.precioVenta}
                    onChange={(e) =>
                      setDescuento({
                        ...descuento,
                        precioVenta: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo
                </label>
                <select
                  className="input-field"
                  value={descuento.motivo}
                  onChange={(e) =>
                    setDescuento({ ...descuento, motivo: e.target.value })
                  }
                >
                  <option value="Venta">Venta</option>
                  <option value="Consumo interno">Consumo interno</option>
                  <option value="Pérdida">Pérdida</option>
                  <option value="Vencimiento">Vencimiento</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {descuento.precioVenta &&
                parseFloat(descuento.precioVenta) > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="registrarVenta"
                      checked={descuento.registrarVenta}
                      onChange={(e) =>
                        setDescuento({
                          ...descuento,
                          registrarVenta: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <label
                      htmlFor="registrarVenta"
                      className="text-sm text-gray-700"
                    >
                      Registrar como venta en contabilidad
                    </label>
                  </div>
                )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalDescontar(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                  disabled={guardando}
                >
                  {guardando ? "Descontando..." : "Descontar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ClienteLayout>
  );
}
