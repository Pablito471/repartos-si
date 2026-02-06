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
import { createWorker } from "tesseract.js";

export default function EscanerStock() {
  const { usuario, esMovil, modoEscaner, setModoEscaner } = useAuth();
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

  // Carrito de ventas múltiples
  const [carritoVentas, setCarritoVentas] = useState([]);

  // Estados para modo agregar
  const [modoAgregar, setModoAgregar] = useState(false);
  const [codigoEscaneado, setCodigoEscaneado] = useState("");
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    cantidad: 1,
    precioCosto: "",
    precioVenta: "",
    categoria: "General",
    imagen: "",
  });

  // Categorías del usuario
  const [categorias, setCategorias] = useState(["General"]);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);

  // Orientación del dispositivo
  const [isLandscape, setIsLandscape] = useState(false);

  // Control de zoom para códigos pequeños
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [zoomDisponible, setZoomDisponible] = useState(false);

  // OCR para leer números debajo del código de barras
  const [ocrActivo, setOcrActivo] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const ocrWorkerRef = useRef(null);
  const ocrIntervalRef = useRef(null);
  const ultimoCodigoOCR = useRef("");

  // Referencias para audio
  const beepAudioRef = useRef(null);
  const audioContextRef = useRef(null);

  // Función para inicializar el audio (DEBE llamarse en interacción del usuario)
  const inicializarAudio = useCallback(async () => {
    try {
      console.log("🔊 Inicializando audio...");

      // 1. Crear AudioContext y desbloquearlo
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
        console.log("🔊 AudioContext desbloqueado");
      }

      // 2. Reproducir un beep silencioso para desbloquear el audio
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001; // Casi silencioso
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.01);

      // 3. Crear elemento audio y precargarlo
      if (!beepAudioRef.current) {
        const audio = new Audio("/beep.wav");
        audio.volume = 1.0;
        audio.preload = "auto";
        beepAudioRef.current = audio;

        // Cargar el audio
        await new Promise((resolve) => {
          audio.addEventListener("canplaythrough", resolve, { once: true });
          audio.addEventListener("error", resolve, { once: true });
          audio.load();
          setTimeout(resolve, 1000); // Timeout de seguridad
        });
      }

      console.log("🔊 Audio inicializado completamente");
    } catch (err) {
      console.log("Error al inicializar audio:", err);
    }
  }, []);

  // Función para reproducir sonido de escaneo fuerte (PIP)
  const reproducirSonidoEscaneo = useCallback(async () => {
    console.log("🔊 Reproduciendo beep...");

    // Método 1: Web Audio API (más confiable en móviles)
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

      // Crear beep fuerte
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Configuración para sonido fuerte tipo escáner
      oscillator.frequency.value = 1500;
      oscillator.type = "square";
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);

      console.log("🔊 Beep Web Audio OK");
      return;
    } catch (e) {
      console.log("Web Audio falló:", e);
    }

    // Método 2: Audio HTML5 precargado
    if (beepAudioRef.current) {
      try {
        const audio = beepAudioRef.current;
        audio.currentTime = 0;
        audio.volume = 1.0;
        await audio.play();
        console.log("🔊 Beep HTML5 OK");
        return;
      } catch (e) {
        console.log("Audio HTML5 falló:", e);
      }
    }

    // Método 3: Nuevo elemento Audio
    try {
      const audio = new Audio("/beep.wav");
      audio.volume = 1.0;
      await audio.play();
      console.log("🔊 Beep nuevo OK");
    } catch (e) {
      console.log("Audio nuevo falló:", e);
    }
  }, []);

  // Detectar cambios de orientación
  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Cargar categorías del usuario
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await stockService.obtenerCategorias();
        if (response.success && response.data?.length > 0) {
          setCategorias(response.data);
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

    // Inicializar audio al iniciar escáner (requiere interacción del usuario en móviles)
    await inicializarAudio();

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
  }, [inicializarAudio]);

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

        // Detectar si es desktop (no tiene cámara trasera típicamente)
        const isDesktop =
          !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          );

        // Calcular tamaño del qrbox basado en orientación y tamaño de pantalla
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isLandscapeMode = screenWidth > screenHeight;

        // Área de escaneo - más grande en desktop para compensar falta de zoom
        const qrboxWidth = isDesktop
          ? Math.min(screenWidth - 100, 600) // Desktop: área más grande
          : isLandscapeMode
            ? Math.min(screenWidth - 80, 550)
            : Math.min(screenWidth - 40, 350);
        // Altura más baja para códigos de barras lineales (son horizontales)
        const qrboxHeight = isDesktop
          ? Math.floor(qrboxWidth * 0.3) // Desktop: más ancho y bajo para códigos lineales
          : isLandscapeMode
            ? Math.floor(qrboxWidth * 0.35)
            : Math.floor(qrboxWidth * 0.5);

        // Formatos de código de barras soportados - priorizando códigos lineales
        const formatsToSupport = [
          // Códigos de barras lineales (más comunes en productos)
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
          // QR al final (menor prioridad)
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        // Usar Html5Qrcode directamente para mejor control de formatos
        html5QrcodeScannerRef.current = new Html5Qrcode("reader", {
          formatsToSupport: formatsToSupport,
          verbose: false,
        });

        // Configuración optimizada - diferente para desktop y móvil
        const config = {
          fps: isDesktop ? 20 : 15, // Más FPS en desktop (mejor hardware)
          qrbox: { width: qrboxWidth, height: qrboxHeight },
          aspectRatio: isLandscapeMode ? 1.777778 : 1.333333,
          // Configuración experimental para mejor lectura
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true, // Usa API nativa si está disponible
          },
          // Desactivar espejos para mejorar precisión
          disableFlip: false,
        };

        try {
          // Para desktop usamos "user" (webcam frontal), para móvil "environment" (cámara trasera)
          const cameraConfig = isDesktop
            ? { facingMode: "user" }
            : { facingMode: "environment" };

          await html5QrcodeScannerRef.current.start(
            cameraConfig,
            config,
            async (decodedText, decodedResult) => {
              // Código escaneado exitosamente
              console.log("✅ Código detectado:", decodedText);
              console.log(
                "📊 Formato:",
                decodedResult?.result?.format?.formatName,
              );

              // Reproducir sonido fuerte de escaneo
              reproducirSonidoEscaneo();

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

          // Intentar configurar zoom y enfoque para códigos pequeños
          try {
            // Esperar un poco a que el video se inicialice
            await new Promise((resolve) => setTimeout(resolve, 500));
            const videoElement = document.querySelector("#reader video");
            if (videoElement && videoElement.srcObject) {
              const track = videoElement.srcObject.getVideoTracks()[0];
              const capabilities = track.getCapabilities();

              // Configurar enfoque continuo si está disponible
              if (
                capabilities.focusMode &&
                capabilities.focusMode.includes("continuous")
              ) {
                await track.applyConstraints({
                  advanced: [{ focusMode: "continuous" }],
                });
                console.log("📷 Enfoque continuo activado");
              }

              // Configurar zoom
              if (capabilities.zoom) {
                const minZoom = capabilities.zoom.min || 1;
                const maxZoomVal = capabilities.zoom.max || 1;
                setMaxZoom(maxZoomVal);
                setZoomDisponible(true);
                // Aplicar zoom más alto por defecto para códigos pequeños
                // Usar 40% del rango de zoom (mejor para mantener distancia y enfocar)
                const initialZoom = Math.min(
                  minZoom + (maxZoomVal - minZoom) * 0.4,
                  3,
                );
                setZoomLevel(initialZoom);
                await track.applyConstraints({
                  advanced: [{ zoom: initialZoom }],
                });
                console.log(
                  "📷 Zoom inicial:",
                  initialZoom,
                  "Max:",
                  maxZoomVal,
                );
              }
            }
          } catch (zoomErr) {
            console.log("Zoom/enfoque no disponible:", zoomErr.message);
            setZoomDisponible(false);
          }

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
  }, [escaneando, modoManual, isLandscape]);

  // Función para cambiar zoom
  const cambiarZoom = async (nuevoZoom) => {
    try {
      const videoElement = document.querySelector("#reader video");
      if (videoElement && videoElement.srcObject) {
        const track = videoElement.srcObject.getVideoTracks()[0];
        await track.applyConstraints({ advanced: [{ zoom: nuevoZoom }] });
        setZoomLevel(nuevoZoom);
        console.log("📷 Zoom cambiado a:", nuevoZoom);
      }
    } catch (err) {
      console.log("Error al cambiar zoom:", err);
    }
  };

  // Inicializar worker de OCR
  const inicializarOCR = useCallback(async () => {
    if (ocrWorkerRef.current) return;

    try {
      setOcrStatus("Cargando OCR...");
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrStatus(`OCR: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Configurar para reconocer solo números
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
        tessedit_pageseg_mode: "7", // Tratar como línea de texto única
      });

      ocrWorkerRef.current = worker;
      setOcrStatus("OCR listo");
      console.log("✅ OCR inicializado");
    } catch (err) {
      console.error("Error al inicializar OCR:", err);
      setOcrStatus("Error OCR");
    }
  }, []);

  // Ejecutar OCR en un frame del video
  const ejecutarOCR = useCallback(async () => {
    if (!ocrWorkerRef.current || productoEscaneado) return;

    const videoElement = document.querySelector("#reader video");
    if (!videoElement || videoElement.readyState < 2) return;

    try {
      // Crear canvas para capturar frame
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Capturar solo la parte inferior del video (donde están los números)
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;

      // Capturar el tercio inferior donde suelen estar los números
      const captureHeight = Math.floor(videoHeight * 0.3);
      const captureY = videoHeight - captureHeight;

      canvas.width = videoWidth;
      canvas.height = captureHeight;

      ctx.drawImage(
        videoElement,
        0,
        captureY,
        videoWidth,
        captureHeight, // Fuente
        0,
        0,
        videoWidth,
        captureHeight, // Destino
      );

      // Mejorar contraste para OCR
      ctx.filter = "contrast(1.5) brightness(1.2)";
      ctx.drawImage(canvas, 0, 0);

      // Convertir a imagen
      const imageData = canvas.toDataURL("image/png");

      setOcrStatus("Leyendo números...");
      const {
        data: { text },
      } = await ocrWorkerRef.current.recognize(imageData);

      // Buscar patrones de código de barras en el texto
      // EAN-13: 13 dígitos, EAN-8: 8 dígitos, UPC-A: 12 dígitos
      const numeros = text.replace(/\s/g, ""); // Quitar espacios

      // Buscar secuencias de números válidas
      const patronEAN13 = /\d{13}/g;
      const patronEAN8 = /\d{8}/g;
      const patronUPC = /\d{12}/g;

      let codigoDetectado = null;

      // Prioridad: EAN-13/UPC > EAN-8
      const ean13Match = numeros.match(patronEAN13);
      const upcMatch = numeros.match(patronUPC);
      const ean8Match = numeros.match(patronEAN8);

      if (ean13Match) {
        codigoDetectado = ean13Match[0];
      } else if (upcMatch) {
        codigoDetectado = upcMatch[0];
      } else if (ean8Match) {
        codigoDetectado = ean8Match[0];
      }

      if (codigoDetectado && codigoDetectado !== ultimoCodigoOCR.current) {
        console.log("🔢 OCR detectó código:", codigoDetectado);
        ultimoCodigoOCR.current = codigoDetectado;

        // Reproducir sonido fuerte de escaneo
        reproducirSonidoEscaneo();

        // Vibrar
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        setOcrStatus(`Encontrado: ${codigoDetectado}`);

        // Buscar el producto
        await buscarProducto(codigoDetectado);
      } else {
        setOcrStatus("Buscando números...");
      }
    } catch (err) {
      console.log("Error en OCR:", err.message);
    }
  }, [productoEscaneado, reproducirSonidoEscaneo]);

  // Activar/desactivar OCR
  const toggleOCR = useCallback(async () => {
    if (ocrActivo) {
      // Desactivar
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current);
        ocrIntervalRef.current = null;
      }
      setOcrActivo(false);
      setOcrStatus("");
    } else {
      // Activar
      await inicializarOCR();
      setOcrActivo(true);

      // Ejecutar OCR cada 2 segundos
      ocrIntervalRef.current = setInterval(() => {
        ejecutarOCR();
      }, 2000);
    }
  }, [ocrActivo, inicializarOCR, ejecutarOCR]);

  // Limpiar OCR al desmontar o cambiar estado de escaneo
  useEffect(() => {
    return () => {
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current);
      }
    };
  }, []);

  // Detener OCR cuando se encuentra producto
  useEffect(() => {
    if (productoEscaneado && ocrIntervalRef.current) {
      clearInterval(ocrIntervalRef.current);
      ocrIntervalRef.current = null;
      setOcrActivo(false);
      setOcrStatus("");
    }
  }, [productoEscaneado]);

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
    console.log("🔍 Buscando código:", codigo);

    try {
      // Pausar escáner mientras procesamos
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.pause(true);
      }

      const response = await stockService.buscarPorCodigo(codigo);
      console.log("📦 Respuesta:", response);

      if (response.success && response.data) {
        const producto = response.data;

        // Agregar automáticamente al carrito
        const enCarrito = carritoVentas.find(
          (item) => item.codigo === producto.codigo,
        );
        const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;

        if (cantidadEnCarrito + 1 > producto.cantidadDisponible) {
          showToast(
            "error",
            `Stock insuficiente. Disponible: ${producto.cantidadDisponible}, ya en carrito: ${cantidadEnCarrito}`,
          );
        } else if (enCarrito) {
          // Actualizar cantidad si ya existe
          setCarritoVentas((prev) =>
            prev.map((item) =>
              item.codigo === producto.codigo
                ? { ...item, cantidad: item.cantidad + 1 }
                : item,
            ),
          );
          showToast(
            "success",
            `+1 ${producto.nombre} (Total: ${cantidadEnCarrito + 1})`,
          );
        } else {
          // Agregar nuevo item
          setCarritoVentas((prev) => [
            ...prev,
            {
              id: producto.id,
              codigo: producto.codigo,
              nombre: producto.nombre,
              precio: producto.precio,
              cantidad: 1,
              stockDisponible: producto.cantidadDisponible,
            },
          ]);
          showToast("success", `${producto.nombre} agregado al carrito`);
        }

        setModoAgregar(false);

        // Reiniciar escáner para seguir escaneando
        if (!modoManual && html5QrcodeScannerRef.current) {
          try {
            html5QrcodeScannerRef.current.resume();
          } catch (e) {
            console.log("Error al reanudar escáner:", e);
            // Si falla resume, reiniciar completamente
            setEscaneando(false);
            setTimeout(() => setEscaneando(true), 100);
          }
        }
      } else {
        // Respuesta sin datos - producto no encontrado
        throw new Error("Producto no encontrado");
      }
    } catch (error) {
      console.log("❌ Error o no encontrado:", error);

      // No se encontró en stock - preguntar si quiere agregar
      const quiereAgregar = await showConfirmAlert(
        "Producto no encontrado",
        `El código "${codigo}" no está en tu stock. ¿Deseas agregar un nuevo producto?`,
        "Sí, agregar",
        "Cancelar",
      );

      if (quiereAgregar) {
        // Detener escáner al agregar producto
        if (html5QrcodeScannerRef.current) {
          try {
            await html5QrcodeScannerRef.current.stop();
          } catch (e) {
            console.log("Error al detener escáner:", e);
          }
        }
        setModoAgregar(true);
        setCodigoEscaneado(codigo);
        setNuevoProducto({
          nombre: "",
          cantidad: 1,
          precioCosto: "",
          precioVenta: "",
          categoria: "General",
        });
      } else {
        // Reanudar escáner si cancela
        if (html5QrcodeScannerRef.current) {
          setTimeout(() => {
            try {
              html5QrcodeScannerRef.current?.resume();
            } catch (e) {
              console.log("Error al reanudar escáner:", e);
            }
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

    if (
      !nuevoProducto.precioVenta ||
      parseFloat(nuevoProducto.precioVenta) <= 0
    ) {
      showToast("warning", "Ingresa un precio de venta válido");
      return;
    }

    setProcesando(true);
    try {
      const datosProducto = {
        nombre: nuevoProducto.nombre.trim(),
        cantidad: parseInt(nuevoProducto.cantidad),
        precioCosto: nuevoProducto.precioCosto
          ? parseFloat(nuevoProducto.precioCosto)
          : null,
        precioVenta: parseFloat(nuevoProducto.precioVenta),
        codigoBarras: codigoEscaneado || null,
        categoria: nuevoProducto.categoria,
        imagen: nuevoProducto.imagen || null,
        registrarCompra: nuevoProducto.precioCosto ? true : false,
      };

      console.log("📦 Enviando producto:", datosProducto);

      const response = await stockService.agregarProducto(datosProducto);
      console.log("📦 Respuesta:", response);

      if (response.success) {
        // Emitir evento para que otras páginas actualicen su stock
        window.dispatchEvent(
          new CustomEvent("stock:producto_agregado", {
            detail: { producto: response.data },
          }),
        );

        // Emitir evento para actualizar contabilidad si se registró compra
        if (datosProducto.registrarCompra && datosProducto.precioCosto) {
          window.dispatchEvent(
            new CustomEvent("contabilidad:movimiento_creado"),
          );
        }

        await showSuccessAlert(
          "¡Producto agregado!",
          `${nuevoProducto.cantidad}x ${nuevoProducto.nombre}\nCategoría: ${nuevoProducto.categoria}\nCosto: $${nuevoProducto.precioCosto ? formatNumber(parseFloat(nuevoProducto.precioCosto)) : "-"}\nVenta: $${formatNumber(parseFloat(nuevoProducto.precioVenta))}`,
        );

        // Limpiar y reiniciar escáner
        setModoAgregar(false);
        setCodigoEscaneado("");
        setMostrarNuevaCategoria(false);
        setNuevaCategoria("");
        setNuevoProducto({
          nombre: "",
          cantidad: 1,
          precioCosto: "",
          precioVenta: "",
          categoria: "General",
          imagen: "",
        });
        setCodigoManual("");

        // Reiniciar escáner si no estamos en modo manual
        if (!modoManual) {
          setEscaneando(false);
          setTimeout(() => {
            setEscaneando(true);
          }, 100);
        }
      }
    } catch (error) {
      console.error("❌ Error al agregar producto:", error);
      console.error("Response data:", error.response?.data);
      const mensaje =
        error.response?.data?.message ||
        error.message ||
        "Error al agregar producto";
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
      precioCosto: "",
      precioVenta: "",
      categoria: "General",
      imagen: "",
    });
    setCodigoManual("");

    // Reiniciar escáner si no estamos en modo manual
    if (!modoManual) {
      setEscaneando(false);
      setTimeout(() => {
        setEscaneando(true);
      }, 100);
    }
  };

  // Buscar código manual
  const buscarCodigoManual = async () => {
    if (!codigoManual.trim()) {
      showToast("warning", "Ingresa un código");
      return;
    }
    // Inicializar audio (requiere interacción del usuario en móviles)
    await inicializarAudio();
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

      if (response.success) {
        // Emitir evento para que otras páginas actualicen su stock
        window.dispatchEvent(
          new CustomEvent("stock:producto_actualizado", {
            detail: { producto: response.data },
          }),
        );

        const venta = {
          ...response.data,
          fecha: new Date().toISOString(),
        };

        setHistorialVentas((prev) => [venta, ...prev].slice(0, 20)); // Mantener últimas 20

        await showSuccessAlert(
          "¡Venta registrada!",
          `${cantidad}x ${productoEscaneado.nombre}\nTotal: $${formatNumber(response.data.montoVenta)}\nStock restante: ${response.data.stockRestante}`,
        );

        // Limpiar y reiniciar escáner
        setProductoEscaneado(null);
        setCantidad(1);
        setCodigoManual("");

        // Reiniciar escáner si no estamos en modo manual
        if (!modoManual) {
          setEscaneando(false);
          setTimeout(() => {
            setEscaneando(true);
          }, 100);
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

  // Agregar producto al carrito de ventas
  const agregarAlCarrito = () => {
    if (!productoEscaneado) return;

    if (cantidad < 1) {
      showToast("warning", "La cantidad debe ser al menos 1");
      return;
    }

    // Verificar stock disponible considerando lo que ya está en el carrito
    const enCarrito = carritoVentas.find(
      (item) => item.codigo === productoEscaneado.codigo,
    );
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
    const cantidadTotal = cantidadEnCarrito + cantidad;

    if (cantidadTotal > productoEscaneado.cantidadDisponible) {
      showToast(
        "error",
        `Stock insuficiente. Disponible: ${productoEscaneado.cantidadDisponible}, ya en carrito: ${cantidadEnCarrito}`,
      );
      return;
    }

    // Si ya existe, actualizar cantidad
    if (enCarrito) {
      setCarritoVentas((prev) =>
        prev.map((item) =>
          item.codigo === productoEscaneado.codigo
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item,
        ),
      );
      showToast(
        "success",
        `+${cantidad} ${productoEscaneado.nombre} (Total: ${cantidadTotal})`,
      );
    } else {
      // Agregar nuevo item
      setCarritoVentas((prev) => [
        ...prev,
        {
          id: productoEscaneado.id,
          codigo: productoEscaneado.codigo,
          nombre: productoEscaneado.nombre,
          precio: productoEscaneado.precio,
          cantidad: cantidad,
          stockDisponible: productoEscaneado.cantidadDisponible,
        },
      ]);
      showToast("success", `${productoEscaneado.nombre} agregado al carrito`);
    }

    // Limpiar y reiniciar escáner
    setProductoEscaneado(null);
    setCantidad(1);
    setCodigoManual("");

    if (!modoManual) {
      setEscaneando(false);
      setTimeout(() => {
        setEscaneando(true);
      }, 100);
    }
  };

  // Quitar producto del carrito
  const quitarDelCarrito = (codigo) => {
    setCarritoVentas((prev) => prev.filter((item) => item.codigo !== codigo));
    showToast("info", "Producto quitado del carrito");
  };

  // Modificar cantidad en carrito
  const modificarCantidadCarrito = (codigo, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      quitarDelCarrito(codigo);
      return;
    }
    setCarritoVentas((prev) =>
      prev.map((item) =>
        item.codigo === codigo
          ? { ...item, cantidad: Math.min(nuevaCantidad, item.stockDisponible) }
          : item,
      ),
    );
  };

  // Vaciar carrito
  const vaciarCarrito = async () => {
    if (carritoVentas.length === 0) return;

    const confirmado = await showConfirmAlert(
      "Vaciar carrito",
      "¿Estás seguro de vaciar el carrito?",
      "Sí, vaciar",
      "Cancelar",
    );

    if (confirmado) {
      setCarritoVentas([]);
      showToast("info", "Carrito vaciado");
    }
  };

  // Registrar todas las ventas del carrito
  const registrarVentasCarrito = async () => {
    if (carritoVentas.length === 0) {
      showToast("warning", "El carrito está vacío");
      return;
    }

    const totalCarrito = carritoVentas.reduce(
      (sum, item) => sum + item.precio * item.cantidad,
      0,
    );
    const totalProductos = carritoVentas.reduce(
      (sum, item) => sum + item.cantidad,
      0,
    );

    const confirmado = await showConfirmAlert(
      "Confirmar venta múltiple",
      `¿Registrar venta de ${totalProductos} producto(s)?\n\nTotal: $${formatNumber(totalCarrito)}`,
      "Sí, vender todo",
      "Cancelar",
    );

    if (!confirmado) return;

    setProcesando(true);
    let ventasExitosas = 0;
    let ventasFallidas = 0;
    const nuevasVentas = [];

    for (const item of carritoVentas) {
      try {
        const response = await stockService.descontarPorCodigo(
          item.codigo,
          item.cantidad,
          "Venta por escáner (múltiple)",
        );

        if (response.success) {
          ventasExitosas++;
          nuevasVentas.push({
            ...response.data,
            fecha: new Date().toISOString(),
          });

          // Emitir evento para actualizar stock
          window.dispatchEvent(
            new CustomEvent("stock:producto_actualizado", {
              detail: { producto: response.data },
            }),
          );
        } else {
          ventasFallidas++;
        }
      } catch (error) {
        console.error(`Error al vender ${item.nombre}:`, error);
        ventasFallidas++;
      }
    }

    // Agregar al historial
    setHistorialVentas((prev) => [...nuevasVentas, ...prev].slice(0, 50));

    // Vaciar carrito
    setCarritoVentas([]);

    setProcesando(false);

    if (ventasFallidas === 0) {
      await showSuccessAlert(
        "¡Venta completada!",
        `${ventasExitosas} producto(s) vendidos\nTotal: $${formatNumber(totalCarrito)}`,
      );
    } else {
      showToast(
        "warning",
        `${ventasExitosas} vendidos, ${ventasFallidas} fallaron`,
      );
    }
  };

  // Cancelar y volver a escanear
  const cancelarEscaneo = () => {
    setProductoEscaneado(null);
    setCantidad(1);
    setCodigoManual("");

    // El escáner fue detenido, reiniciar si no estamos en modo manual
    if (!modoManual) {
      setEscaneando(false);
      // Dar tiempo para que se desmonte y luego reiniciar
      setTimeout(() => {
        setEscaneando(true);
      }, 100);
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            📷 Escáner de Ventas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Escanea códigos de barras para registrar ventas
          </p>

          {/* Botón para activar modo escáner (solo en móvil y si no está activo) */}
          {esMovil && !modoEscaner && (
            <button
              onClick={() => setModoEscaner(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              📱 Activar modo escáner
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                Solo escáner
              </span>
            </button>
          )}
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

        {/* Selector de modo - oculto cuando hay producto o modo agregar */}
        {!productoEscaneado && !modoAgregar && (
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
        )}

        {/* Escáner de cámara */}
        {!modoManual && !productoEscaneado && !modoAgregar && (
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
                  {esMovil
                    ? "Presiona el botón para iniciar la cámara"
                    : "Elige cómo ingresar el código de barras"}
                </p>

                <div
                  className={`flex ${esMovil ? "flex-col" : "flex-row"} justify-center gap-3`}
                >
                  <button
                    onClick={iniciarEscaner}
                    className={`btn-primary text-lg px-8 py-3 ${!esMovil && "flex-1 max-w-xs"}`}
                  >
                    🎯 {esMovil ? "Iniciar Escáner" : "Usar Webcam"}
                  </button>

                  {!esMovil && (
                    <button
                      onClick={() => setModoManual(true)}
                      className="btn-secondary text-lg px-8 py-3 flex-1 max-w-xs"
                    >
                      ⌨️ Escribir Código
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-4">
                  {esMovil
                    ? "📱 Se usará la cámara trasera"
                    : "💡 Para códigos pequeños o difíciles, usa 'Escribir Código'"}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-center text-sm text-gray-600 mb-3">
                  📷 Apunta al código de barras y mantén{" "}
                  {esMovil ? "el celular" : "la cámara"} estable
                  {isLandscape && esMovil && (
                    <span className="block text-xs text-primary mt-1">
                      📱 Modo horizontal detectado - área ampliada
                    </span>
                  )}
                </p>

                {/* Tips diferentes para móvil y desktop */}
                {esMovil ? (
                  <div className="text-center text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mb-3">
                    💡 <strong>Tip para códigos pequeños:</strong> NO acerques
                    demasiado el celular (se desenfoca). Mantén ~15cm de
                    distancia y <strong>aumenta el zoom</strong> abajo ⬇️
                  </div>
                ) : (
                  <div className="text-center text-xs text-blue-600 bg-blue-50 rounded-lg p-2 mb-3">
                    💻 <strong>Tip para webcam:</strong> Si el código es muy
                    pequeño, usa el <strong>modo manual</strong> (botón abajo).
                    Las webcams no tienen zoom óptico. Acerca el código a ~20cm
                    de la cámara.
                  </div>
                )}
                <div
                  id="reader"
                  ref={scannerRef}
                  className="w-full rounded-lg overflow-hidden border-2 border-primary"
                  style={{
                    minHeight: isLandscape ? "250px" : "350px",
                    maxHeight: isLandscape ? "60vh" : "auto",
                  }}
                ></div>

                {/* Control de zoom para códigos pequeños */}
                {zoomDisponible && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-blue-700 font-medium">
                        🔍 Zoom digital (¡usa esto para códigos pequeños!)
                      </span>
                      <span className="text-sm text-blue-600 font-bold">
                        {zoomLevel.toFixed(1)}x
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          cambiarZoom(Math.max(1, zoomLevel - 0.5))
                        }
                        className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm font-bold hover:bg-blue-50"
                        disabled={zoomLevel <= 1}
                      >
                        −
                      </button>
                      <input
                        type="range"
                        min="1"
                        max={maxZoom}
                        step="0.1"
                        value={zoomLevel}
                        onChange={(e) =>
                          cambiarZoom(parseFloat(e.target.value))
                        }
                        className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <button
                        onClick={() =>
                          cambiarZoom(Math.min(maxZoom, zoomLevel + 0.5))
                        }
                        className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm font-bold hover:bg-blue-50"
                        disabled={zoomLevel >= maxZoom}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2 text-center font-medium">
                      📱 Mantén distancia (~15cm) + sube el zoom = código
                      pequeño enfocado
                    </p>
                  </div>
                )}

                {/* OCR para leer números automáticamente */}
                <div className="mt-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm text-purple-800 font-bold">
                        🔢 Leer números automáticamente
                      </span>
                      <p className="text-xs text-purple-600">
                        Lee los números debajo del código de barras
                      </p>
                    </div>
                    <button
                      onClick={toggleOCR}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        ocrActivo
                          ? "bg-purple-600 text-white animate-pulse"
                          : "bg-white border-2 border-purple-400 text-purple-700 hover:bg-purple-100"
                      }`}
                    >
                      {ocrActivo ? "⏹️ Detener" : "▶️ Activar"}
                    </button>
                  </div>
                  {ocrStatus && (
                    <div
                      className={`text-center py-2 px-3 rounded-lg mt-2 ${
                        ocrStatus.includes("Encontrado")
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      <span className="text-sm font-medium">{ocrStatus}</span>
                    </div>
                  )}
                  <p className="text-xs text-purple-500 mt-2 text-center">
                    💡 Apunta a los{" "}
                    <strong>números debajo de las barras</strong> (ej:
                    7790012345678)
                  </p>
                </div>

                <p className="text-center text-xs text-gray-500 mt-2">
                  💡 Asegúrate de tener buena iluminación y el código centrado
                </p>

                {/* Botón prominente para códigos pequeños */}
                <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4">
                  <p className="text-center text-amber-800 font-medium mb-3">
                    🔢 ¿Código muy pequeño o no se lee?
                  </p>
                  <button
                    onClick={() => setModoManual(true)}
                    className="w-full btn-primary bg-amber-500 hover:bg-amber-600 text-lg py-3 flex items-center justify-center gap-2"
                  >
                    ⌨️ Escribir los números del código
                  </button>
                  <p className="text-center text-xs text-amber-700 mt-2">
                    👉 Los números aparecen{" "}
                    <strong>debajo de las barras</strong> (ej: 7790001234567)
                  </p>
                </div>

                <div className="mt-3 flex justify-center">
                  <button onClick={detenerEscaner} className="btn-secondary">
                    ⏹️ Detener cámara
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Entrada manual */}
        {modoManual && !productoEscaneado && !modoAgregar && (
          <div className="card">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
              🔢 Escribir números del código de barras
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
              Escribe los números que aparecen{" "}
              <strong>debajo de las barras</strong>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ej: 7790001234567"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && buscarCodigoManual()}
                className="input-field flex-1 font-mono text-center text-xl tracking-wider"
                autoFocus
              />
              <button onClick={buscarCodigoManual} className="btn-primary px-6">
                🔍 Buscar
              </button>
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                💡 <strong>Ejemplos de códigos:</strong>
                <br />• EAN-13: <span className="font-mono">
                  7790001234567
                </span>{" "}
                (13 dígitos)
                <br />• EAN-8: <span className="font-mono">12345678</span> (8
                dígitos)
                <br />• Interno: <span className="font-mono">STK12345678</span>
              </p>
            </div>
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
            <div className="flex flex-col gap-2">
              <div className="flex gap-3">
                <button
                  onClick={cancelarEscaneo}
                  disabled={procesando}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  ❌ Cancelar
                </button>
                <button
                  onClick={agregarAlCarrito}
                  disabled={procesando}
                  className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  🛒 Agregar al carrito
                </button>
              </div>
              {carritoVentas.length === 0 && (
                <button
                  onClick={descontarProducto}
                  disabled={procesando}
                  className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {procesando ? (
                    <>
                      <span className="animate-spin">⏳</span> Procesando...
                    </>
                  ) : (
                    <>✓ Vender directamente</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Carrito de ventas múltiples */}
        {carritoVentas.length > 0 && (
          <div className="card border-2 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  Carrito de Ventas
                </h3>
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {carritoVentas.length} producto(s)
                </span>
              </div>
              <button
                onClick={vaciarCarrito}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                🗑️ Vaciar
              </button>
            </div>

            {/* Lista de productos en carrito */}
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {carritoVentas.map((item) => (
                <div
                  key={item.codigo}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                      {item.nombre}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ${formatNumber(item.precio)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        modificarCantidadCarrito(item.codigo, item.cantidad - 1)
                      }
                      className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-gray-800 dark:text-gray-200">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() =>
                        modificarCantidadCarrito(item.codigo, item.cantidad + 1)
                      }
                      disabled={item.cantidad >= item.stockDisponible}
                      className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                    >
                      +
                    </button>
                    <button
                      onClick={() => quitarDelCarrito(item.codigo)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="ml-3 font-bold text-primary min-w-[70px] text-right">
                    ${formatNumber(item.precio * item.cantidad)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total del carrito */}
            <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">
                  Total a cobrar:
                </span>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  $
                  {formatNumber(
                    carritoVentas.reduce(
                      (sum, item) => sum + item.precio * item.cantidad,
                      0,
                    ),
                  )}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {carritoVentas.reduce((sum, item) => sum + item.cantidad, 0)}{" "}
                unidades en total
              </p>
            </div>

            {/* Botón para registrar venta */}
            <button
              onClick={registrarVentasCarrito}
              disabled={procesando}
              className="w-full py-4 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {procesando ? (
                <>
                  <span className="animate-spin">⏳</span> Procesando ventas...
                </>
              ) : (
                <>
                  ✓ Registrar Venta ($
                  {formatNumber(
                    carritoVentas.reduce(
                      (sum, item) => sum + item.precio * item.cantidad,
                      0,
                    ),
                  )}
                  )
                </>
              )}
            </button>
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

              {/* Precios - en dos columnas */}
              <div className="grid grid-cols-2 gap-3">
                {/* Precio de Costo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💰 Precio de costo
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
                      value={nuevoProducto.precioCosto}
                      onChange={(e) =>
                        setNuevoProducto((prev) => ({
                          ...prev,
                          precioCosto: e.target.value,
                        }))
                      }
                      className="input-field w-full pl-8"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Opcional</p>
                </div>

                {/* Precio de Venta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🏷️ Precio de venta *
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
                      value={nuevoProducto.precioVenta}
                      onChange={(e) =>
                        setNuevoProducto((prev) => ({
                          ...prev,
                          precioVenta: e.target.value,
                        }))
                      }
                      className="input-field w-full pl-8 text-lg font-bold"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Requerido</p>
                </div>
              </div>

              {/* URL de imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🖼️ URL de imagen (opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={nuevoProducto.imagen}
                  onChange={(e) =>
                    setNuevoProducto((prev) => ({
                      ...prev,
                      imagen: e.target.value,
                    }))
                  }
                  className="input-field w-full"
                />
                {nuevoProducto.imagen && (
                  <div className="mt-2 flex justify-center">
                    <img
                      src={nuevoProducto.imagen}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded-lg border"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                )}
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
