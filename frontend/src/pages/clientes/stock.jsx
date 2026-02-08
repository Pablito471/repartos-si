import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { stockService } from "@/services/api";
import { showSuccessAlert, showConfirmAlert, showToast } from "@/utils/alerts";
import Icons from "@/components/Icons";
import QRCode from "qrcode";

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

  // Estado para modal QR
  const [mostrarModalQR, setMostrarModalQR] = useState(false);
  const [productoQR, setProductoQR] = useState(null);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    codigoBarras: "",
    cantidad: "",
    precioCosto: "",
    precioVenta: "",
    registrarCompra: true,
    esGranel: false,
    unidadMedida: "unidad",
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
      if (data.stockActualizado) {
        showToast("success", "📦 Nuevo stock agregado automáticamente");
        cargarDatos();
      }
    };

    // Recargar cuando se agrega producto desde el escáner
    const handleProductoAgregado = (event) => {
      cargarDatos();
    };

    // Recargar cuando se actualiza producto desde el escáner (venta)
    const handleProductoActualizado = (event) => {
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

  // Generar QR
  const handleGenerarQR = (producto) => {
    setProductoQR(producto);
    setMostrarModalQR(true);
  };

  // Generar QR en canvas cuando se abre el modal
  useEffect(() => {
    if (mostrarModalQR && productoQR) {
      setTimeout(() => {
        const canvas = document.getElementById("qr-canvas");
        if (canvas) {
          QRCode.toCanvas(
            canvas,
            productoQR.codigoBarras || productoQR.codigo || "SIN-CODIGO",
            { width: 300, margin: 2 },
            function (error) {
              if (error) console.error(error);
            },
          );
        }
      }, 100);
    }
  }, [mostrarModalQR, productoQR]);

  const descargarQR = () => {
    const canvas = document.getElementById("qr-canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `QR-${productoQR.nombre}.png`;
      link.href = url;
      link.click();
    }
  };

  const imprimirQR = () => {
    const canvas = document.getElementById("qr-canvas");
    if (canvas) {
      const imgUrl = canvas.toDataURL("image/png");
      const win = window.open("", "_blank");
      win.document.write(`
        <html>
          <head>
            <title>Imprimir QR - ${productoQR.nombre}</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 20px; }
              .container { border: 2px solid #000; display: inline-block; padding: 20px; border-radius: 10px; }
              h1 { margin: 10px 0; font-size: 24px; }
              p { margin: 5px 0; font-size: 18px; }
              .price { font-size: 20px; font-weight: bold; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${productoQR.nombre}</h1>
              <img src="${imgUrl}" width="300" height="300" />
              <p>${productoQR.codigoBarras || productoQR.codigo || ""}</p>
              ${productoQR.esGranel
          ? `<p class="price">$${productoQR.precioVenta || productoQR.precio} / ${productoQR.unidadMedida === "kg" ? "Kg" : productoQR.unidadMedida}</p>`
          : `<p class="price">$${productoQR.precioVenta || productoQR.precio}</p>`
        }
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

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
        codigoBarras: nuevoProducto.codigoBarras || null,
        cantidad: parseFloat(nuevoProducto.cantidad),
        precioCosto: nuevoProducto.precioCosto
          ? parseFloat(nuevoProducto.precioCosto)
          : null,
        precioVenta: nuevoProducto.precioVenta
          ? parseFloat(nuevoProducto.precioVenta)
          : null,
        registrarCompra: nuevoProducto.registrarCompra,
        esGranel: nuevoProducto.esGranel,
        unidadMedida: nuevoProducto.unidadMedida,
        precioUnidad: nuevoProducto.esGranel
          ? parseFloat(nuevoProducto.precioVenta)
          : null,
      });

      setNuevoProducto({
        nombre: "",
        codigoBarras: "",
        cantidad: "",
        precioCosto: "",
        precioVenta: "",
        registrarCompra: true,
        esGranel: false,
        unidadMedida: "unidad",
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

  const [activeTab, setActiveTab] = useState("todos"); // todos, unidades, granel
  const [mostrarModalGranel, setMostrarModalGranel] = useState(false);

  // Filtrar stock según tab activo
  const stockFiltrado = stock.filter((p) => {
    if (activeTab === "todos") return true;
    if (activeTab === "unidades") return !p.esGranel;
    if (activeTab === "granel") return p.esGranel;
    return true;
  });

  // Manejar carga rápida granel
  const handleAgregarGranel = async (e) => {
    e.preventDefault();
    if (!nuevoProducto.nombre || !nuevoProducto.precioVenta) {
      showToast("error", "Nombre y Precio por Kg son requeridos");
      return;
    }

    setGuardando(true);
    try {
      // Generar código aleatorio si no se especificó
      const codigo = nuevoProducto.codigoBarras || Math.floor(1000000000000 + Math.random() * 9000000000000).toString();

      await stockService.agregarProducto({
        nombre: nuevoProducto.nombre,
        codigoBarras: codigo,
        cantidad: parseFloat(nuevoProducto.cantidad) || 10, // Stock inicial arbitrario en kg
        precioCosto: nuevoProducto.precioCosto ? parseFloat(nuevoProducto.precioCosto) : null,
        precioVenta: parseFloat(nuevoProducto.precioVenta),
        registrarCompra: false, // Por defecto no registra compra en carga rápida
        esGranel: true,
        unidadMedida: "kg",
        precioUnidad: parseFloat(nuevoProducto.precioVenta),
      });

      setNuevoProducto({
        nombre: "",
        codigoBarras: "",
        cantidad: "",
        precioCosto: "",
        precioVenta: "",
        registrarCompra: true,
        esGranel: false,
        unidadMedida: "unidad",
      });
      setMostrarModalGranel(false);
      showSuccessAlert("¡Listo!", "Producto a granel agregado");
      cargarDatos();
    } catch (error) {
      showToast("error", error.response?.data?.message || "Error al agregar");
    } finally {
      setGuardando(false);
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mi Stock</h1>
            <p className="text-gray-600">
              Gestina tus productos y precios
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setNuevoProducto(prev => ({ ...prev, esGranel: true, unidadMedida: 'kg', cantidad: '10' }));
                setMostrarModalGranel(true);
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>⚖️</span>
              <span>Carga Granel</span>
            </button>
            <button
              onClick={() => setMostrarModalDescontar(true)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <span>📤</span>
              <span>Descontar</span>
            </button>
            <button
              onClick={() => {
                setNuevoProducto({
                  nombre: "",
                  codigoBarras: "",
                  cantidad: "",
                  precioCosto: "",
                  precioVenta: "",
                  registrarCompra: true,
                  esGranel: false,
                  unidadMedida: "unidad",
                });
                setMostrarModalAgregar(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <span>➕</span>
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Tabs de Filtro */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("todos")}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === "todos"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveTab("unidades")}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === "unidades"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            📦 Unidades
          </button>
          <button
            onClick={() => setActiveTab("granel")}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === "granel"
                ? "text-orange-600 border-b-2 border-orange-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            ⚖️ A Granel
          </button>
        </div>

        {/* Stats (ocultos en móvil para ahorrar espacio si se desea, o mantenidos) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 hidden md:grid">
          <div className="card bg-gradient-to-br from-primary/10 to-primary/5 py-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Icons.Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Productos</p>
                <p className="text-xl font-bold text-gray-800">
                  {totales.totalProductos || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-50 to-orange-100/50 py-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                <span className="text-lg">💰</span>
              </div>
              <div>
                <p className="text-xs text-gray-600">Costo Total</p>
                <p className="text-xl font-bold text-gray-800">
                  ${(totales.costoTotal || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-blue-100/50 py-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-lg">🏷️</span>
              </div>
              <div>
                <p className="text-xs text-gray-600">Valor de Venta</p>
                <p className="text-xl font-bold text-gray-800">
                  ${(totales.valorTotal || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock actual */}
        <div className="card">
          {stockFiltrado.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Icons.Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No hay productos en esta categoría
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Agrega productos usando los botones superiores.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-3 pl-2">Producto</th>
                    <th className="pb-3 text-center">Cant.</th>
                    <th className="pb-3 text-right">🏷️ Venta</th>
                    <th className="pb-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {stockFiltrado.map((producto, idx) => {
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
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${producto.esGranel ? 'bg-orange-100' : 'bg-gray-100'}`}>
                              {producto.esGranel ? '⚖️' : '📦'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {producto.nombre}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {producto.codigoBarras && (
                                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                    {producto.codigoBarras}
                                  </span>
                                )}
                                {producto.esGranel && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">
                                    {producto.unidadMedida || 'kg'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-1 rounded-full font-medium text-sm ${producto.esGranel ? 'bg-orange-50 text-orange-700' : 'bg-primary/10 text-primary'}`}>
                            {producto.cantidad} {producto.esGranel ? (producto.unidadMedida || 'kg') : ''}
                          </span>
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
                                  className="w-20 pl-4 pr-1 py-1 border rounded text-right text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                  autoFocus
                                />
                              </div>
                              <button
                                onClick={() => guardarPrecioVenta(producto)}
                                className="text-green-600 hover:text-green-700 p-1"
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
                              className="text-gray-700 hover:text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors group text-right w-full"
                              title="Clic para editar precio de venta"
                            >
                              <span className="font-bold block">
                                ${precioVenta.toLocaleString()}
                              </span>
                              {producto.esGranel && (
                                <span className="text-xs text-gray-400 block">
                                  por {producto.unidadMedida || 'kg'}
                                </span>
                              )}
                            </button>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleGenerarQR(producto)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Generar QR"
                            >
                              <Icons.QrCode className="w-5 h-5" />
                            </button>
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
                              title="Vender"
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

      {/* Modal Carga Rápida Granel */}
      {mostrarModalGranel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5 border-b bg-orange-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                  <span>⚖️</span> Carga Rápida Granel
                </h2>
                <button
                  onClick={() => setMostrarModalGranel(false)}
                  className="text-orange-400 hover:text-orange-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Agrega productos por peso (ej: Pan, Fiambre)
              </p>
            </div>

            <form onSubmit={handleAgregarGranel} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  className="input-field w-full text-lg"
                  placeholder="Ej: Pan Francés"
                  value={nuevoProducto.nombre}
                  onChange={(e) =>
                    setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })
                  }
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio por Kilo *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    className="input-field w-full pl-8 text-lg font-bold"
                    placeholder="0.00"
                    value={nuevoProducto.precioVenta}
                    onChange={(e) =>
                      setNuevoProducto({ ...nuevoProducto, precioVenta: e.target.value })
                    }
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/ kg</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">
                  Opciones Avanzadas
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="input-field flex-1 font-mono text-sm"
                    placeholder="Código de barras manual..."
                    value={nuevoProducto.codigoBarras}
                    onChange={(e) =>
                      setNuevoProducto({ ...nuevoProducto, codigoBarras: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        codigoBarras: Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),
                      })
                    }
                    className="px-2 py-1 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                    title="Generar al azar"
                  >
                    🎲
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  * Si lo dejas vacío, se generará uno automáticamente.
                </p>
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-lg shadow-md transition-all active:scale-95"
              >
                {guardando ? "Guardando..." : "Guardar Producto"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Producto (Standard) */}
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
              {/* Configuración Granel */}
              <div>
                <label className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevoProducto.esGranel}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        esGranel: e.target.checked,
                        unidadMedida: e.target.checked ? "kg" : "unidad",
                      })
                    }
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <div>
                    <span className="font-medium text-gray-800">
                      ⚖️ Venta a granel (por peso)
                    </span>
                    <p className="text-xs text-gray-500">
                      Activa esta opción para productos que se venden por kilo
                    </p>
                  </div>
                </label>
              </div>

              {nuevoProducto.esGranel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    className="input-field w-full"
                    value={nuevoProducto.unidadMedida}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        unidadMedida: e.target.value,
                      })
                    }
                  >
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="L">Litros (L)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Barras (Opcional - Recomendado para QR)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field flex-1 font-mono"
                    placeholder="Escanear o escribir..."
                    value={nuevoProducto.codigoBarras}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        codigoBarras: e.target.value.toUpperCase(),
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        codigoBarras: Math.floor(
                          1000000000000 + Math.random() * 9000000000000,
                        ).toString(),
                      })
                    }
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-lg"
                    title="Generar código aleatorio"
                  >
                    🎲
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Necesario para escanear el producto y generar QR.
                </p>
              </div>

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
      {/* Modal QR */}
      {mostrarModalQR && productoQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Código QR
                </h3>
                <button
                  onClick={() => setMostrarModalQR(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icons.X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-100 shadow-sm">
                  <canvas id="qr-canvas"></canvas>
                </div>

                <div className="text-center">
                  <p className="font-bold text-lg text-gray-800">
                    {productoQR.nombre}
                  </p>
                  <p className="font-mono text-sm text-gray-500 mb-1">
                    {productoQR.codigoBarras || productoQR.codigo}
                  </p>
                  <p className="font-bold text-primary text-xl">
                    ${(productoQR.precioVenta || productoQR.precio || 0).toLocaleString()}
                    {productoQR.esGranel && (
                      <span className="text-sm text-gray-500 font-normal ml-1">
                        / {productoQR.unidadMedida === 'kg' ? 'Kg' : productoQR.unidadMedida}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={imprimirQR}
                    className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center justify-center gap-2"
                  >
                    🖨️ Imprimir
                  </button>
                  <button
                    onClick={descargarQR}
                    className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center justify-center gap-2"
                  >
                    ⬇️ Descargar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClienteLayout>
  );
}
