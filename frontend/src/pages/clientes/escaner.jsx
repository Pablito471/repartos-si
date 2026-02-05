import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { stockService } from "@/services/api";
import { showToast, showConfirmAlert, showSuccessAlert } from "@/utils/alerts";
import { formatNumber } from "@/utils/formatters";
import {
  Html5QrcodeScanner,
  Html5QrcodeScanType,
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

export default function EscanerStock() {
  const { usuario } = useAuth();
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  const [escaneando, setEscaneando] = useState(false);
  const [productoEscaneado, setProductoEscaneado] = useState(null);
  const [errorCamara, setErrorCamara] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [procesando, setProcesando] = useState(false);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [modoManual, setModoManual] = useState(false);
  const [codigoManual, setCodigoManual] = useState("");

  // Estados para modo agregar
  const [modoAgregar, setModoAgregar] = useState(false);
  const [codigoEscaneado, setCodigoEscaneado] = useState("");
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    cantidad: 1,
    precio: "",
    categoria: "General",
  });

  // Categorías del usuario
  const [categorias, setCategorias] = useState(["General"]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);

  // Cargar categorías del usuario
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await stockService.obtenerCategorias();
        if (response.data.success && response.data.data.length > 0) {
          setCategorias(response.data.data);
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };
    cargarCategorias();
  }, []);

  // Iniciar escáner - verificar permisos primero
  const iniciarEscaner = useCallback(async () => {
    setErrorCamara(null);

    // Verificar si estamos en HTTPS o localhost
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!isSecure) {
      setErrorCamara(
        "La cámara solo funciona en conexiones seguras (HTTPS). Por favor, usa el modo manual o accede desde HTTPS.",
      );
      setModoManual(true);
      return;
    }

    // Verificar si el navegador soporta getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorCamara(
        "Tu navegador no soporta acceso a la cámara. Usa el modo manual.",
      );
      setModoManual(true);
      return;
    }

    try {
      // Solicitar permiso de cámara explícitamente
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      // Detener el stream de prueba
      stream.getTracks().forEach((track) => track.stop());

      setEscaneando(true);
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setErrorCamara(
          "Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración del navegador.",
        );
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        setErrorCamara("No se encontró ninguna cámara en el dispositivo.");
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        setErrorCamara("La cámara está siendo usada por otra aplicación.");
      } else {
        setErrorCamara(
          `Error al acceder a la cámara: ${err.message || err.name}`,
        );
      }
    }
  }, []);

  // Efecto para inicializar el escáner cuando el elemento DOM existe
  useEffect(() => {
    if (escaneando && !modoManual) {
      // Dar tiempo al DOM para renderizar el elemento
      const timer = setTimeout(async () => {
        const readerElement = document.getElementById("reader");
        if (!readerElement) {
          console.error("Elemento reader no encontrado");
          setErrorCamara(
            "Error al inicializar el escáner. Intenta recargar la página.",
          );
          setEscaneando(false);
          return;
        }

        // Limpiar escáner anterior si existe
        if (html5QrcodeScannerRef.current) {
          try {
            await html5QrcodeScannerRef.current.stop();
          } catch (e) {
            // Ignorar errores de limpieza
          }
        }

        // Calcular tamaño del qrbox basado en el ancho de pantalla
        const screenWidth = window.innerWidth;
        const qrboxSize = Math.min(screenWidth - 60, 300);

        // Formatos de código de barras soportados
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
        ];

        // Usar Html5Qrcode directamente para mejor control de formatos
        html5QrcodeScannerRef.current = new Html5Qrcode("reader", {
          formatsToSupport: formatsToSupport,
          verbose: false,
        });

        const config = {
          fps: 10,
          qrbox: { width: qrboxSize, height: Math.floor(qrboxSize * 0.6) },
          aspectRatio: 1.777778, // 16:9
        };

        try {
          await html5QrcodeScannerRef.current.start(
            { facingMode: "environment" },
            config,
            async (decodedText, decodedResult) => {
              // Código escaneado exitosamente
              console.log("✅ Código detectado:", decodedText);
              console.log(
                "📊 Formato:",
                decodedResult?.result?.format?.formatName,
              );

              // Vibrar si el dispositivo lo soporta
              if (navigator.vibrate) {
                navigator.vibrate(200);
              }

              await buscarProducto(decodedText);
            },
            (errorMessage) => {
              // Errores silenciosos de "no code found" son normales
            },
          );
          console.log("🎥 Escáner iniciado correctamente");
        } catch (err) {
          console.error("Error al iniciar cámara:", err);
          setErrorCamara(
            "No se pudo acceder a la cámara. Verifica los permisos.",
          );
          setEscaneando(false);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [escaneando, modoManual]);

  // Detener escáner
  const detenerEscaner = useCallback(async () => {
    if (html5QrcodeScannerRef.current) {
      try {
        await html5QrcodeScannerRef.current.stop();
      } catch (e) {
        // Ignorar errores de limpieza
      }
      html5QrcodeScannerRef.current = null;
    }
    setEscaneando(false);
    setErrorCamara(null);
  }, []);

  // Buscar producto por código
  const buscarProducto = async (codigo) => {
    try {
      // Pausar escáner mientras procesamos
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.pause(true);
      }

      const response = await stockService.buscarPorCodigo(codigo);

      if (response.data.success) {
        setProductoEscaneado(response.data.data);
        setModoAgregar(false);
        setCantidad(1);
        showToast(
          "success",
          `Producto encontrado: ${response.data.data.nombre}`,
        );
      }
    } catch (error) {
      // No se encontró en stock - preguntar si quiere agregar
      const quiereAgregar = await showConfirmAlert(
        "Producto no encontrado",
        "Este código no está en tu stock. ¿Deseas agregar un nuevo producto?",
        "Sí, agregar",
        "Cancelar",
      );

      if (quiereAgregar) {
        setModoAgregar(true);
        setCodigoEscaneado(codigo);
        setNuevoProducto({
          nombre: "",
          cantidad: 1,
          precio: "",
          categoria: "General",
        });
      } else {
        // Reanudar escáner si cancela
        if (html5QrcodeScannerRef.current) {
          setTimeout(() => {
            html5QrcodeScannerRef.current?.resume();
          }, 500);
        }
      }
    }
  };

  // Agregar producto al stock
  const agregarProducto = async () => {
    if (!nuevoProducto.nombre.trim()) {
      showToast("warning", "Ingresa el nombre del producto");
      return;
    }

    if (nuevoProducto.cantidad < 1) {
      showToast("warning", "La cantidad debe ser al menos 1");
      return;
    }

    if (!nuevoProducto.precio || parseFloat(nuevoProducto.precio) <= 0) {
      showToast("warning", "Ingresa un precio válido");
      return;
    }

    setProcesando(true);
    try {
      const response = await stockService.agregarProducto({
        nombre: nuevoProducto.nombre.trim(),
        cantidad: parseInt(nuevoProducto.cantidad),
        precio: parseFloat(nuevoProducto.precio),
        codigoBarras: codigoEscaneado || null,
        categoria: nuevoProducto.categoria,
        registrarCompra: false,
      });

      if (response.data.success) {
        await showSuccessAlert(
          "¡Producto agregado!",
          `${nuevoProducto.cantidad}x ${nuevoProducto.nombre}\nCategoría: ${nuevoProducto.categoria}\nPrecio: $${formatNumber(parseFloat(nuevoProducto.precio))}`,
        );

        // Limpiar y reanudar escáner
        setModoAgregar(false);
        setCodigoEscaneado("");
        setMostrarNuevaCategoria(false);
        setNuevaCategoria("");
        setNuevoProducto({
          nombre: "",
          cantidad: 1,
          precio: "",
          categoria: "General",
        });
        setCodigoManual("");

        if (html5QrcodeScannerRef.current && !modoManual) {
          html5QrcodeScannerRef.current.resume();
        }
      }
    } catch (error) {
      const mensaje =
        error.response?.data?.message || "Error al agregar producto";
      showToast("error", mensaje);
    } finally {
      setProcesando(false);
    }
  };

  // Cancelar modo agregar
  const cancelarAgregar = () => {
    setModoAgregar(false);
    setCodigoEscaneado("");
    setMostrarNuevaCategoria(false);
    setNuevaCategoria("");
    setNuevoProducto({
      nombre: "",
      cantidad: 1,
      precio: "",
      categoria: "General",
    });
    setCodigoManual("");

    if (html5QrcodeScannerRef.current && !modoManual) {
      html5QrcodeScannerRef.current.resume();
    }
  };

  // Buscar código manual
  const buscarCodigoManual = async () => {
    if (!codigoManual.trim()) {
      showToast("warning", "Ingresa un código");
      return;
    }
    await buscarProducto(codigoManual.trim().toUpperCase());
  };

  // Descontar del stock
  const descontarProducto = async () => {
    if (!productoEscaneado) return;

    if (cantidad < 1) {
      showToast("warning", "La cantidad debe ser al menos 1");
      return;
    }

    if (cantidad > productoEscaneado.cantidadDisponible) {
      showToast(
        "error",
        `Solo hay ${productoEscaneado.cantidadDisponible} unidades disponibles`,
      );
      return;
    }

    const confirmado = await showConfirmAlert(
      "Confirmar venta",
      `¿Descontar ${cantidad} unidad(es) de "${productoEscaneado.nombre}"?\n\nTotal: $${formatNumber(productoEscaneado.precio * cantidad)}`,
      "Sí, vender",
      "Cancelar",
    );

    if (!confirmado) return;

    setProcesando(true);
    try {
      const response = await stockService.descontarPorCodigo(
        productoEscaneado.codigo,
        cantidad,
        "Venta por escáner",
      );

      if (response.data.success) {
        const venta = {
          ...response.data.data,
          fecha: new Date().toISOString(),
        };

        setHistorialVentas((prev) => [venta, ...prev].slice(0, 20)); // Mantener últimas 20

        await showSuccessAlert(
          "¡Venta registrada!",
          `${cantidad}x ${productoEscaneado.nombre}\nTotal: $${formatNumber(response.data.data.montoVenta)}\nStock restante: ${response.data.data.stockRestante}`,
        );

        // Limpiar y reanudar escáner
        setProductoEscaneado(null);
        setCantidad(1);
        setCodigoManual("");

        if (html5QrcodeScannerRef.current && !modoManual) {
          html5QrcodeScannerRef.current.resume();
        }
      }
    } catch (error) {
      const mensaje =
        error.response?.data?.message || "Error al procesar la venta";
      showToast("error", mensaje);
    } finally {
      setProcesando(false);
    }
  };

  // Cancelar y volver a escanear
  const cancelarEscaneo = () => {
    setProductoEscaneado(null);
    setCantidad(1);
    setCodigoManual("");

    if (html5QrcodeScannerRef.current && !modoManual) {
      html5QrcodeScannerRef.current.resume();
    }
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (html5QrcodeScannerRef.current) {
        try {
          html5QrcodeScannerRef.current.clear();
        } catch (e) {
          // Ignorar errores de limpieza
        }
      }
    };
  }, []);

  // Calcular total del día
  const totalDia = historialVentas.reduce(
    (sum, v) => sum + (v.montoVenta || 0),
    0,
  );
  const cantidadVentas = historialVentas.length;

  return (
    <ClienteLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            📷 Escáner de Ventas
          </h1>
          <p className="text-gray-600">
            Escanea códigos de barras para registrar ventas
          </p>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-sm">Ventas esta sesión</p>
            <p className="text-2xl font-bold">{cantidadVentas}</p>
          </div>
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-blue-100 text-sm">Total recaudado</p>
            <p className="text-2xl font-bold">${formatNumber(totalDia)}</p>
          </div>
        </div>

        {/* Selector de modo */}
        <div className="card">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setModoManual(false);
                if (!escaneando) iniciarEscaner();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                !modoManual
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              📷 Cámara
            </button>
            <button
              onClick={() => {
                setModoManual(true);
                detenerEscaner();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                modoManual
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ⌨️ Manual
            </button>
          </div>
        </div>

        {/* Escáner de cámara */}
        {!modoManual && (
          <div className="card">
            {errorCamara ? (
              <div className="text-center py-8">
                <span className="text-6xl block mb-4">⚠️</span>
                <p className="text-red-600 mb-4 font-medium">{errorCamara}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setErrorCamara(null);
                      iniciarEscaner();
                    }}
                    className="btn-primary px-6 py-2"
                  >
                    🔄 Reintentar
                  </button>
                  <button
                    onClick={() => {
                      setErrorCamara(null);
                      setModoManual(true);
                    }}
                    className="btn-secondary px-6 py-2"
                  >
                    ⌨️ Usar modo manual
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  💡 En móviles, asegúrate de permitir el acceso a la cámara
                  cuando el navegador lo solicite
                </p>
              </div>
            ) : !escaneando ? (
              <div className="text-center py-8">
                <span className="text-6xl block mb-4">📷</span>
                <p className="text-gray-600 mb-4">
                  Presiona el botón para iniciar la cámara
                </p>
                <button
                  onClick={iniciarEscaner}
                  className="btn-primary text-lg px-8 py-3"
                >
                  🎯 Iniciar Escáner
                </button>
                <p className="text-xs text-gray-400 mt-4">
                  📱 Se usará la cámara trasera en dispositivos móviles
                </p>
              </div>
            ) : (
              <div>
                <p className="text-center text-sm text-gray-600 mb-3">
                  📷 Apunta al código de barras y mantén el celular estable
                </p>
                <div
                  id="reader"
                  ref={scannerRef}
                  className="w-full rounded-lg overflow-hidden border-2 border-primary"
                  style={{ minHeight: "350px" }}
                ></div>
                <p className="text-center text-xs text-gray-500 mt-2">
                  💡 Asegúrate de tener buena iluminación y el código centrado
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button onClick={detenerEscaner} className="btn-secondary">
                    ⏹️ Detener
                  </button>
                  <button
                    onClick={() => setModoManual(true)}
                    className="btn-secondary"
                  >
                    ⌨️ Ingresar manual
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Entrada manual */}
        {modoManual && !productoEscaneado && (
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4">
              Ingresar código manualmente
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: STK000001"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && buscarCodigoManual()}
                className="input-field flex-1 font-mono text-center text-lg"
                autoFocus
              />
              <button onClick={buscarCodigoManual} className="btn-primary px-6">
                🔍 Buscar
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Ingresa el código que aparece debajo del código de barras
            </p>
          </div>
        )}

        {/* Producto escaneado */}
        {productoEscaneado && (
          <div className="card border-2 border-primary">
            <div className="text-center mb-4">
              <span className="text-4xl mb-2 block">✅</span>
              <h3 className="text-lg font-bold text-gray-800">
                Producto Encontrado
              </h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-400 font-mono mb-1">
                {productoEscaneado.codigo}
              </p>
              <h4 className="text-xl font-bold text-gray-800">
                {productoEscaneado.nombre}
              </h4>
              <div className="flex items-center justify-between mt-2">
                <p className="text-2xl font-bold text-primary">
                  ${formatNumber(productoEscaneado.precio)}
                </p>
                <p className="text-sm text-gray-500">
                  {productoEscaneado.cantidadDisponible} disponibles
                </p>
              </div>
            </div>

            {/* Selector de cantidad */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad a vender
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 text-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={productoEscaneado.cantidadDisponible}
                  value={cantidad}
                  onChange={(e) =>
                    setCantidad(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-20 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg py-2"
                />
                <button
                  onClick={() =>
                    setCantidad(
                      Math.min(
                        productoEscaneado.cantidadDisponible,
                        cantidad + 1,
                      ),
                    )
                  }
                  className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 text-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="bg-primary/10 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-gray-600">Total a cobrar</p>
              <p className="text-3xl font-bold text-primary">
                ${formatNumber(productoEscaneado.precio * cantidad)}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={cancelarEscaneo}
                disabled={procesando}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
              <button
                onClick={descontarProducto}
                disabled={procesando}
                className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {procesando ? (
                  <>
                    <span className="animate-spin">⏳</span> Procesando...
                  </>
                ) : (
                  <>✓ Confirmar Venta</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Formulario para agregar producto nuevo */}
        {modoAgregar && (
          <div className="card border-2 border-orange-400">
            <div className="text-center mb-4">
              <span className="text-4xl mb-2 block">➕</span>
              <h3 className="text-lg font-bold text-gray-800">
                Agregar Nuevo Producto
              </h3>
              <p className="text-sm text-gray-500">
                El código escaneado no está en tu stock
              </p>
            </div>

            <div className="space-y-4">
              {/* Código de barras escaneado */}
              {codigoEscaneado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📊 Código de barras escaneado
                  </label>
                  <div className="bg-gray-100 rounded-lg p-3 font-mono text-center text-lg text-gray-800 border-2 border-dashed border-gray-300">
                    {codigoEscaneado}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Este código se guardará para futuras ventas
                  </p>
                </div>
              )}

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🏷️ Categoría *
                </label>
                {!mostrarNuevaCategoria ? (
                  <div className="space-y-2">
                    <select
                      value={nuevoProducto.categoria}
                      onChange={(e) => {
                        if (e.target.value === "__nueva__") {
                          setMostrarNuevaCategoria(true);
                          setNuevaCategoria("");
                        } else {
                          setNuevoProducto((prev) => ({
                            ...prev,
                            categoria: e.target.value,
                          }));
                        }
                      }}
                      className="input-field w-full"
                    >
                      {categorias.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__nueva__">
                        ➕ Crear nueva categoría...
                      </option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nombre de la categoría"
                        value={nuevaCategoria}
                        onChange={(e) => setNuevaCategoria(e.target.value)}
                        className="input-field flex-1"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (nuevaCategoria.trim()) {
                            const cat = nuevaCategoria.trim();
                            if (!categorias.includes(cat)) {
                              setCategorias((prev) => [...prev, cat].sort());
                            }
                            setNuevoProducto((prev) => ({
                              ...prev,
                              categoria: cat,
                            }));
                            setMostrarNuevaCategoria(false);
                            setNuevaCategoria("");
                          }
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarNuevaCategoria(false);
                          setNuevaCategoria("");
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Escribe el nombre de la nueva categoría
                    </p>
                  </div>
                )}
              </div>

              {/* Nombre del producto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Nike Air Max 90"
                  value={nuevoProducto.nombre}
                  onChange={(e) =>
                    setNuevoProducto((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  className="input-field w-full"
                  autoFocus
                />
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad inicial *
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() =>
                      setNuevoProducto((prev) => ({
                        ...prev,
                        cantidad: Math.max(1, prev.cantidad - 1),
                      }))
                    }
                    className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 text-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={nuevoProducto.cantidad}
                    onChange={(e) =>
                      setNuevoProducto((prev) => ({
                        ...prev,
                        cantidad: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-20 text-center text-xl font-bold border-2 border-gray-200 rounded-lg py-2"
                  />
                  <button
                    onClick={() =>
                      setNuevoProducto((prev) => ({
                        ...prev,
                        cantidad: prev.cantidad + 1,
                      }))
                    }
                    className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 text-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio de venta *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={nuevoProducto.precio}
                    onChange={(e) =>
                      setNuevoProducto((prev) => ({
                        ...prev,
                        precio: e.target.value,
                      }))
                    }
                    className="input-field w-full pl-8 text-lg font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelarAgregar}
                disabled={procesando}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
              <button
                onClick={agregarProducto}
                disabled={procesando}
                className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {procesando ? (
                  <>
                    <span className="animate-spin">⏳</span> Procesando...
                  </>
                ) : (
                  <>➕ Agregar al Stock</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Historial de ventas de la sesión */}
        {historialVentas.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-4">
              📋 Ventas de esta sesión
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {historialVentas.map((venta, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {venta.cantidadDescontada}x {venta.producto}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(venta.fecha).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +${formatNumber(venta.montoVenta)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Quedan: {venta.stockRestante}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">
            💡 ¿Cómo funciona?
          </h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Inicia el escáner o ingresa el código manualmente</li>
            <li>Apunta la cámara al código de barras del producto</li>
            <li>Selecciona la cantidad a vender</li>
            <li>Confirma la venta para descontar del stock</li>
          </ol>
        </div>
      </div>
    </ClienteLayout>
  );
}
