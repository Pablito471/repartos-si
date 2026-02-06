// Escáner de inventario con sonido beep y linterna - v2.1
import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useAuth } from "@/context/AuthContext";
import { useDeposito } from "@/context/DepositoContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { productosService } from "@/services/api";
import { showToast, showConfirmAlert, showSuccessAlert } from "@/utils/alerts";
import { formatNumber } from "@/utils/formatters";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { createWorker } from "tesseract.js";

export default function EscanerDeposito() {
  const { usuario, esMovil } = useAuth();
  const { recargarInventario } = useDeposito();
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  const [escaneando, setEscaneando] = useState(false);
  const [productoEscaneado, setProductoEscaneado] = useState(null);
  const [errorCamara, setErrorCamara] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [procesando, setProcesando] = useState(false);
  const [historialMovimientos, setHistorialMovimientos] = useState([]);
  const [modoManual, setModoManual] = useState(false);
  const [codigoManual, setCodigoManual] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState("entrada"); // entrada o salida
  const [motivo, setMotivo] = useState("");

  // Estados para modo agregar
  const [modoAgregar, setModoAgregar] = useState(false);
  const [codigoEscaneado, setCodigoEscaneado] = useState("");
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    cantidad: 1,
    precio: "",
    costo: "",
    categoria: "General",
    ubicacion: "",
    imagen: "",
  });

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

  // Control de linterna
  const [linternaActiva, setLinternaActiva] = useState(false);
  const [linternaDisponible, setLinternaDisponible] = useState(false);

  // Referencia para el elemento de audio
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

        if (html5QrcodeScannerRef.current) {
          try {
            await html5QrcodeScannerRef.current.stop();
          } catch (e) {}
        }

        const isDesktop =
          !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          );

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isLandscapeMode = screenWidth > screenHeight;

        const qrboxWidth = isDesktop
          ? Math.min(screenWidth - 100, 600)
          : isLandscapeMode
            ? Math.min(screenWidth - 80, 550)
            : Math.min(screenWidth - 40, 350);
        const qrboxHeight = isDesktop
          ? Math.floor(qrboxWidth * 0.3)
          : isLandscapeMode
            ? Math.floor(qrboxWidth * 0.35)
            : Math.floor(qrboxWidth * 0.5);

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        html5QrcodeScannerRef.current = new Html5Qrcode("reader", {
          formatsToSupport: formatsToSupport,
          verbose: false,
        });

        const config = {
          fps: isDesktop ? 20 : 15,
          qrbox: { width: qrboxWidth, height: qrboxHeight },
          aspectRatio: isLandscapeMode ? 1.777778 : 1.333333,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          disableFlip: false,
        };

        try {
          const cameraConfig = isDesktop
            ? { facingMode: "user" }
            : { facingMode: "environment" };

          await html5QrcodeScannerRef.current.start(
            cameraConfig,
            config,
            async (decodedText, decodedResult) => {
              console.log("✅ Código detectado:", decodedText);
              // Reproducir sonido fuerte de escaneo
              reproducirSonidoEscaneo();
              if (navigator.vibrate) {
                navigator.vibrate(200);
              }
              await buscarProducto(decodedText);
            },
            (errorMessage) => {},
          );

          // Configurar zoom y enfoque
          try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            const videoElement = document.querySelector("#reader video");
            if (videoElement && videoElement.srcObject) {
              const track = videoElement.srcObject.getVideoTracks()[0];
              const capabilities = track.getCapabilities();

              if (
                capabilities.focusMode &&
                capabilities.focusMode.includes("continuous")
              ) {
                await track.applyConstraints({
                  advanced: [{ focusMode: "continuous" }],
                });
              }

              if (capabilities.zoom) {
                const minZoom = capabilities.zoom.min || 1;
                const maxZoomVal = capabilities.zoom.max || 1;
                setMaxZoom(maxZoomVal);
                setZoomDisponible(true);
                const initialZoom = Math.min(
                  minZoom + (maxZoomVal - minZoom) * 0.4,
                  3,
                );
                setZoomLevel(initialZoom);
                await track.applyConstraints({
                  advanced: [{ zoom: initialZoom }],
                });
              }

              // Verificar si la linterna está disponible
              if (capabilities.torch) {
                setLinternaDisponible(true);
                setLinternaActiva(false);
              } else {
                setLinternaDisponible(false);
              }
            }
          } catch (zoomErr) {
            setZoomDisponible(false);
            setLinternaDisponible(false);
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
      }
    } catch (err) {
      console.log("Error al cambiar zoom:", err);
    }
  };

  // Función para encender/apagar linterna
  const toggleLinterna = async () => {
    try {
      const videoElement = document.querySelector("#reader video");
      if (videoElement && videoElement.srcObject) {
        const track = videoElement.srcObject.getVideoTracks()[0];
        const nuevoEstado = !linternaActiva;
        await track.applyConstraints({
          advanced: [{ torch: nuevoEstado }],
        });
        setLinternaActiva(nuevoEstado);
      }
    } catch (err) {
      console.log("Error al cambiar linterna:", err);
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

      await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
        tessedit_pageseg_mode: "7",
      });

      ocrWorkerRef.current = worker;
      setOcrStatus("OCR listo");
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
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      const captureHeight = Math.floor(videoHeight * 0.3);
      const captureY = videoHeight - captureHeight;

      canvas.width = videoWidth;
      canvas.height = captureHeight;

      ctx.drawImage(
        videoElement,
        0,
        captureY,
        videoWidth,
        captureHeight,
        0,
        0,
        videoWidth,
        captureHeight,
      );

      ctx.filter = "contrast(1.5) brightness(1.2)";
      ctx.drawImage(canvas, 0, 0);

      const imageData = canvas.toDataURL("image/png");

      setOcrStatus("Leyendo números...");
      const {
        data: { text },
      } = await ocrWorkerRef.current.recognize(imageData);

      const numeros = text.replace(/\s/g, "");
      const patronEAN13 = /\d{13}/g;
      const patronEAN8 = /\d{8}/g;
      const patronUPC = /\d{12}/g;

      let codigoDetectado = null;
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
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        setOcrStatus(`Encontrado: ${codigoDetectado}`);
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
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current);
        ocrIntervalRef.current = null;
      }
      setOcrActivo(false);
      setOcrStatus("");
    } else {
      await inicializarOCR();
      setOcrActivo(true);
      ocrIntervalRef.current = setInterval(() => {
        ejecutarOCR();
      }, 2000);
    }
  }, [ocrActivo, inicializarOCR, ejecutarOCR]);

  // Limpiar OCR
  useEffect(() => {
    return () => {
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current);
      }
    };
  }, []);

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
    // Apagar linterna si está encendida
    if (linternaActiva) {
      try {
        const videoElement = document.querySelector("#reader video");
        if (videoElement && videoElement.srcObject) {
          const track = videoElement.srcObject.getVideoTracks()[0];
          await track.applyConstraints({ advanced: [{ torch: false }] });
        }
      } catch (e) {}
    }

    if (html5QrcodeScannerRef.current) {
      try {
        await html5QrcodeScannerRef.current.stop();
      } catch (e) {}
      html5QrcodeScannerRef.current = null;
    }
    setEscaneando(false);
    setErrorCamara(null);
    setLinternaActiva(false);
    setLinternaDisponible(false);
  }, [linternaActiva]);

  // Buscar producto por código
  const buscarProducto = async (codigo) => {
    console.log("🔍 Buscando código:", codigo);

    try {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.pause(true);
      }

      const response = await productosService.buscarPorCodigo(codigo);
      console.log("📦 Respuesta:", response);

      if (response.data.success && response.data.data) {
        setProductoEscaneado(response.data.data);
        setModoAgregar(false);
        setCantidad(1);
        setMotivo("");
        if (html5QrcodeScannerRef.current) {
          try {
            await html5QrcodeScannerRef.current.stop();
          } catch (e) {}
        }
        showToast(
          "success",
          `Producto encontrado: ${response.data.data.nombre}`,
        );
      } else {
        throw new Error("Producto no encontrado");
      }
    } catch (error) {
      console.log("❌ Error o no encontrado:", error);

      const quiereAgregar = await showConfirmAlert(
        "Producto no encontrado",
        `El código "${codigo}" no está en tu inventario. ¿Deseas agregar un nuevo producto?`,
        "Sí, agregar",
        "Cancelar",
      );

      if (quiereAgregar) {
        if (html5QrcodeScannerRef.current) {
          try {
            await html5QrcodeScannerRef.current.stop();
          } catch (e) {}
        }
        setModoAgregar(true);
        setCodigoEscaneado(codigo);
        setNuevoProducto({
          nombre: "",
          cantidad: 1,
          precio: "",
          costo: "",
          categoria: "General",
          ubicacion: "",
        });
      } else {
        if (html5QrcodeScannerRef.current) {
          setTimeout(() => {
            try {
              html5QrcodeScannerRef.current?.resume();
            } catch (e) {}
          }, 500);
        }
      }
    }
  };

  // Agregar producto al inventario
  const agregarProducto = async () => {
    if (!nuevoProducto.nombre.trim()) {
      showToast("warning", "Ingresa el nombre del producto");
      return;
    }

    if (!nuevoProducto.precio || parseFloat(nuevoProducto.precio) <= 0) {
      showToast("warning", "Ingresa un precio válido");
      return;
    }

    setProcesando(true);
    try {
      const datosProducto = {
        codigo: codigoEscaneado || `PROD-${Date.now()}`,
        nombre: nuevoProducto.nombre.trim(),
        stock: parseInt(nuevoProducto.cantidad),
        precio: parseFloat(nuevoProducto.precio),
        costo: nuevoProducto.costo ? parseFloat(nuevoProducto.costo) : null,
        categoria: nuevoProducto.categoria,
        ubicacion: nuevoProducto.ubicacion || null,
        imagen: nuevoProducto.imagen || null,
      };

      const response = await productosService.crear(datosProducto);

      if (response.data?.success || response.success) {
        // Recargar inventario del contexto
        try {
          await recargarInventario();
        } catch (e) {
          console.log("Info: no se pudo recargar inventario del contexto");
        }

        await showSuccessAlert(
          "¡Producto agregado!",
          `${nuevoProducto.nombre}\nStock inicial: ${nuevoProducto.cantidad}\nPrecio: $${formatNumber(parseFloat(nuevoProducto.precio))}`,
        );

        setModoAgregar(false);
        setCodigoEscaneado("");
        setNuevoProducto({
          nombre: "",
          cantidad: 1,
          precio: "",
          costo: "",
          categoria: "General",
          ubicacion: "",
          imagen: "",
        });
        setCodigoManual("");

        if (!modoManual) {
          setEscaneando(false);
          setTimeout(() => {
            setEscaneando(true);
          }, 100);
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
    setNuevoProducto({
      nombre: "",
      cantidad: 1,
      precio: "",
      costo: "",
      categoria: "General",
      ubicacion: "",
      imagen: "",
    });
    setCodigoManual("");

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

  // Registrar movimiento de stock
  const registrarMovimiento = async () => {
    if (!productoEscaneado) return;

    if (cantidad < 1) {
      showToast("warning", "La cantidad debe ser al menos 1");
      return;
    }

    if (tipoMovimiento === "salida" && cantidad > productoEscaneado.stock) {
      showToast(
        "error",
        `Stock insuficiente. Disponible: ${productoEscaneado.stock}`,
      );
      return;
    }

    const accion = tipoMovimiento === "entrada" ? "Entrada" : "Salida";
    const confirmado = await showConfirmAlert(
      `Confirmar ${accion}`,
      `¿Registrar ${accion.toLowerCase()} de ${cantidad} unidad(es) de "${productoEscaneado.nombre}"?\n\n${motivo ? `Motivo: ${motivo}` : ""}`,
      "Sí, confirmar",
      "Cancelar",
    );

    if (!confirmado) return;

    setProcesando(true);
    try {
      const response = await productosService.registrarMovimientoStock(
        productoEscaneado.id,
        cantidad,
        tipoMovimiento,
        motivo || `${accion} por escáner`,
      );

      if (response.data.success) {
        // Recargar inventario del contexto
        try {
          await recargarInventario();
        } catch (e) {
          console.log("Info: no se pudo recargar inventario del contexto");
        }

        const movimiento = {
          ...response.data.data,
          fecha: new Date().toISOString(),
        };

        setHistorialMovimientos((prev) => [movimiento, ...prev].slice(0, 20));

        await showSuccessAlert(
          `¡${accion} registrada!`,
          `${cantidad}x ${productoEscaneado.nombre}\nStock anterior: ${response.data.data.stockAnterior}\nStock actual: ${response.data.data.stockActual}`,
        );

        setProductoEscaneado(null);
        setCantidad(1);
        setMotivo("");
        setCodigoManual("");

        if (!modoManual) {
          setEscaneando(false);
          setTimeout(() => {
            setEscaneando(true);
          }, 100);
        }
      }
    } catch (error) {
      const mensaje =
        error.response?.data?.message || "Error al registrar movimiento";
      showToast("error", mensaje);
    } finally {
      setProcesando(false);
    }
  };

  // Cancelar y volver a escanear
  const cancelarEscaneo = () => {
    setProductoEscaneado(null);
    setCantidad(1);
    setMotivo("");
    setCodigoManual("");

    if (!modoManual) {
      setEscaneando(false);
      setTimeout(() => {
        setEscaneando(true);
      }, 100);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (html5QrcodeScannerRef.current) {
        try {
          html5QrcodeScannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  const entradasHoy = historialMovimientos.filter(
    (m) => m.tipo === "entrada",
  ).length;
  const salidasHoy = historialMovimientos.filter(
    (m) => m.tipo === "salida",
  ).length;

  return (
    <DepositoLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            📷 Escáner de Inventario
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Escanea códigos para registrar entradas y salidas
          </p>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-sm">Entradas esta sesión</p>
            <p className="text-2xl font-bold">{entradasHoy}</p>
          </div>
          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <p className="text-red-100 text-sm">Salidas esta sesión</p>
            <p className="text-2xl font-bold">{salidasHoy}</p>
          </div>
        </div>

        {/* Selector de modo */}
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
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
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
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
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
              </div>
            ) : !escaneando ? (
              <div className="text-center py-8">
                <span className="text-6xl block mb-4">📷</span>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Presiona el botón para iniciar la cámara
                </p>
                <button
                  onClick={iniciarEscaner}
                  className="btn-primary bg-orange-500 hover:bg-orange-600 text-lg px-8 py-3"
                >
                  🎯 Iniciar Escáner
                </button>
              </div>
            ) : (
              <div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                  📷 Apunta al código de barras y mantén estable
                </p>

                {esMovil ? (
                  <div className="text-center text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2 mb-3">
                    💡 <strong>Tip:</strong> Mantén ~15cm de distancia y aumenta
                    el zoom ⬇️
                  </div>
                ) : (
                  <div className="text-center text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2 mb-3">
                    💻 <strong>Tip:</strong> Si el código es pequeño, usa el
                    modo manual
                  </div>
                )}

                <div
                  id="reader"
                  ref={scannerRef}
                  className="w-full rounded-lg overflow-hidden border-2 border-orange-500"
                  style={{
                    minHeight: isLandscape ? "250px" : "350px",
                    maxHeight: isLandscape ? "60vh" : "auto",
                  }}
                ></div>

                {/* Control de zoom */}
                {zoomDisponible && (
                  <div className="mt-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                        🔍 Zoom digital
                      </span>
                      <span className="text-sm text-orange-600 font-bold">
                        {zoomLevel.toFixed(1)}x
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          cambiarZoom(Math.max(1, zoomLevel - 0.5))
                        }
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-orange-300 rounded-lg text-sm font-bold hover:bg-orange-50"
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
                        className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      />
                      <button
                        onClick={() =>
                          cambiarZoom(Math.min(maxZoom, zoomLevel + 0.5))
                        }
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-orange-300 rounded-lg text-sm font-bold hover:bg-orange-50"
                        disabled={zoomLevel >= maxZoom}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Control de linterna */}
                {linternaDisponible && (
                  <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-yellow-800 dark:text-yellow-200 font-bold">
                          🔦 Linterna
                        </span>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          Enciende la luz para lugares oscuros
                        </p>
                      </div>
                      <button
                        onClick={toggleLinterna}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${
                          linternaActiva
                            ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/50"
                            : "bg-white dark:bg-gray-800 border-2 border-yellow-400 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100"
                        }`}
                      >
                        {linternaActiva ? "💡 Encendida" : "🔦 Encender"}
                      </button>
                    </div>
                  </div>
                )}

                {/* OCR */}
                <div className="mt-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm text-purple-800 dark:text-purple-200 font-bold">
                        🔢 Leer números automáticamente
                      </span>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Lee los números debajo del código
                      </p>
                    </div>
                    <button
                      onClick={toggleOCR}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        ocrActivo
                          ? "bg-purple-600 text-white animate-pulse"
                          : "bg-white dark:bg-gray-800 border-2 border-purple-400 text-purple-700 dark:text-purple-300 hover:bg-purple-100"
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
                </div>

                {/* Botón código pequeño */}
                <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4">
                  <p className="text-center text-amber-800 dark:text-amber-200 font-medium mb-3">
                    🔢 ¿Código muy pequeño o no se lee?
                  </p>
                  <button
                    onClick={() => setModoManual(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white text-lg py-3 rounded-lg font-semibold"
                  >
                    ⌨️ Escribir los números del código
                  </button>
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
              🔢 Escribir código de barras
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
              Escribe los números que aparecen debajo de las barras
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
              <button
                onClick={buscarCodigoManual}
                className="btn-primary bg-orange-500 hover:bg-orange-600 px-6"
              >
                🔍 Buscar
              </button>
            </div>
          </div>
        )}

        {/* Producto escaneado */}
        {productoEscaneado && (
          <div className="card border-2 border-orange-500">
            <div className="text-center mb-4">
              <span className="text-4xl mb-2 block">✅</span>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Producto Encontrado
              </h3>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-400 font-mono mb-1">
                {productoEscaneado.codigo}
              </p>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white">
                {productoEscaneado.nombre}
              </h4>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-sm text-gray-500">
                    Precio: ${formatNumber(productoEscaneado.precio)}
                  </p>
                  {productoEscaneado.ubicacion && (
                    <p className="text-xs text-gray-400">
                      📍 {productoEscaneado.ubicacion}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">
                    {productoEscaneado.stock}
                  </p>
                  <p className="text-xs text-gray-500">en stock</p>
                </div>
              </div>
            </div>

            {/* Selector de tipo de movimiento */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de movimiento
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTipoMovimiento("entrada")}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    tipoMovimiento === "entrada"
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  📥 Entrada
                </button>
                <button
                  onClick={() => setTipoMovimiento("salida")}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    tipoMovimiento === "salida"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  📤 Salida
                </button>
              </div>
            </div>

            {/* Cantidad */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cantidad
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={
                    tipoMovimiento === "salida" ? productoEscaneado.stock : 9999
                  }
                  value={cantidad}
                  onChange={(e) =>
                    setCantidad(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-20 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg py-2"
                />
                <button
                  onClick={() => {
                    const max =
                      tipoMovimiento === "salida"
                        ? productoEscaneado.stock
                        : 9999;
                    setCantidad(Math.min(max, cantidad + 1));
                  }}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Motivo */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo (opcional)
              </label>
              <input
                type="text"
                placeholder={
                  tipoMovimiento === "entrada"
                    ? "Ej: Recepción de proveedor"
                    : "Ej: Envío a cliente"
                }
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="input-field w-full"
              />
            </div>

            {/* Resumen */}
            <div
              className={`rounded-xl p-4 mb-4 text-center ${
                tipoMovimiento === "entrada"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stock después del movimiento
              </p>
              <p
                className={`text-3xl font-bold ${
                  tipoMovimiento === "entrada"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {tipoMovimiento === "entrada"
                  ? productoEscaneado.stock + cantidad
                  : productoEscaneado.stock - cantidad}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={cancelarEscaneo}
                disabled={procesando}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
              <button
                onClick={registrarMovimiento}
                disabled={procesando}
                className={`flex-1 py-3 px-4 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ${
                  tipoMovimiento === "entrada"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {procesando ? (
                  <>
                    <span className="animate-spin">⏳</span> Procesando...
                  </>
                ) : (
                  <>
                    ✓ Confirmar{" "}
                    {tipoMovimiento === "entrada" ? "Entrada" : "Salida"}
                  </>
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
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Agregar Nuevo Producto
              </h3>
            </div>

            <div className="space-y-4">
              {codigoEscaneado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    📊 Código escaneado
                  </label>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-center text-lg">
                    {codigoEscaneado}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del producto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Coca Cola 500ml"
                  value={nuevoProducto.nombre}
                  onChange={(e) =>
                    setNuevoProducto((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio venta *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={nuevoProducto.precio}
                      onChange={(e) =>
                        setNuevoProducto((prev) => ({
                          ...prev,
                          precio: e.target.value,
                        }))
                      }
                      className="input-field w-full pl-8"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Costo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={nuevoProducto.costo}
                      onChange={(e) =>
                        setNuevoProducto((prev) => ({
                          ...prev,
                          costo: e.target.value,
                        }))
                      }
                      className="input-field w-full pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={nuevoProducto.cantidad}
                    onChange={(e) =>
                      setNuevoProducto((prev) => ({
                        ...prev,
                        cantidad: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: A-01"
                    value={nuevoProducto.ubicacion}
                    onChange={(e) =>
                      setNuevoProducto((prev) => ({
                        ...prev,
                        ubicacion: e.target.value,
                      }))
                    }
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  placeholder="Ej: Bebidas"
                  value={nuevoProducto.categoria}
                  onChange={(e) =>
                    setNuevoProducto((prev) => ({
                      ...prev,
                      categoria: e.target.value,
                    }))
                  }
                  className="input-field w-full"
                />
              </div>

              {/* URL de imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelarAgregar}
                disabled={procesando}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
              <button
                onClick={agregarProducto}
                disabled={procesando}
                className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {procesando ? (
                  <>
                    <span className="animate-spin">⏳</span> Procesando...
                  </>
                ) : (
                  <>➕ Agregar Producto</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Historial de movimientos */}
        {historialMovimientos.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">
              📋 Movimientos de esta sesión
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {historialMovimientos.map((mov, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {mov.cantidad}x {mov.nombre}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(mov.fecha).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        mov.tipo === "entrada"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {mov.tipo === "entrada" ? "+" : "-"}
                      {mov.cantidad}
                    </p>
                    <p className="text-xs text-gray-400">
                      Stock: {mov.stockActual}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div className="card bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
            💡 ¿Cómo funciona?
          </h3>
          <ol className="text-sm text-orange-700 dark:text-orange-300 space-y-1 list-decimal list-inside">
            <li>Escanea el código o ingrésalo manualmente</li>
            <li>Selecciona el tipo de movimiento (Entrada/Salida)</li>
            <li>Indica la cantidad y confirma</li>
            <li>El stock se actualizará automáticamente</li>
          </ol>
        </div>
      </div>
    </DepositoLayout>
  );
}
