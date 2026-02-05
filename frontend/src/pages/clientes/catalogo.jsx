import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useCliente } from "@/context/ClienteContext";
import { useAuth } from "@/context/AuthContext";
import { formatNumber } from "@/utils/formatters";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { showToast } from "@/utils/alerts";
import { stockService } from "@/services/api";
import JsBarcode from "jsbarcode";

const PRODUCTOS_POR_PAGINA = 12;

export default function CatalogoProductos() {
  const { depositos } = useCliente();
  const { usuario } = useAuth();

  const [stock, setStock] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [ordenar, setOrdenar] = useState("nombre");
  const [vistaGrid, setVistaGrid] = useState(true);
  const [modalCodigoBarras, setModalCodigoBarras] = useState(null);
  const [imprimiendoTodos, setImprimiendoTodos] = useState(false);

  // Cargar stock del cliente
  useEffect(() => {
    if (usuario) {
      cargarStock();
    }
  }, [usuario]);

  // Escuchar actualizaciones de stock
  useEffect(() => {
    const handleEnvioEntregado = (event) => {
      const data = event.detail;
      if (data.stockActualizado) {
        showToast("success", "📦 Stock actualizado");
        cargarStock();
      }
    };

    window.addEventListener("socket:envio_entregado", handleEnvioEntregado);
    return () => {
      window.removeEventListener(
        "socket:envio_entregado",
        handleEnvioEntregado,
      );
    };
  }, []);

  const cargarStock = async () => {
    setCargando(true);
    try {
      const response = await stockService.obtenerStock();
      setStock(response.data || []);
    } catch (error) {
      console.error("Error al cargar stock:", error);
      showToast("error", "Error al cargar el catálogo");
    } finally {
      setCargando(false);
    }
  };

  // Crear un mapa de productos de depósitos para obtener imágenes
  const productosDepositos = useMemo(() => {
    const mapa = {};
    depositos.forEach((deposito) => {
      if (deposito.productos && Array.isArray(deposito.productos)) {
        deposito.productos.forEach((producto) => {
          // Usar nombre normalizado como clave para buscar coincidencias
          const clave = producto.nombre?.toLowerCase().trim();
          if (clave) {
            mapa[clave] = {
              imagen: producto.imagen,
              categoria: producto.categoria,
              codigo: producto.codigo,
              depositoNombre: deposito.nombre,
              depositoImagen: deposito.imagen,
            };
          }
        });
      }
    });
    return mapa;
  }, [depositos]);

  // Enriquecer stock con imágenes de depósitos
  const stockConImagenes = useMemo(() => {
    return stock.map((item) => {
      const clave = item.nombre?.toLowerCase().trim();
      const productoDeposito = productosDepositos[clave];
      return {
        ...item,
        imagen: productoDeposito?.imagen || null,
        categoria: productoDeposito?.categoria || "Sin categoría",
        codigo: productoDeposito?.codigo || "",
        depositoNombre: productoDeposito?.depositoNombre || "",
        depositoImagen: productoDeposito?.depositoImagen || "",
      };
    });
  }, [stock, productosDepositos]);

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    return [
      ...new Set(stockConImagenes.map((p) => p.categoria).filter(Boolean)),
    ];
  }, [stockConImagenes]);

  const [filtroCategoria, setFiltroCategoria] = useState("todas");

  // Filtrar productos
  const productosFiltrados = useMemo(() => {
    return stockConImagenes
      .filter((producto) => {
        const cumpleCategoria =
          filtroCategoria === "todas" || producto.categoria === filtroCategoria;
        const cumpleBusqueda =
          producto.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
          (producto.codigo &&
            producto.codigo.toLowerCase().includes(busqueda.toLowerCase()));
        return cumpleCategoria && cumpleBusqueda && producto.cantidad > 0;
      })
      .sort((a, b) => {
        if (ordenar === "nombre") return a.nombre.localeCompare(b.nombre);
        if (ordenar === "precio_asc") return a.precio - b.precio;
        if (ordenar === "precio_desc") return b.precio - a.precio;
        if (ordenar === "cantidad") return b.cantidad - a.cantidad;
        return 0;
      });
  }, [stockConImagenes, filtroCategoria, busqueda, ordenar]);

  // Paginación
  const totalPaginas = Math.ceil(
    productosFiltrados.length / PRODUCTOS_POR_PAGINA,
  );
  const indiceInicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
  const productosPagina = productosFiltrados.slice(
    indiceInicio,
    indiceInicio + PRODUCTOS_POR_PAGINA,
  );

  // Calcular totales
  const totales = useMemo(() => {
    const totalProductos = stockConImagenes.reduce(
      (sum, p) => sum + (p.cantidad || 0),
      0,
    );
    const valorTotal = stockConImagenes.reduce(
      (sum, p) => sum + (p.cantidad || 0) * (p.precio || 0),
      0,
    );
    return {
      totalProductos,
      valorTotal,
      productosUnicos: stockConImagenes.length,
    };
  }, [stockConImagenes]);

  const handleCambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFiltroCategoria = (cat) => {
    setFiltroCategoria(cat);
    setPaginaActual(1);
  };

  const handleBusqueda = (valor) => {
    setBusqueda(valor);
    setPaginaActual(1);
  };

  // Generar código de barras único para un producto
  const generarCodigoBarras = useCallback((producto) => {
    // Crear código único: prefijo STK + ID del producto + últimos 4 dígitos del timestamp
    const codigoBase = `STK${String(producto.id).padStart(6, "0")}`;
    return codigoBase;
  }, []);

  // Imprimir código de barras individual
  const imprimirCodigoBarras = useCallback(
    (producto) => {
      const codigo = generarCodigoBarras(producto);
      const ventana = window.open("", "_blank", "width=400,height=300");

      ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Código de Barras - ${producto.nombre}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .etiqueta {
              border: 1px dashed #ccc;
              padding: 15px;
              text-align: center;
              width: 280px;
            }
            .nombre {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 5px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .precio {
              font-size: 18px;
              font-weight: bold;
              color: #e65100;
              margin-bottom: 10px;
            }
            svg {
              max-width: 100%;
            }
            .codigo-texto {
              font-family: monospace;
              font-size: 12px;
              margin-top: 5px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .etiqueta { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="etiqueta">
            <div class="nombre">${producto.nombre}</div>
            <div class="precio">$${formatNumber(producto.precio)}</div>
            <svg id="barcode"></svg>
            <div class="codigo-texto">${codigo}</div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <script>
            JsBarcode("#barcode", "${codigo}", {
              format: "CODE128",
              width: 2,
              height: 50,
              displayValue: false,
              margin: 5
            });
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `);
      ventana.document.close();
    },
    [generarCodigoBarras],
  );

  // Imprimir todos los códigos de barras
  const imprimirTodosLosCodigos = useCallback(() => {
    setImprimiendoTodos(true);
    const productos = productosFiltrados;

    const ventana = window.open("", "_blank", "width=800,height=600");

    let etiquetasHTML = "";
    productos.forEach((producto) => {
      const codigo = generarCodigoBarras(producto);
      etiquetasHTML += `
        <div class="etiqueta">
          <div class="nombre">${producto.nombre}</div>
          <div class="precio">$${formatNumber(producto.precio)}</div>
          <svg id="barcode-${producto.id}"></svg>
          <div class="codigo-texto">${codigo}</div>
        </div>
      `;
    });

    let barcodeScripts = "";
    productos.forEach((producto) => {
      const codigo = generarCodigoBarras(producto);
      barcodeScripts += `
        JsBarcode("#barcode-${producto.id}", "${codigo}", {
          format: "CODE128",
          width: 1.5,
          height: 40,
          displayValue: false,
          margin: 3
        });
      `;
    });

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Códigos de Barras - Mi Stock</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            h1 {
              text-align: center;
              margin-bottom: 20px;
              font-size: 18px;
            }
            .contenedor {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
            }
            .etiqueta {
              border: 1px dashed #ccc;
              padding: 10px;
              text-align: center;
              page-break-inside: avoid;
            }
            .nombre {
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 3px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .precio {
              font-size: 14px;
              font-weight: bold;
              color: #e65100;
              margin-bottom: 5px;
            }
            svg {
              max-width: 100%;
            }
            .codigo-texto {
              font-family: monospace;
              font-size: 10px;
              margin-top: 3px;
            }
            @media print {
              body { margin: 0; padding: 5px; }
              h1 { display: none; }
              .etiqueta { border: 1px dashed #ddd; }
            }
          </style>
        </head>
        <body>
          <h1>Códigos de Barras - ${productos.length} productos</h1>
          <div class="contenedor">
            ${etiquetasHTML}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <script>
            ${barcodeScripts}
            setTimeout(() => {
              window.print();
            }, 800);
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
    setImprimiendoTodos(false);
  }, [productosFiltrados, generarCodigoBarras]);

  // Mostrar modal de código de barras
  const verCodigoBarras = useCallback((producto) => {
    setModalCodigoBarras(producto);
  }, []);

  // Mostrar loading
  if (cargando) {
    return (
      <ClienteLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando catálogo...</span>
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
            <h1 className="text-2xl font-bold text-gray-800">
              📦 Mi Catálogo de Productos
            </h1>
            <p className="text-gray-600">
              Todos los productos disponibles en tu stock
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={cargarStock}
              className="p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-100 border transition-colors"
              title="Actualizar"
            >
              🔄
            </button>
            <button
              onClick={imprimirTodosLosCodigos}
              disabled={imprimiendoTodos || productosFiltrados.length === 0}
              className="px-3 py-2 rounded-lg bg-white text-gray-600 hover:bg-gray-100 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Imprimir todos los códigos de barras"
            >
              🖨️ <span className="hidden sm:inline">Códigos</span>
            </button>
            <button
              onClick={() => setVistaGrid(true)}
              className={`p-2 rounded-lg transition-colors ${
                vistaGrid
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
              title="Vista de cuadrícula"
            >
              ▦
            </button>
            <button
              onClick={() => setVistaGrid(false)}
              className={`p-2 rounded-lg transition-colors ${
                !vistaGrid
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
              title="Vista de lista"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-blue-100 text-sm">Productos Únicos</p>
            <p className="text-2xl font-bold">{totales.productosUnicos}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-sm">Total Unidades</p>
            <p className="text-2xl font-bold">{totales.totalProductos}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-purple-100 text-sm">Categorías</p>
            <p className="text-2xl font-bold">{categorias.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <p className="text-orange-100 text-sm">Valor Total</p>
            <p className="text-2xl font-bold">
              ${formatNumber(totales.valorTotal)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar producto
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  className="input-field pl-10"
                  value={busqueda}
                  onChange={(e) => handleBusqueda(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                className="input-field"
                value={filtroCategoria}
                onChange={(e) => handleFiltroCategoria(e.target.value)}
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                className="input-field"
                value={ordenar}
                onChange={(e) => setOrdenar(e.target.value)}
              >
                <option value="nombre">Nombre A-Z</option>
                <option value="precio_asc">Precio: menor a mayor</option>
                <option value="precio_desc">Precio: mayor a menor</option>
                <option value="cantidad">Mayor cantidad</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFiltroCategoria("todas")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filtroCategoria === "todas"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Todos
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => handleFiltroCategoria(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filtroCategoria === cat
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products */}
        {productosFiltrados.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-6xl mb-4 block">📦</span>
            <h3 className="text-xl font-semibold text-gray-700">
              {stock.length === 0
                ? "Tu stock está vacío"
                : "No se encontraron productos"}
            </h3>
            <p className="text-gray-500 mt-2">
              {stock.length === 0
                ? "Los productos se agregarán automáticamente cuando recibas pedidos"
                : "Intenta con otros filtros o términos de búsqueda"}
            </p>
            {stock.length > 0 && (
              <button
                onClick={() => {
                  setBusqueda("");
                  setFiltroCategoria("todas");
                  setPaginaActual(1);
                }}
                className="mt-4 btn-primary"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : vistaGrid ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosPagina.map((producto, index) => (
              <ProductoCard
                key={`${producto.id}-${index}`}
                producto={producto}
                onVerCodigoBarras={verCodigoBarras}
                onImprimirCodigoBarras={imprimirCodigoBarras}
                generarCodigoBarras={generarCodigoBarras}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {productosPagina.map((producto, index) => (
              <ProductoListItem
                key={`${producto.id}-${index}`}
                producto={producto}
                onVerCodigoBarras={verCodigoBarras}
                onImprimirCodigoBarras={imprimirCodigoBarras}
                generarCodigoBarras={generarCodigoBarras}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPaginas > 1 && (
          <div className="card">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Mostrando {indiceInicio + 1} -{" "}
                {Math.min(
                  indiceInicio + PRODUCTOS_POR_PAGINA,
                  productosFiltrados.length,
                )}{" "}
                de {productosFiltrados.length} productos
              </p>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCambiarPagina(1)}
                  disabled={paginaActual === 1}
                  className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ⟪
                </button>
                <button
                  onClick={() => handleCambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ←
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter((num) => {
                      if (totalPaginas <= 5) return true;
                      if (num === 1 || num === totalPaginas) return true;
                      if (Math.abs(num - paginaActual) <= 1) return true;
                      return false;
                    })
                    .map((num, idx, arr) => (
                      <span key={num} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== num - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => handleCambiarPagina(num)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            paginaActual === num
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {num}
                        </button>
                      </span>
                    ))}
                </div>

                <button
                  onClick={() => handleCambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  →
                </button>
                <button
                  onClick={() => handleCambiarPagina(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ⟫
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Código de Barras */}
        {modalCodigoBarras && (
          <ModalCodigoBarras
            producto={modalCodigoBarras}
            onClose={() => setModalCodigoBarras(null)}
            onImprimir={() => imprimirCodigoBarras(modalCodigoBarras)}
            generarCodigoBarras={generarCodigoBarras}
          />
        )}
      </div>
    </ClienteLayout>
  );
}

function ProductoCard({
  producto,
  onVerCodigoBarras,
  onImprimirCodigoBarras,
  generarCodigoBarras,
}) {
  const stockBajo = producto.cantidad > 0 && producto.cantidad <= 10;
  const codigoBarras = generarCodigoBarras(producto);

  return (
    <div className="card hover:shadow-lg transition-shadow overflow-hidden group">
      {/* Image */}
      <div className="relative -mx-6 -mt-6 mb-4 h-48 bg-gray-100 overflow-hidden">
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-6xl opacity-50">📦</span>
          </div>
        )}
        {stockBajo && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
            Stock bajo
          </span>
        )}
        {producto.categoria && producto.categoria !== "Sin categoría" && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-white/90 text-gray-600 text-xs font-medium rounded-full">
            {producto.categoria}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {producto.depositoNombre && (
          <div className="flex items-center gap-2">
            <span className="text-lg">{producto.depositoImagen}</span>
            <span className="text-xs text-gray-500 truncate">
              {producto.depositoNombre}
            </span>
          </div>
        )}
        <p className="text-xs text-gray-400 font-mono">{codigoBarras}</p>
        <h3 className="font-semibold text-gray-800 line-clamp-2">
          {producto.nombre}
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-primary">
            ${formatNumber(producto.precio)}
          </p>
          <p
            className={`text-sm ${stockBajo ? "text-orange-500 font-medium" : "text-gray-500"}`}
          >
            {producto.cantidad} unidades
          </p>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Valor total:{" "}
            <span className="font-semibold text-gray-700">
              ${formatNumber(producto.cantidad * producto.precio)}
            </span>
          </p>
        </div>

        {/* Botones de código de barras */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onVerCodigoBarras(producto)}
            className="flex-1 text-xs py-2 px-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            📊 Ver código
          </button>
          <button
            onClick={() => onImprimirCodigoBarras(producto)}
            className="flex-1 text-xs py-2 px-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductoListItem({
  producto,
  onVerCodigoBarras,
  onImprimirCodigoBarras,
  generarCodigoBarras,
}) {
  const stockBajo = producto.cantidad > 0 && producto.cantidad <= 10;
  const codigoBarras = generarCodigoBarras(producto);

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Image */}
        <div className="relative w-full md:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {producto.imagen ? (
            <img
              src={producto.imagen}
              alt={producto.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl opacity-50">📦</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {producto.depositoImagen && (
                <span className="text-lg">{producto.depositoImagen}</span>
              )}
              {producto.depositoNombre && (
                <span className="text-xs text-gray-500">
                  {producto.depositoNombre}
                </span>
              )}
              {producto.categoria && producto.categoria !== "Sin categoría" && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {producto.categoria}
                </span>
              )}
              {stockBajo && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                  Stock bajo
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono mb-1">
              {codigoBarras}
            </p>
            <h3 className="font-semibold text-gray-800">{producto.nombre}</h3>
          </div>

          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <p className="text-2xl font-bold text-primary">
                ${formatNumber(producto.precio)}
              </p>
              <p
                className={`text-sm ${stockBajo ? "text-orange-500 font-medium" : "text-gray-500"}`}
              >
                {producto.cantidad} unidades
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">
                Valor:{" "}
                <span className="font-semibold">
                  ${formatNumber(producto.cantidad * producto.precio)}
                </span>
              </p>
              <button
                onClick={() => onVerCodigoBarras(producto)}
                className="text-xs py-1.5 px-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                title="Ver código de barras"
              >
                📊
              </button>
              <button
                onClick={() => onImprimirCodigoBarras(producto)}
                className="text-xs py-1.5 px-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                title="Imprimir código de barras"
              >
                🖨️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente Modal para ver código de barras
function ModalCodigoBarras({
  producto,
  onClose,
  onImprimir,
  generarCodigoBarras,
}) {
  const barcodeRef = useRef(null);
  const codigo = generarCodigoBarras(producto);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, codigo, {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: "#ffffff",
      });
    }
  }, [codigo]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">📊 Código de Barras</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-4">
            <h4 className="font-semibold text-gray-800 text-lg">
              {producto.nombre}
            </h4>
            <p className="text-2xl font-bold text-primary mt-1">
              ${formatNumber(producto.precio)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {producto.cantidad} unidades en stock
            </p>
          </div>

          {/* Barcode */}
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4 flex justify-center">
            <svg ref={barcodeRef}></svg>
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">
            Código: {codigo}
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={onImprimir}
            className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
