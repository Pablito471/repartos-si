import EmpleadoLayout from "@/components/layouts/EmpleadoLayout";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { empleadosAPI } from "@/services/api";
import Swal from "sweetalert2";
import Image from "next/image";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import ModalPagoVenta from "@/components/ModalPagoVenta";

export default function EmpleadoEscaner() {
  const { usuario } = useAuth();
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  const [escaneando, setEscaneando] = useState(false);
  const [productoEscaneado, setProductoEscaneado] = useState(null);
  const [errorCamara, setErrorCamara] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [procesando, setProcesando] = useState(false);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [modoManual, setModoManual] = useState(false);
  const [codigoManual, setCodigoManual] = useState("");
  const [totalDia, setTotalDia] = useState(0);
  const [modoOperacion, setModoOperacion] = useState("vender"); // "vender", "stock", "precio"

  // Estado para crear nuevo producto
  const [mostrarFormCrear, setMostrarFormCrear] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    codigo: "",
    nombre: "",
    categoria: "",
    precio: "",
    precioVenta: "",
    cantidad: "",
  });

  // Referencias para audio
  const audioContextRef = useRef(null);

  // Ref para evitar lecturas múltiples del mismo código
  const ultimaLecturaRef = useRef({ codigo: null, timestamp: 0 });
  const DEBOUNCE_TIME = 2000; // 2 segundos entre lecturas del mismo código

  // Estado para controlar cuándo iniciar realmente el escáner
  const [iniciarEscanerPendiente, setIniciarEscanerPendiente] = useState(false);

  // Estado para modal de pago
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [ventaPendiente, setVentaPendiente] = useState(null);

  // Función para reproducir sonido de escaneo
  const reproducirSonidoEscaneo = useCallback(async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      let ctx = audioContextRef.current;

      if (!ctx) {
        ctx = new AudioContext();
        audioContextRef.current = ctx;
      }

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 1500;
      oscillator.type = "square";
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.error("Error al reproducir sonido:", e);
    }
  }, []);

  // Función para preparar el escáner (muestra el div primero)
  const prepararEscaner = () => {
    setErrorCamara(null);
    setEscaneando(true);
    setIniciarEscanerPendiente(true);
  };

  // Iniciar escáner real (cuando el div ya existe)
  const iniciarEscanerReal = async () => {
    try {
      // Verificar que el elemento existe
      const readerElement = document.getElementById("reader");
      if (!readerElement) {
        console.error("Elemento reader no encontrado");
        return;
      }

      const html5Qrcode = new Html5Qrcode("reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      html5QrcodeRef.current = html5Qrcode;

      const config = {
        fps: 15,
        aspectRatio: 1.777,
      };

      await html5Qrcode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        () => {},
      );
    } catch (err) {
      console.error("Error al iniciar escáner:", err);
      setErrorCamara("No se pudo acceder a la cámara. Verifica los permisos.");
      setEscaneando(false);
    }
  };

  // useEffect para iniciar el escáner cuando el div está listo
  useEffect(() => {
    if (iniciarEscanerPendiente && escaneando) {
      // Pequeño delay para asegurar que el DOM está actualizado
      const timer = setTimeout(() => {
        iniciarEscanerReal();
        setIniciarEscanerPendiente(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [iniciarEscanerPendiente, escaneando]);

  // Función legacy para compatibilidad (ahora usa prepararEscaner)
  const iniciarEscaner = async () => {
    prepararEscaner();
  };

  // Detener escáner
  const detenerEscaner = async () => {
    try {
      if (html5QrcodeRef.current) {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current = null;
      }
      setEscaneando(false);
    } catch (err) {
      console.error("Error al detener escáner:", err);
    }
  };

  // Cuando se escanea exitosamente
  const onScanSuccess = async (decodedText) => {
    // Evitar si ya está procesando
    if (procesando) return;

    const ahora = Date.now();
    const { codigo: ultimoCodigo, timestamp: ultimoTimestamp } =
      ultimaLecturaRef.current;

    // Evitar lecturas repetidas del mismo código en corto tiempo
    if (
      decodedText === ultimoCodigo &&
      ahora - ultimoTimestamp < DEBOUNCE_TIME
    ) {
      return;
    }

    // Actualizar última lectura
    ultimaLecturaRef.current = { codigo: decodedText, timestamp: ahora };

    await reproducirSonidoEscaneo();
    await buscarProducto(decodedText);
  };

  // Buscar producto por código
  const buscarProducto = async (codigo) => {
    setProcesando(true);
    try {
      const response = await empleadosAPI.buscarProducto(codigo);

      if (response.success && response.data) {
        setProductoEscaneado(response.data);
        setMostrarFormCrear(false);
        setCantidad(1);
      } else {
        // Producto no encontrado - ofrecer crear
        ofrecerCrearProducto(codigo);
      }
    } catch (error) {
      console.error("Error al buscar producto:", error);
      // Si el error es 404, ofrecer crear el producto
      if (error.response?.status === 404) {
        ofrecerCrearProducto(codigo);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message || "No se pudo buscar el producto",
        });
      }
    } finally {
      setProcesando(false);
    }
  };

  // Ofrecer crear producto nuevo
  const ofrecerCrearProducto = (codigo) => {
    Swal.fire({
      icon: "question",
      title: "Producto no encontrado",
      text: `¿Deseas crear un nuevo producto con el código ${codigo}?`,
      showCancelButton: true,
      confirmButtonText: "Sí, crear producto",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3085d6",
    }).then((result) => {
      if (result.isConfirmed) {
        setNuevoProducto({
          codigo: codigo,
          nombre: "",
          categoria: "",
          precio: "",
          precioVenta: "",
          cantidad: "1",
        });
        setMostrarFormCrear(true);
        setProductoEscaneado(null);
      }
    });
  };

  // Crear producto nuevo
  const crearProducto = async (e) => {
    e.preventDefault();
    if (!nuevoProducto.nombre) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "El nombre del producto es requerido",
      });
      return;
    }

    setProcesando(true);
    try {
      const response = await empleadosAPI.crearProducto({
        codigo: nuevoProducto.codigo,
        nombre: nuevoProducto.nombre,
        categoria: nuevoProducto.categoria || "General",
        precio: parseFloat(nuevoProducto.precio) || 0,
        precioVenta:
          parseFloat(nuevoProducto.precioVenta) ||
          parseFloat(nuevoProducto.precio) ||
          0,
        cantidad: parseInt(nuevoProducto.cantidad) || 0,
      });

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Producto creado",
          html: `
            <p><strong>${response.data.nombre}</strong></p>
            <p>Stock inicial: ${response.data.stock || response.data.cantidad || 0} unidades</p>
          `,
          timer: 2500,
          showConfirmButton: false,
        });

        // NO mostrar el producto como escaneado para evitar operaciones accidentales
        setProductoEscaneado(null);
        setMostrarFormCrear(false);
        setCantidad(1);
        setNuevoProducto({
          codigo: "",
          nombre: "",
          categoria: "",
          precio: "",
          precioVenta: "",
          cantidad: "",
        });
      }
    } catch (error) {
      console.error("Error al crear producto:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "No se pudo crear el producto",
      });
    } finally {
      setProcesando(false);
    }
  };

  // Cancelar creación de producto
  const cancelarCreacion = () => {
    setMostrarFormCrear(false);
    setNuevoProducto({
      codigo: "",
      nombre: "",
      categoria: "",
      precio: "",
      precioVenta: "",
      cantidad: "",
    });
  };

  // Realizar venta - abre modal de pago primero
  const realizarVenta = async () => {
    if (!productoEscaneado || cantidad <= 0) return;

    const stockDisponible =
      productoEscaneado.stock || productoEscaneado.cantidad || 0;

    if (cantidad > stockDisponible) {
      Swal.fire({
        icon: "error",
        title: "Stock insuficiente",
        text: `Solo hay ${stockDisponible} unidades disponibles`,
      });
      return;
    }

    const precioVenta =
      productoEscaneado.precioVenta || productoEscaneado.precio || 0;
    const subtotal = precioVenta * cantidad;

    // Guardar datos de la venta pendiente y abrir modal de pago
    setVentaPendiente({
      producto: productoEscaneado,
      cantidad,
      precioUnitario: precioVenta,
      subtotal,
    });
    setMostrarModalPago(true);
  };

  // Confirmar venta después del pago
  const confirmarVentaConPago = async (datosPago) => {
    if (!ventaPendiente) return;

    setProcesando(true);
    setMostrarModalPago(false);

    try {
      const {
        producto,
        cantidad: cantidadVenta,
        precioUnitario,
        subtotal,
      } = ventaPendiente;

      // Realizar la venta usando la API de empleados
      await empleadosAPI.vender(producto.id, cantidadVenta, precioUnitario);

      // Agregar al historial
      const nuevaVenta = {
        id: Date.now(),
        producto: producto.nombre,
        cantidad: cantidadVenta,
        precioUnitario,
        subtotal,
        hora: new Date().toLocaleTimeString(),
        metodoPago: datosPago.metodoPago,
      };

      setHistorialVentas((prev) => [nuevaVenta, ...prev]);
      setTotalDia((prev) => prev + subtotal);

      const metodoPagoTexto =
        datosPago.metodoPago === "efectivo"
          ? `💵 Efectivo${datosPago.vuelto > 0 ? ` (Vuelto: $${datosPago.vuelto.toLocaleString("es-AR")})` : ""}`
          : "📱 Transferencia/QR";

      Swal.fire({
        icon: "success",
        title: "¡Venta completada!",
        html: `
          <p><strong>${producto.nombre}</strong></p>
          <p>${cantidadVenta} x $${precioUnitario.toLocaleString()} = <strong>$${subtotal.toLocaleString()}</strong></p>
          <p class="mt-2 text-sm">${metodoPagoTexto}</p>
        `,
        timer: 2500,
        showConfirmButton: false,
      });

      // Limpiar
      setProductoEscaneado(null);
      setCantidad(1);
      setVentaPendiente(null);
    } catch (error) {
      console.error("Error al registrar venta:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "No se pudo registrar la venta",
      });
    } finally {
      setProcesando(false);
    }
  };

  // Cancelar modal de pago
  const cancelarPago = () => {
    setMostrarModalPago(false);
    setVentaPendiente(null);
  };

  // Agregar stock
  const agregarStock = async () => {
    if (!productoEscaneado || cantidad <= 0) return;

    setProcesando(true);
    try {
      await empleadosAPI.agregarStock(productoEscaneado.id, cantidad);

      Swal.fire({
        icon: "success",
        title: "¡Stock actualizado!",
        html: `
          <p><strong>${productoEscaneado.nombre}</strong></p>
          <p>Se agregaron <strong>${cantidad}</strong> unidades al stock</p>
        `,
        timer: 2000,
        showConfirmButton: false,
      });

      // Limpiar
      setProductoEscaneado(null);
      setCantidad(1);
    } catch (error) {
      console.error("Error al agregar stock:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "No se pudo agregar al stock",
      });
    } finally {
      setProcesando(false);
    }
  };

  // Buscar manualmente
  const buscarManual = async (e) => {
    e.preventDefault();
    if (!codigoManual.trim()) return;
    await buscarProducto(codigoManual.trim());
    setCodigoManual("");
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <EmpleadoLayout>
      <div className="p-4 max-w-2xl mx-auto">
        {/* Header de ventas del día */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 mb-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Ventas del día</p>
              <p className="text-3xl font-bold">${totalDia.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Transacciones</p>
              <p className="text-2xl font-bold">{historialVentas.length}</p>
            </div>
          </div>
        </div>

        {/* Selector de modo de operación */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 mb-4">
          <div className="flex gap-1">
            <button
              onClick={() => {
                setModoOperacion("vender");
                setProductoEscaneado(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                modoOperacion === "vender"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              💰 Vender
            </button>
            <button
              onClick={() => {
                setModoOperacion("stock");
                setProductoEscaneado(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                modoOperacion === "stock"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              📦 Agregar Stock
            </button>
            <button
              onClick={() => {
                setModoOperacion("precio");
                setProductoEscaneado(null);
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                modoOperacion === "precio"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              🏷️ Consultar
            </button>
          </div>
        </div>

        {/* Toggle modo manual */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setModoManual(false)}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              !modoManual
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            📷 Escáner
          </button>
          <button
            onClick={() => setModoManual(true)}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              modoManual
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            ⌨️ Código Manual
          </button>
        </div>

        {/* Escáner o entrada manual */}
        {!modoManual ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
            {!escaneando ? (
              <button
                onClick={iniciarEscaner}
                className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <span className="text-5xl mb-2 block">📷</span>
                <p className="text-gray-600 dark:text-gray-400">
                  Toca para iniciar el escáner
                </p>
              </button>
            ) : (
              <div>
                <div
                  id="reader"
                  ref={scannerRef}
                  className="rounded-lg overflow-hidden"
                ></div>
                <button
                  onClick={detenerEscaner}
                  className="w-full mt-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg transition-colors"
                >
                  Detener escáner
                </button>
              </div>
            )}

            {errorCamara && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                {errorCamara}
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={buscarManual}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4"
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Código del producto
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="Ingresa el código de barras"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={procesando}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Buscar
              </button>
            </div>
          </form>
        )}

        {/* Formulario para crear producto nuevo */}
        {mostrarFormCrear && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border-2 border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                ➕ Crear Producto Nuevo
              </h3>
              <button
                onClick={cancelarCreacion}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={crearProducto} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código de barras
                </label>
                <input
                  type="text"
                  value={nuevoProducto.codigo}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  value={nuevoProducto.nombre}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      nombre: e.target.value,
                    })
                  }
                  placeholder="Ej: Coca-Cola 500ml"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={nuevoProducto.categoria}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      categoria: e.target.value,
                    })
                  }
                  placeholder="Ej: Bebidas, Snacks, General"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio costo
                  </label>
                  <input
                    type="number"
                    value={nuevoProducto.precio}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        precio: e.target.value,
                      })
                    }
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio venta
                  </label>
                  <input
                    type="number"
                    value={nuevoProducto.precioVenta}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        precioVenta: e.target.value,
                      })
                    }
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad inicial
                </label>
                <input
                  type="number"
                  value={nuevoProducto.cantidad}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      cantidad: e.target.value,
                    })
                  }
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelarCreacion}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {procesando ? "Creando..." : "➕ Crear Producto"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Producto escaneado */}
        {productoEscaneado && (
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border-2 ${
              modoOperacion === "vender"
                ? "border-green-500"
                : modoOperacion === "stock"
                  ? "border-blue-500"
                  : "border-purple-500"
            }`}
          >
            {/* Badge de modo */}
            <div className="mb-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  modoOperacion === "vender"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : modoOperacion === "stock"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                }`}
              >
                {modoOperacion === "vender"
                  ? "💰 Modo Venta"
                  : modoOperacion === "stock"
                    ? "📦 Agregar Stock"
                    : "🏷️ Consulta de Precio"}
              </span>
            </div>

            <div className="flex items-start gap-4">
              {productoEscaneado.imagen && (
                <Image
                  src={productoEscaneado.imagen}
                  alt={productoEscaneado.nombre}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {productoEscaneado.nombre}
                </h3>
                {productoEscaneado.codigo && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Código: {productoEscaneado.codigo}
                  </p>
                )}
                <div className="flex gap-4 items-baseline">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Precio Venta
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      $
                      {(
                        productoEscaneado.precioVenta ||
                        productoEscaneado.precio ||
                        0
                      ).toLocaleString()}
                    </p>
                  </div>
                  {productoEscaneado.precio &&
                    productoEscaneado.precioVenta &&
                    productoEscaneado.precio !==
                      productoEscaneado.precioVenta && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Precio Costo
                        </p>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          ${productoEscaneado.precio.toLocaleString()}
                        </p>
                      </div>
                    )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  📦 Stock actual:{" "}
                  <span className="font-medium">
                    {productoEscaneado.stock || productoEscaneado.cantidad || 0}
                  </span>{" "}
                  unidades
                </p>
              </div>
            </div>

            {/* Solo mostrar cantidad si no es consulta de precio */}
            {modoOperacion !== "precio" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cantidad {modoOperacion === "stock" ? "a agregar" : ""}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 text-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={cantidad}
                    onChange={(e) =>
                      setCantidad(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-20 text-center text-xl font-bold py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => setCantidad(cantidad + 1)}
                    className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 text-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Acciones según el modo */}
            <div className="mt-4 flex items-center justify-between">
              {modoOperacion === "vender" && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    $
                    {(
                      (productoEscaneado.precioVenta ||
                        productoEscaneado.precio ||
                        0) * cantidad
                    ).toLocaleString()}
                  </p>
                </div>
              )}
              {modoOperacion === "stock" && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nuevo stock total
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {(productoEscaneado.stock ||
                      productoEscaneado.cantidad ||
                      0) + cantidad}{" "}
                    unidades
                  </p>
                </div>
              )}
              {modoOperacion === "precio" && <div></div>}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setProductoEscaneado(null);
                    setCantidad(1);
                  }}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  {modoOperacion === "precio" ? "Cerrar" : "Cancelar"}
                </button>
                {modoOperacion === "vender" && (
                  <button
                    onClick={realizarVenta}
                    disabled={procesando}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {procesando ? "Procesando..." : "💰 Vender"}
                  </button>
                )}
                {modoOperacion === "stock" && (
                  <button
                    onClick={agregarStock}
                    disabled={procesando}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {procesando ? "Procesando..." : "📦 Agregar Stock"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Historial de ventas */}
        {historialVentas.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Ventas recientes
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {historialVentas.map((venta) => (
                <div
                  key={venta.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {venta.producto}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {venta.cantidad} x $
                      {venta.precioUnitario.toLocaleString()} • {venta.hora}
                    </p>
                  </div>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    ${venta.subtotal.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de pago */}
      <ModalPagoVenta
        isOpen={mostrarModalPago}
        onClose={cancelarPago}
        onConfirmar={confirmarVentaConPago}
        monto={ventaPendiente?.subtotal || 0}
        concepto={`Venta: ${ventaPendiente?.producto?.nombre || ""}`}
        vendedor={usuario}
        detalleVenta={
          ventaPendiente
            ? {
                productos: [
                  {
                    nombre: ventaPendiente.producto?.nombre,
                    cantidad: ventaPendiente.cantidad,
                    precio: ventaPendiente.precioUnitario,
                  },
                ],
              }
            : null
        }
        colorPrimario="green"
      />
    </EmpleadoLayout>
  );
}
