import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useCliente } from "@/context/ClienteContext";
import { formatNumber } from "@/utils/formatters";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState } from "react";
import { showToast } from "@/utils/alerts";

const PRODUCTOS_POR_PAGINA = 8;

export default function ProductosDeposito() {
  const router = useRouter();
  const { id } = router.query;
  const {
    depositos,
    carrito,
    agregarAlCarrito,
    getCantidadCarrito,
    getTotalCarrito,
  } = useCliente();
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [ordenar, setOrdenar] = useState("nombre");
  const [vistaGrid, setVistaGrid] = useState(true);

  const depositoId = parseInt(id);

  // Encontrar el depósito
  const deposito = depositos.find((d) => d.id === depositoId);

  if (!deposito) {
    return (
      <ClienteLayout>
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">🏭</span>
          <h3 className="text-xl font-semibold text-gray-700">
            Depósito no encontrado
          </h3>
          <p className="text-gray-500 mt-2">El depósito que buscas no existe</p>
          <Link
            href="/clientes/depositos"
            className="btn-primary mt-4 inline-block"
          >
            Volver a depósitos
          </Link>
        </div>
      </ClienteLayout>
    );
  }

  const productos = deposito.productos || [];

  // Obtener categorías únicas
  const categorias = [...new Set(productos.map((p) => p.categoria))];

  // Filtrar productos
  const productosFiltrados = productos
    .filter((producto) => {
      const cumpleCategoria =
        filtroCategoria === "todas" || producto.categoria === filtroCategoria;
      const cumpleBusqueda =
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.codigo.toLowerCase().includes(busqueda.toLowerCase());
      return cumpleCategoria && cumpleBusqueda && producto.stock > 0;
    })
    .sort((a, b) => {
      if (ordenar === "nombre") return a.nombre.localeCompare(b.nombre);
      if (ordenar === "precio_asc") return a.precio - b.precio;
      if (ordenar === "precio_desc") return b.precio - a.precio;
      if (ordenar === "stock") return b.stock - a.stock;
      return 0;
    });

  // Paginación
  const totalPaginas = Math.ceil(
    productosFiltrados.length / PRODUCTOS_POR_PAGINA,
  );
  const indiceInicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
  const productosPagina = productosFiltrados.slice(
    indiceInicio,
    indiceInicio + PRODUCTOS_POR_PAGINA,
  );

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

  const handleAgregarCarrito = (producto) => {
    agregarAlCarrito(producto, depositoId);
    showToast("success", `${producto.nombre} agregado al carrito`);
  };

  // Obtener cantidad en carrito de un producto (del mismo depósito)
  const getCantidadEnCarrito = (productoId) => {
    const item = carrito.productos.find(
      (p) => p.id === productoId && p.depositoId === depositoId,
    );
    return item ? item.cantidad : 0;
  };

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/clientes/depositos" className="hover:text-primary">
            Depósitos
          </Link>
          <span>›</span>
          <span className="text-gray-800">{deposito.nombre}</span>
        </nav>

        {/* Header */}
        <div className="card bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-5xl">{deposito.imagen}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {deposito.nombre}
                </h1>
                <p className="text-gray-600">📍 {deposito.direccion}</p>
                <p className="text-gray-600">🕐 {deposito.horario}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setVistaGrid(true)}
                className={`p-2 rounded-lg transition-colors ${
                  vistaGrid
                    ? "bg-primary text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
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
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
                title="Vista de lista"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-blue-100 text-sm">Total Productos</p>
            <p className="text-2xl font-bold">{productos.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-sm">Categorías</p>
            <p className="text-2xl font-bold">{categorias.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-purple-100 text-sm">En esta página</p>
            <p className="text-2xl font-bold">{productosPagina.length}</p>
          </div>
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <p className="text-orange-100 text-sm">Resultados</p>
            <p className="text-2xl font-bold">{productosFiltrados.length}</p>
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
                <option value="precio_asc">Precio: Menor a Mayor</option>
                <option value="precio_desc">Precio: Mayor a Menor</option>
                <option value="stock">Disponibilidad</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
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
        </div>

        {/* Products */}
        {productosFiltrados.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-xl font-semibold text-gray-700">
              No se encontraron productos
            </h3>
            <p className="text-gray-500 mt-2">
              Intenta con otros filtros o términos de búsqueda
            </p>
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
          </div>
        ) : vistaGrid ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosPagina.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                deposito={deposito}
                onAgregarCarrito={handleAgregarCarrito}
                cantidadEnCarrito={getCantidadEnCarrito(producto.id)}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {productosPagina.map((producto) => (
              <ProductoListItem
                key={producto.id}
                producto={producto}
                deposito={deposito}
                onAgregarCarrito={handleAgregarCarrito}
                cantidadEnCarrito={getCantidadEnCarrito(producto.id)}
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

        {/* Action Button */}
        <div className="card bg-green-50 border border-green-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-green-800">
                ¿Listo para hacer tu pedido?
              </h3>
              <p className="text-green-700 text-sm">
                Selecciona los productos que necesitas y realiza tu pedido desde
                este depósito
              </p>
            </div>
            <Link
              href={`/clientes/pedidos/nuevo?deposito=${deposito.id}`}
              className="btn-primary whitespace-nowrap"
            >
              📦 Crear pedido
            </Link>
          </div>
        </div>

        {/* Floating Cart Bar */}
        {getCantidadCarrito() > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 animate-fade-in">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {getCantidadCarrito()}{" "}
                    {getCantidadCarrito() === 1 ? "producto" : "productos"}
                  </p>
                  <p className="text-primary font-bold">
                    Total: ${formatNumber(getTotalCarrito())}
                  </p>
                </div>
              </div>
              <Link
                href="/clientes/pedidos/nuevo"
                className="btn-primary whitespace-nowrap"
              >
                Continuar con el pedido →
              </Link>
            </div>
          </div>
        )}
      </div>
    </ClienteLayout>
  );
}

function ProductoCard({
  producto,
  deposito,
  onAgregarCarrito,
  cantidadEnCarrito,
}) {
  const stockBajo = producto.stock <= 10;

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
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-50">📦</span>
          </div>
        )}
        {stockBajo && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
            Últimas unidades
          </span>
        )}
        <span className="absolute top-2 left-2 px-2 py-1 bg-white/90 text-gray-600 text-xs font-medium rounded-full">
          {producto.categoria}
        </span>
        {cantidadEnCarrito > 0 && (
          <span className="absolute bottom-2 right-2 w-8 h-8 bg-primary text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg">
            {cantidadEnCarrito}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 font-mono">{producto.codigo}</p>
        <h3 className="font-semibold text-gray-800 line-clamp-2">
          {producto.nombre}
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-primary">
            ${formatNumber(producto.precio)}
          </p>
          <p className="text-sm text-gray-500">{producto.stock} disp.</p>
        </div>

        <button
          onClick={() => onAgregarCarrito(producto)}
          className={`w-full mt-2 ${cantidadEnCarrito > 0 ? "btn-secondary" : "btn-primary"}`}
        >
          {cantidadEnCarrito > 0
            ? `🛒 Agregar más (${cantidadEnCarrito})`
            : "🛒 Agregar al pedido"}
        </button>
      </div>
    </div>
  );
}

function ProductoListItem({
  producto,
  deposito,
  onAgregarCarrito,
  cantidadEnCarrito,
}) {
  const stockBajo = producto.stock <= 10;

  return (
    <div
      className={`card hover:shadow-lg transition-shadow ${cantidadEnCarrito > 0 ? "ring-2 ring-primary/30" : ""}`}
    >
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
          {cantidadEnCarrito > 0 && (
            <span className="absolute bottom-2 right-2 w-7 h-7 bg-primary text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg">
              {cantidadEnCarrito}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                {producto.categoria}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {producto.codigo}
              </span>
              {stockBajo && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                  Últimas unidades
                </span>
              )}
              {cantidadEnCarrito > 0 && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                  En carrito: {cantidadEnCarrito}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-800 text-lg">
              {producto.nombre}
            </h3>
            <p className="text-sm text-gray-500">
              {producto.stock} unidades disponibles
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <p className="text-2xl font-bold text-primary">
              ${formatNumber(producto.precio)}
            </p>
            <button
              onClick={() => onAgregarCarrito(producto)}
              className={`whitespace-nowrap ${cantidadEnCarrito > 0 ? "btn-secondary" : "btn-primary"}`}
            >
              {cantidadEnCarrito > 0 ? "🛒 Agregar más" : "🛒 Agregar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
