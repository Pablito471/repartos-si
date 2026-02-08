import { useState, useEffect } from "react";
import api from "@/services/api";
import Swal from "sweetalert2";
import * as Icons from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import QRCode from "qrcode";

export default function StockManager() {
    const router = useRouter();
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
    const [mostrarModalDescontar, setMostrarModalDescontar] = useState(false);
    const [mostrarModalGranel, setMostrarModalGranel] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [historial, setHistorial] = useState([]);
    const [filtroTipo, setFiltroTipo] = useState("todos"); // todos, unidades, granel

    // Estado para el modal de QR
    const [mostrarModalQR, setMostrarModalQR] = useState(false);
    const [productoQR, setProductoQR] = useState(null);

    const [nuevoProducto, setNuevoProducto] = useState({
        nombre: "",
        cantidad: "",
        precio: "",
        precioCosto: "",
        precioVenta: "",
        registrarCompra: true,
        codigoBarras: "",
        esGranel: false,
        unidadMedida: "kg",
        precioUnidad: "",
    });

    const [descuento, setDescuento] = useState({
        nombre: "",
        cantidad: "",
        motivo: "Venta",
        precioVenta: "",
        registrarVenta: true,
    });



    // State for edit modal
    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
    const [productoEditar, setProductoEditar] = useState(null);

    const abrirModalEditar = (producto) => {
        setProductoEditar({
            ...producto,
            precioVenta: parseFloat(producto.precioVenta) || parseFloat(producto.precio) || 0,
            precioCosto: parseFloat(producto.precioCosto) || 0
        });
        setMostrarModalEditar(true);
    };

    const handleEditarProducto = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const res = await api.put(`/stock/${productoEditar.id}`, {
                nombre: productoEditar.nombre,
                precioVenta: productoEditar.precioVenta,
                precioCosto: productoEditar.precioCosto
            });

            if (res.success) {
                Swal.fire({
                    icon: "success",
                    title: "Producto actualizado",
                    showConfirmButton: false,
                    timer: 1500,
                });
                setMostrarModalEditar(false);
                setProductoEditar(null);
                cargarDatos();
            }
        } catch (error) {
            Swal.fire("Error", "No se pudo actualizar el producto", "error");
        } finally {
            setGuardando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [resStock, resHistorial] = await Promise.all([
                api.get("/stock"),
                api.get("/stock/historial"),
            ]);

            if (resStock.success) {
                setStock(resStock.data);
            }
            if (resHistorial.success) {
                setHistorial(resHistorial.data);
            }
        } catch (error) {
            console.error("Error al cargar datos:", error);
            Swal.fire("Error", "No se pudieron cargar los datos del stock", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAgregarProducto = async (e) => {
        e.preventDefault();
        setGuardando(true);

        try {
            const res = await api.post("/stock/agregar", nuevoProducto);

            if (res.success) {
                Swal.fire({
                    icon: "success",
                    title: "Producto agregado",
                    showConfirmButton: false,
                    timer: 1500,
                });
                setMostrarModalAgregar(false);
                setNuevoProducto({
                    nombre: "",
                    cantidad: "",
                    precio: "",
                    precioCosto: "",
                    precioVenta: "",
                    registrarCompra: true,
                    codigoBarras: "",
                    esGranel: false,
                    unidadMedida: "kg",
                    precioUnidad: "",
                });
                cargarDatos();
            }
        } catch (error) {
            Swal.fire(
                "Error",
                error.response?.data?.message || "Error al agregar producto",
                "error",
            );
        } finally {
            setGuardando(false);
        }
    };

    const handleAgregarGranel = async (e) => {
        e.preventDefault();
        setGuardando(true);

        try {
            // Configuramos el producto como granel automáticamente
            const productoGranel = {
                ...nuevoProducto,
                esGranel: true,
                unidadMedida: "kg",
                cantidad: 0, // Inicia con 0 kg
                registrarCompra: false,
            };

            const res = await api.post("/stock/agregar", productoGranel);

            if (res.success) {
                Swal.fire({
                    icon: "success",
                    title: "Producto a granel creado",
                    text: "Ahora puedes actualizar el stock pesable",
                    showConfirmButton: false,
                    timer: 1500,
                });
                setMostrarModalGranel(false);
                setNuevoProducto({
                    nombre: "",
                    cantidad: "",
                    precio: "",
                    precioCosto: "",
                    precioVenta: "",
                    registrarCompra: true,
                    codigoBarras: "",
                    esGranel: false,
                    unidadMedida: "kg",
                    precioUnidad: "",
                });
                cargarDatos();
            }
        } catch (error) {
            Swal.fire(
                "Error",
                error.response?.data?.message || "Error al crear producto a granel",
                "error",
            );
        } finally {
            setGuardando(false);
        }
    };

    const handleDescontarStock = async (e) => {
        e.preventDefault();
        setGuardando(true);

        try {
            const res = await api.post("/stock/descontar", descuento);

            if (res.success) {
                Swal.fire({
                    icon: "success",
                    title: "Stock actualizado",
                    showConfirmButton: false,
                    timer: 1500,
                });
                setMostrarModalDescontar(false);
                setDescuento({
                    nombre: "",
                    cantidad: "",
                    motivo: "Venta",
                    precioVenta: "",
                    registrarVenta: true,
                });
                cargarDatos();
            }
        } catch (error) {
            Swal.fire(
                "Error",
                error.response?.data?.message || "Error al descontar stock",
                "error",
            );
        } finally {
            setGuardando(false);
        }
    };

    const agregarAlStock = async (pedidoId) => {
        try {
            const result = await Swal.fire({
                title: "¿Agregar al stock?",
                text: "Se sumarán los productos de este pedido a tu inventario",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Sí, agregar",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#f97316",
            });

            if (result.isConfirmed) {
                const res = await api.post(`/stock/agregar-desde-pedido/${pedidoId}`);
                if (res.success) {
                    Swal.fire("¡Listo!", "Productos agregados al stock", "success");
                    cargarDatos();
                }
            }
        } catch (error) {
            Swal.fire(
                "Error",
                error.response?.data?.message || "Error al procesar",
                "error",
            );
        }
    };

    const eliminarProducto = async (id, nombre) => {
        try {
            const result = await Swal.fire({
                title: "¿Estás seguro?",
                text: `Se eliminará "${nombre}" y todo su historial`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
            });

            if (result.isConfirmed) {
                const res = await api.delete(`/stock/${id}`);
                if (res.success) {
                    Swal.fire("Eliminado", "El producto ha sido eliminado", "success");
                    cargarDatos();
                }
            }
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo eliminar el producto", "error");
        }
    };

    const generarQR = async (producto) => {
        try {
            const codigo = producto.codigoBarras || producto.codigo || "";
            if (!codigo) {
                Swal.fire("Error", "El producto no tiene código de barras", "error");
                return;
            }

            setProductoQR(producto);
            setMostrarModalQR(true);

            // Esperar a que el modal se renderice
            setTimeout(async () => {
                const canvas = document.getElementById("qr-canvas");
                if (canvas) {
                    await QRCode.toCanvas(canvas, codigo, {
                        width: 200,
                        margin: 2,
                        color: {
                            dark: "#000000",
                            light: "#ffffff",
                        },
                    });
                }
            }, 100);
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo generar el código QR", "error");
        }
    };

    const descargarQR = () => {
        const canvas = document.getElementById("qr-canvas");
        if (canvas) {
            const url = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = url;
            a.download = `QR-${productoQR.nombre}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const imprimirQR = () => {
        const canvas = document.getElementById("qr-canvas");
        if (canvas) {
            const url = canvas.toDataURL("image/png");
            const windowContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Imprimir QR - ${productoQR.nombre}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: sans-serif;
              }
              img {
                max-width: 300px;
                margin-bottom: 20px;
              }
              .info {
                text-align: center;
              }
              .nombre {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .codigo {
                font-family: monospace;
                font-size: 16px;
                color: #555;
              }
              .precio {
                font-size: 28px;
                font-weight: bold;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="info">
              <div class="nombre">${productoQR.nombre}</div>
              <div class="codigo">${productoQR.codigoBarras || ""}</div>
            </div>
            <img src="${url}" />
            <div class="precio">
              $${(productoQR.precioVenta || productoQR.precio || 0).toLocaleString()}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `;
            const printWindow = window.open("", "", "width=600,height=600");
            printWindow.document.write(windowContent);
            printWindow.document.close();
        }
    };

    // Filtrado de productos
    const productosFiltrados = stock.filter((item) => {
        const coincideBusqueda = item.nombre
            .toLowerCase()
            .includes(busqueda.toLowerCase());

        const coincideTipo =
            filtroTipo === "todos"
                ? true
                : filtroTipo === "granel"
                    ? item.esGranel
                    : !item.esGranel;

        return coincideBusqueda && coincideTipo;
    });

    return (
        <div className="space-y-6">
            {/* Header y Acciones */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mi Stock</h1>
                    <p className="text-gray-500">Administra tu inventario y precios</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {router.pathname.includes("/empleado") && (
                        <Link
                            href="/empleado"
                            className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2"
                        >
                            <Icons.ArrowLeft className="w-5 h-5" />
                            Volver
                        </Link>
                    )}
                    <button
                        onClick={() => setMostrarModalGranel(true)}
                        className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"
                    >
                        <Icons.Scale className="w-5 h-5" />
                        Carga Rápida Granel
                    </button>
                    <button
                        onClick={() => setMostrarModalAgregar(true)}
                        className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2"
                    >
                        <Icons.Plus className="w-5 h-5" />
                        Nuevo Producto
                    </button>
                    {!router.pathname.includes("/empleado") && (
                        <button
                            onClick={() => setMostrarModalDescontar(true)}
                            className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2"
                        >
                            <Icons.MinusCircle className="w-5 h-5" />
                            Descontar
                        </button>
                    )}
                </div>
            </div>

            {/* Buscador y Filtros */}
            <div className="card p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            className="input-field pl-10 w-full"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    {/* Tabs de Filtro */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setFiltroTipo("todos")}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${filtroTipo === "todos"
                                ? "bg-white text-gray-800 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFiltroTipo("unidades")}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${filtroTipo === "unidades"
                                ? "bg-white text-gray-800 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Unidades
                        </button>
                        <button
                            onClick={() => setFiltroTipo("granel")}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${filtroTipo === "granel"
                                ? "bg-white text-gray-800 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            A Granel
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de Stock */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="card h-24 animate-pulse"></div>
                            ))}
                        </div>
                    ) : productosFiltrados.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <Icons.PackageOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No se encontraron productos</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {productosFiltrados.map((item) => (
                                <div
                                    key={item.id}
                                    className="card p-4 flex items-center justify-between group hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold text-xl">
                                            {item.nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">
                                                {item.nombre}
                                                {item.esGranel && (
                                                    <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                                        Granel
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Icons.Package className="w-4 h-4" />
                                                    {parseFloat(item.cantidad)} {item.esGranel ? (item.unidadMedida === 'kg' ? 'Kg' : item.unidadMedida) : 'unidades'}
                                                </span>
                                                {item.codigoBarras && (
                                                    <span className="flex items-center gap-1 font-mono bg-gray-100 px-1 rounded text-xs">
                                                        <Icons.Barcode className="w-3 h-3" />
                                                        {item.codigoBarras}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <p className="font-bold text-lg text-gray-800">
                                                <span className="text-xs text-gray-400 font-normal mr-1">Venta:</span>
                                                ${(parseFloat(item.precioVenta) || parseFloat(item.precio) || 0).toLocaleString()}
                                                {item.esGranel && <span className="text-xs font-normal text-gray-500"> / kg</span>}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                <span className="text-xs text-gray-400 mr-1">Costo:</span>
                                                ${(parseFloat(item.precioCosto) || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => abrirModalEditar(item)}
                                                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Editar Precio"
                                            >
                                                <Icons.Edit2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => generarQR(item)}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                                title="Ver Código QR"
                                            >
                                                <Icons.QrCode className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => eliminarProducto(item.id, item.nombre)}
                                                className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                title="Eliminar"
                                            >
                                                <Icons.Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Historial de entregas */}
                <div className="card h-fit sticky top-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Icons.Clock className="w-5 h-5 text-primary" />
                        Historial de Pedidos
                    </h2>

                    {historial.filter((h) => h.agregadoAlStock).length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                            <Icons.Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">
                                No hay pedidos agregados al stock aún
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {historial
                                .filter((h) => h.agregadoAlStock)
                                .map((pedido) => (
                                    <div
                                        key={pedido.pedidoId}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Icons.CheckCircle className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    Pedido #{pedido.numero}
                                                </p>
                                                <p className="text-sm text-gray-500 line-clamp-1">
                                                    {pedido.productos?.length} productos
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-semibold text-gray-800">
                                                ${pedido.total?.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-green-600 font-medium">
                                                ✓ Agregado
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex gap-3">
                                <span className="text-2xl">💡</span>
                                <div>
                                    <h3 className="font-medium text-blue-800 mb-1">
                                        ¿Cómo funciona?
                                    </h3>
                                    <p className="text-sm text-blue-700">
                                        Aquí verás los pedidos que ya has sumado a tu inventario.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Carga Rápida Granel */}
            {mostrarModalGranel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animation-fade-in">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    💰 Precio de costo (por Kilo)
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animation-fade-in">
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

            {/* Modal Editar Producto */}
            {mostrarModalEditar && productoEditar && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animation-fade-in">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Editar Producto
                                </h2>
                                <button
                                    onClick={() => setMostrarModalEditar(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleEditarProducto} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    className="input-field w-full"
                                    value={productoEditar.nombre}
                                    onChange={(e) =>
                                        setProductoEditar({ ...productoEditar, nombre: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Precio Venta
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            className="input-field w-full pl-7"
                                            value={productoEditar.precioVenta}
                                            onChange={(e) =>
                                                setProductoEditar({ ...productoEditar, precioVenta: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Costo
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            className="input-field w-full pl-7 bg-gray-100 text-gray-500 cursor-not-allowed"
                                            value={productoEditar.precioCosto}
                                            readOnly
                                            title="El costo no se puede modificar. Agregue un nuevo lote con distinto código si el costo cambió."
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={guardando}
                                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-bold text-lg shadow-md transition-all active:scale-95"
                            >
                                {guardando ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Descontar Stock */}
            {mostrarModalDescontar && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animation-fade-in">
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animation-fade-in">
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
        </div>
    );
}
