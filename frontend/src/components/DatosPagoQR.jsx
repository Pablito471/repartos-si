import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import Swal from "sweetalert2";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

/**
 * Componente completo para gestionar pagos con QR
 * - Datos bancarios editables
 * - Generador de QR para cobrar
 * - Escáner de QR para pagar
 *
 * @param {Object} props
 * @param {Object} props.usuario - Datos del usuario actual
 * @param {Function} props.onGuardar - Callback para guardar datos bancarios
 * @param {string} props.colorPrimario - Color primario del tema (ej: "orange", "green", "blue")
 * @param {string} props.conceptoDefault - Concepto por defecto para el QR
 */
export default function DatosPagoQR({
  usuario,
  onGuardar,
  colorPrimario = "orange",
  conceptoDefault = "Pago",
}) {
  // Estados principales
  const [modoActivo, setModoActivo] = useState("datos"); // "datos", "cobrar", "pagar"
  const [editando, setEditando] = useState(false);

  // Estados para QR de cobro
  const [qrDataURL, setQrDataURL] = useState(null);
  const [montoQR, setMontoQR] = useState("");
  const [conceptoQR, setConceptoQR] = useState(conceptoDefault);
  const [mostrarQR, setMostrarQR] = useState(false);

  // Estados para escáner de pago
  const [escaneando, setEscaneando] = useState(false);
  const [pagoEscaneado, setPagoEscaneado] = useState(null);
  const [errorCamara, setErrorCamara] = useState(null);
  const html5QrcodeRef = useRef(null);
  const audioContextRef = useRef(null);

  const [formDatosPago, setFormDatosPago] = useState({
    aliasBancario: usuario?.aliasBancario || "",
    cbu: usuario?.cbu || "",
    cvu: usuario?.cvu || "",
    banco: usuario?.banco || "",
    titularCuenta: usuario?.titularCuenta || usuario?.nombre || "",
  });

  // Actualizar form cuando cambia el usuario
  useEffect(() => {
    if (usuario) {
      setFormDatosPago({
        aliasBancario: usuario.aliasBancario || "",
        cbu: usuario.cbu || "",
        cvu: usuario.cvu || "",
        banco: usuario.banco || "",
        titularCuenta: usuario.titularCuenta || usuario.nombre || "",
      });
    }
  }, [usuario]);

  // Limpiar escáner al desmontar
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Lista de bancos principales de Argentina
  const bancos = [
    "Banco Nación",
    "Banco Provincia",
    "Banco Ciudad",
    "Banco Galicia",
    "Banco Santander",
    "Banco BBVA",
    "Banco Macro",
    "Banco HSBC",
    "Banco Credicoop",
    "Brubank",
    "Ualá",
    "Mercado Pago",
    "Naranja X",
    "Prex",
    "Otro",
  ];

  const validarCBU = (cbu) => {
    if (!cbu) return true;
    return /^\d{22}$/.test(cbu);
  };

  const validarAlias = (alias) => {
    if (!alias) return true;
    return /^[a-zA-Z0-9.]{6,20}$/.test(alias);
  };

  const guardarDatosPago = () => {
    if (formDatosPago.cbu && !validarCBU(formDatosPago.cbu)) {
      Swal.fire({
        icon: "error",
        title: "CBU inválido",
        text: "El CBU debe tener exactamente 22 dígitos numéricos",
      });
      return;
    }

    if (formDatosPago.cvu && !validarCBU(formDatosPago.cvu)) {
      Swal.fire({
        icon: "error",
        title: "CVU inválido",
        text: "El CVU debe tener exactamente 22 dígitos numéricos",
      });
      return;
    }

    if (
      formDatosPago.aliasBancario &&
      !validarAlias(formDatosPago.aliasBancario)
    ) {
      Swal.fire({
        icon: "error",
        title: "Alias inválido",
        text: "El alias debe tener entre 6 y 20 caracteres (letras, números y puntos)",
      });
      return;
    }

    onGuardar(formDatosPago);
    setEditando(false);
    Swal.fire({
      icon: "success",
      title: "Datos de pago actualizados",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Generar QR con datos de pago
  const generarQR = async () => {
    if (!montoQR || parseFloat(montoQR) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Ingresa un monto",
        text: "Debes especificar el monto a cobrar",
      });
      return;
    }

    if (
      !formDatosPago.aliasBancario &&
      !formDatosPago.cbu &&
      !formDatosPago.cvu
    ) {
      Swal.fire({
        icon: "warning",
        title: "Configura tus datos de pago",
        text: "Debes tener al menos un alias, CBU o CVU configurado",
      });
      return;
    }

    // Crear texto del QR con formato estructurado para el escáner
    const datosQR = {
      tipo: "PAGO_REPARTOS",
      version: "1.0",
      monto: parseFloat(montoQR).toFixed(2),
      concepto: conceptoQR,
      destinatario: formDatosPago.titularCuenta || usuario?.nombre,
      alias: formDatosPago.aliasBancario || "",
      cbu: formDatosPago.cbu || "",
      cvu: formDatosPago.cvu || "",
      banco: formDatosPago.banco || "",
      timestamp: Date.now(),
    };

    try {
      const qrDataUrl = await QRCode.toDataURL(JSON.stringify(datosQR), {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      });
      setQrDataURL(qrDataUrl);
      setMostrarQR(true);
    } catch (error) {
      console.error("Error generando QR:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo generar el código QR",
      });
    }
  };

  // Descargar QR como imagen
  const descargarQR = () => {
    if (!qrDataURL) return;
    const link = document.createElement("a");
    link.download = `QR-Cobro-${montoQR}-${new Date().toISOString().split("T")[0]}.png`;
    link.href = qrDataURL;
    link.click();
  };

  // Compartir QR
  const compartirQR = async () => {
    if (!qrDataURL) return;

    if (navigator.share) {
      try {
        const blob = await (await fetch(qrDataURL)).blob();
        const file = new File([blob], "qr-cobro.png", { type: "image/png" });

        await navigator.share({
          title: `Cobro: $${parseFloat(montoQR).toLocaleString("es-AR")}`,
          text: `${conceptoQR} - ${formDatosPago.titularCuenta || usuario?.nombre}`,
          files: [file],
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          copiarDatosAlPortapapeles();
        }
      }
    } else {
      copiarDatosAlPortapapeles();
    }
  };

  const copiarDatosAlPortapapeles = async () => {
    const texto = `💰 Cobro: $${parseFloat(montoQR).toLocaleString("es-AR")}\n📝 ${conceptoQR}\n👤 ${formDatosPago.titularCuenta || usuario?.nombre}\n${formDatosPago.aliasBancario ? `🏦 Alias: ${formDatosPago.aliasBancario}` : formDatosPago.cbu ? `🏦 CBU: ${formDatosPago.cbu}` : `🏦 CVU: ${formDatosPago.cvu}`}`;
    await navigator.clipboard.writeText(texto);
    Swal.fire({
      icon: "success",
      title: "Copiado",
      text: "Datos copiados al portapapeles",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Sonido de escaneo
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

  // Iniciar escáner para pagar
  const iniciarEscaner = async () => {
    setErrorCamara(null);
    setPagoEscaneado(null);
    setEscaneando(true);

    // Esperar a que el DOM se actualice
    setTimeout(async () => {
      try {
        const readerElement = document.getElementById("qr-reader-pago");
        if (!readerElement) {
          setErrorCamara("No se encontró el elemento del escáner");
          setEscaneando(false);
          return;
        }

        const html5Qrcode = new Html5Qrcode("qr-reader-pago", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });

        html5QrcodeRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          () => {},
        );
      } catch (err) {
        console.error("Error al iniciar escáner:", err);
        setErrorCamara(
          "No se pudo acceder a la cámara. Verifica los permisos.",
        );
        setEscaneando(false);
      }
    }, 100);
  };

  // Detener escáner
  const detenerEscaner = async () => {
    try {
      if (html5QrcodeRef.current) {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current = null;
      }
    } catch (err) {
      console.error("Error al detener escáner:", err);
    }
    setEscaneando(false);
  };

  // Cuando se escanea un QR exitosamente
  const onScanSuccess = async (decodedText) => {
    await reproducirSonidoEscaneo();
    await detenerEscaner();

    try {
      // Intentar parsear como JSON (QR generado por esta app)
      const datos = JSON.parse(decodedText);

      if (datos.tipo === "PAGO_REPARTOS") {
        setPagoEscaneado({
          tipo: "app",
          monto: parseFloat(datos.monto),
          concepto: datos.concepto,
          destinatario: datos.destinatario,
          alias: datos.alias,
          cbu: datos.cbu,
          cvu: datos.cvu,
          banco: datos.banco,
        });
      } else {
        // JSON pero no de nuestra app
        setPagoEscaneado({
          tipo: "otro",
          contenido: decodedText,
        });
      }
    } catch {
      // No es JSON, mostrar contenido como texto
      // Intentar extraer datos de pago del texto
      const textoLimpio = decodedText.trim();

      // Buscar patrones de alias, CBU, monto
      const aliasMatch = textoLimpio.match(/alias[:\s]*([a-zA-Z0-9.]+)/i);
      const cbuMatch = textoLimpio.match(/cbu[:\s]*(\d{22})/i);
      const cvuMatch = textoLimpio.match(/cvu[:\s]*(\d{22})/i);
      const montoMatch = textoLimpio.match(/\$?\s*([\d.,]+)/);

      if (aliasMatch || cbuMatch || cvuMatch) {
        setPagoEscaneado({
          tipo: "texto",
          alias: aliasMatch?.[1] || "",
          cbu: cbuMatch?.[1] || "",
          cvu: cvuMatch?.[1] || "",
          monto: montoMatch
            ? parseFloat(montoMatch[1].replace(",", "."))
            : null,
          contenido: textoLimpio,
        });
      } else {
        setPagoEscaneado({
          tipo: "desconocido",
          contenido: textoLimpio,
        });
      }
    }
  };

  // Copiar datos del pago escaneado
  const copiarDatosPago = async () => {
    if (!pagoEscaneado) return;

    let texto = "";
    if (pagoEscaneado.tipo === "app") {
      texto = `Pago a: ${pagoEscaneado.destinatario}\n`;
      texto += `Monto: $${pagoEscaneado.monto.toLocaleString("es-AR")}\n`;
      if (pagoEscaneado.alias) texto += `Alias: ${pagoEscaneado.alias}\n`;
      if (pagoEscaneado.cbu) texto += `CBU: ${pagoEscaneado.cbu}\n`;
      if (pagoEscaneado.cvu) texto += `CVU: ${pagoEscaneado.cvu}\n`;
    } else if (pagoEscaneado.alias || pagoEscaneado.cbu || pagoEscaneado.cvu) {
      if (pagoEscaneado.alias) texto += `Alias: ${pagoEscaneado.alias}\n`;
      if (pagoEscaneado.cbu) texto += `CBU: ${pagoEscaneado.cbu}\n`;
      if (pagoEscaneado.cvu) texto += `CVU: ${pagoEscaneado.cvu}\n`;
    } else {
      texto = pagoEscaneado.contenido;
    }

    await navigator.clipboard.writeText(texto.trim());
    Swal.fire({
      icon: "success",
      title: "Copiado",
      text: "Datos copiados al portapapeles",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const colorClasses = {
    orange: {
      bg: "bg-orange-500",
      bgLight: "bg-orange-100",
      bgHover: "hover:bg-orange-600",
      text: "text-orange-700",
      border: "border-orange-500",
      ring: "focus:ring-orange-500",
      tab: "bg-orange-500 text-white",
      tabInactive: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    },
    green: {
      bg: "bg-green-500",
      bgLight: "bg-green-100",
      bgHover: "hover:bg-green-600",
      text: "text-green-700",
      border: "border-green-500",
      ring: "focus:ring-green-500",
      tab: "bg-green-500 text-white",
      tabInactive: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    },
    blue: {
      bg: "bg-blue-500",
      bgLight: "bg-blue-100",
      bgHover: "hover:bg-blue-600",
      text: "text-blue-700",
      border: "border-blue-500",
      ring: "focus:ring-blue-500",
      tab: "bg-blue-500 text-white",
      tabInactive: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    },
  };

  const colors = colorClasses[colorPrimario] || colorClasses.orange;

  return (
    <div className="space-y-4">
      {/* Pestañas de navegación */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => {
            setModoActivo("datos");
            detenerEscaner();
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            modoActivo === "datos" ? colors.tab : colors.tabInactive
          }`}
        >
          💳 Mis Datos
        </button>
        <button
          onClick={() => {
            setModoActivo("cobrar");
            detenerEscaner();
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            modoActivo === "cobrar" ? colors.tab : colors.tabInactive
          }`}
        >
          📥 Cobrar
        </button>
        <button
          onClick={() => {
            setModoActivo("pagar");
            setMostrarQR(false);
          }}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            modoActivo === "pagar" ? colors.tab : colors.tabInactive
          }`}
        >
          📤 Pagar
        </button>
      </div>

      {/* ==================== SECCIÓN: MIS DATOS ==================== */}
      {modoActivo === "datos" && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                💳 Datos de Pago
              </h2>
              <p className="text-sm text-gray-500">
                Configura tu alias, CBU o CVU
              </p>
            </div>
            <button
              onClick={() => setEditando(!editando)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                editando
                  ? "bg-gray-200 text-gray-700"
                  : `${colors.bg} text-white ${colors.bgHover}`
              }`}
            >
              {editando ? "Cancelar" : "✏️ Editar"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alias */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alias Bancario
              </label>
              {editando ? (
                <input
                  type="text"
                  value={formDatosPago.aliasBancario}
                  onChange={(e) =>
                    setFormDatosPago({
                      ...formDatosPago,
                      aliasBancario: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Ej: JUAN.PEREZ.MP"
                  className="input-field w-full uppercase"
                  maxLength={20}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg font-mono">
                  {formDatosPago.aliasBancario || (
                    <span className="text-gray-400">No configurado</span>
                  )}
                </p>
              )}
              {editando && (
                <p className="text-xs text-gray-500 mt-1">
                  6-20 caracteres, letras, números y puntos
                </p>
              )}
            </div>

            {/* Banco */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banco / Billetera
              </label>
              {editando ? (
                <select
                  value={formDatosPago.banco}
                  onChange={(e) =>
                    setFormDatosPago({
                      ...formDatosPago,
                      banco: e.target.value,
                    })
                  }
                  className="input-field w-full"
                >
                  <option value="">Seleccionar...</option>
                  {bancos.map((banco) => (
                    <option key={banco} value={banco}>
                      {banco}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg">
                  {formDatosPago.banco || (
                    <span className="text-gray-400">No configurado</span>
                  )}
                </p>
              )}
            </div>

            {/* CBU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CBU
              </label>
              {editando ? (
                <input
                  type="text"
                  value={formDatosPago.cbu}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 22);
                    setFormDatosPago({ ...formDatosPago, cbu: value });
                  }}
                  placeholder="22 dígitos"
                  className="input-field w-full font-mono"
                  maxLength={22}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  {formDatosPago.cbu || (
                    <span className="text-gray-400">No configurado</span>
                  )}
                </p>
              )}
              {editando && formDatosPago.cbu && (
                <p
                  className={`text-xs mt-1 ${formDatosPago.cbu.length === 22 ? "text-green-600" : "text-yellow-600"}`}
                >
                  {formDatosPago.cbu.length}/22 dígitos
                </p>
              )}
            </div>

            {/* CVU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVU
              </label>
              {editando ? (
                <input
                  type="text"
                  value={formDatosPago.cvu}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 22);
                    setFormDatosPago({ ...formDatosPago, cvu: value });
                  }}
                  placeholder="22 dígitos (billeteras virtuales)"
                  className="input-field w-full font-mono"
                  maxLength={22}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  {formDatosPago.cvu || (
                    <span className="text-gray-400">No configurado</span>
                  )}
                </p>
              )}
              {editando && formDatosPago.cvu && (
                <p
                  className={`text-xs mt-1 ${formDatosPago.cvu.length === 22 ? "text-green-600" : "text-yellow-600"}`}
                >
                  {formDatosPago.cvu.length}/22 dígitos
                </p>
              )}
            </div>

            {/* Titular */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titular de la Cuenta
              </label>
              {editando ? (
                <input
                  type="text"
                  value={formDatosPago.titularCuenta}
                  onChange={(e) =>
                    setFormDatosPago({
                      ...formDatosPago,
                      titularCuenta: e.target.value,
                    })
                  }
                  placeholder="Nombre como figura en la cuenta"
                  className="input-field w-full"
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-lg">
                  {formDatosPago.titularCuenta || (
                    <span className="text-gray-400">No configurado</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {editando && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditando(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarDatosPago}
                className={`px-6 py-2 ${colors.bg} text-white rounded-lg ${colors.bgHover}`}
              >
                💾 Guardar
              </button>
            </div>
          )}

          <div className={`mt-4 p-3 ${colors.bgLight} rounded-lg`}>
            <p className={`text-sm ${colors.text}`}>
              🔒 Tus datos bancarios se almacenan de forma segura y solo se
              comparten cuando generas un QR de cobro.
            </p>
          </div>
        </div>
      )}

      {/* ==================== SECCIÓN: COBRAR ==================== */}
      {modoActivo === "cobrar" && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            📥 Generar QR de Cobro
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Crea un código QR para que te paguen
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formulario */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💰 Monto (ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                    $
                  </span>
                  <input
                    type="number"
                    value={montoQR}
                    onChange={(e) => setMontoQR(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="input-field w-full pl-8 text-2xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📝 Concepto
                </label>
                <input
                  type="text"
                  value={conceptoQR}
                  onChange={(e) => setConceptoQR(e.target.value)}
                  placeholder="Ej: Servicio de flete"
                  className="input-field w-full"
                  maxLength={50}
                />
              </div>

              {montoQR && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Resumen:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto:</span>
                      <span className="font-bold text-green-600">
                        $
                        {parseFloat(montoQR || 0).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Concepto:</span>
                      <span>{conceptoQR || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Destinatario:</span>
                      <span>
                        {formDatosPago.titularCuenta || usuario?.nombre}
                      </span>
                    </div>
                    {formDatosPago.aliasBancario && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Alias:</span>
                        <span className="font-mono">
                          {formDatosPago.aliasBancario}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={generarQR}
                disabled={!montoQR || parseFloat(montoQR) <= 0}
                className={`w-full py-3 ${colors.bg} text-white rounded-lg ${colors.bgHover} font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                🔄 Generar Código QR
              </button>
            </div>

            {/* Vista previa QR */}
            <div className="flex flex-col items-center justify-center">
              {mostrarQR && qrDataURL ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-lg">
                    <Image
                      src={qrDataURL}
                      alt="QR de cobro"
                      width={256}
                      height={256}
                      className="mx-auto"
                      unoptimized
                    />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    $
                    {parseFloat(montoQR).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-gray-600">{conceptoQR}</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={descargarQR}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
                    >
                      ⬇️ Descargar
                    </button>
                    <button
                      onClick={compartirQR}
                      className={`px-4 py-2 ${colors.bg} text-white rounded-lg ${colors.bgHover} font-medium`}
                    >
                      📤 Compartir
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-xl">
                  <span className="text-6xl">📱</span>
                  <p className="mt-4 text-gray-500">
                    Ingresa un monto y genera el QR
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SECCIÓN: PAGAR ==================== */}
      {modoActivo === "pagar" && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            📤 Escanear QR para Pagar
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Escanea el código QR del cobro para ver los datos de pago
          </p>

          {!escaneando && !pagoEscaneado && (
            <div className="text-center py-8">
              <button
                onClick={iniciarEscaner}
                className={`px-8 py-4 ${colors.bg} text-white rounded-xl ${colors.bgHover} font-medium text-lg`}
              >
                📷 Abrir Cámara
              </button>
              <p className="mt-4 text-gray-500 text-sm">
                Apunta la cámara al código QR de cobro
              </p>
            </div>
          )}

          {errorCamara && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
              ⚠️ {errorCamara}
            </div>
          )}

          {escaneando && (
            <div className="space-y-4">
              <div
                id="qr-reader-pago"
                className="w-full max-w-md mx-auto rounded-lg overflow-hidden"
              ></div>
              <div className="text-center">
                <button
                  onClick={detenerEscaner}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}

          {pagoEscaneado && (
            <div className="space-y-4">
              {pagoEscaneado.tipo === "app" && (
                <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="text-center mb-4">
                    <span className="text-4xl">✅</span>
                    <h3 className="text-xl font-bold text-green-700 mt-2">
                      QR de Cobro Detectado
                    </h3>
                  </div>

                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-gray-600">💰 Monto:</span>
                      <span className="text-2xl font-bold text-green-600">
                        $
                        {pagoEscaneado.monto.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-gray-600">👤 Destinatario:</span>
                      <span className="font-medium">
                        {pagoEscaneado.destinatario}
                      </span>
                    </div>
                    {pagoEscaneado.concepto && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">📝 Concepto:</span>
                        <span>{pagoEscaneado.concepto}</span>
                      </div>
                    )}
                    {pagoEscaneado.alias && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">🏦 Alias:</span>
                        <span className="font-mono font-medium">
                          {pagoEscaneado.alias}
                        </span>
                      </div>
                    )}
                    {pagoEscaneado.cbu && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">🏦 CBU:</span>
                        <span className="font-mono text-sm">
                          {pagoEscaneado.cbu}
                        </span>
                      </div>
                    )}
                    {pagoEscaneado.cvu && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">🏦 CVU:</span>
                        <span className="font-mono text-sm">
                          {pagoEscaneado.cvu}
                        </span>
                      </div>
                    )}
                    {pagoEscaneado.banco && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">🏛️ Banco:</span>
                        <span>{pagoEscaneado.banco}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={copiarDatosPago}
                      className={`flex-1 py-3 ${colors.bg} text-white rounded-lg ${colors.bgHover} font-medium`}
                    >
                      📋 Copiar Datos de Pago
                    </button>
                    <button
                      onClick={() => setPagoEscaneado(null)}
                      className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                    >
                      🔄 Escanear Otro
                    </button>
                  </div>
                </div>
              )}

              {pagoEscaneado.tipo === "texto" && (
                <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <div className="text-center mb-4">
                    <span className="text-4xl">⚠️</span>
                    <h3 className="text-xl font-bold text-yellow-700 mt-2">
                      Datos de Pago Detectados
                    </h3>
                  </div>

                  <div className="space-y-3 text-gray-700">
                    {pagoEscaneado.monto && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">💰 Monto:</span>
                        <span className="text-xl font-bold">
                          ${pagoEscaneado.monto.toLocaleString("es-AR")}
                        </span>
                      </div>
                    )}
                    {pagoEscaneado.alias && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">🏦 Alias:</span>
                        <span className="font-mono font-medium">
                          {pagoEscaneado.alias}
                        </span>
                      </div>
                    )}
                    {pagoEscaneado.cbu && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">🏦 CBU:</span>
                        <span className="font-mono text-sm">
                          {pagoEscaneado.cbu}
                        </span>
                      </div>
                    )}
                    {pagoEscaneado.cvu && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-600">🏦 CVU:</span>
                        <span className="font-mono text-sm">
                          {pagoEscaneado.cvu}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={copiarDatosPago}
                      className={`flex-1 py-3 ${colors.bg} text-white rounded-lg ${colors.bgHover} font-medium`}
                    >
                      📋 Copiar Datos
                    </button>
                    <button
                      onClick={() => setPagoEscaneado(null)}
                      className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                    >
                      🔄 Escanear Otro
                    </button>
                  </div>
                </div>
              )}

              {(pagoEscaneado.tipo === "otro" ||
                pagoEscaneado.tipo === "desconocido") && (
                <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
                  <div className="text-center mb-4">
                    <span className="text-4xl">📄</span>
                    <h3 className="text-xl font-bold text-gray-700 mt-2">
                      Contenido del QR
                    </h3>
                  </div>

                  <div className="p-4 bg-white rounded-lg border">
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap break-all">
                      {pagoEscaneado.contenido}
                    </pre>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={copiarDatosPago}
                      className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                    >
                      📋 Copiar Contenido
                    </button>
                    <button
                      onClick={() => setPagoEscaneado(null)}
                      className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                    >
                      🔄 Escanear Otro
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
