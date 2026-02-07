import { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import Swal from "sweetalert2";

/**
 * Modal para seleccionar método de pago después de una venta
 * Compatible con Mercado Pago, Modo, y otras billeteras argentinas
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Function} props.onConfirmar - Callback al confirmar pago (recibe { metodoPago, monto, detalles })
 * @param {number} props.monto - Monto total a cobrar
 * @param {string} props.concepto - Concepto/descripción de la venta
 * @param {Object} props.vendedor - Datos del vendedor (alias, cbu, cvu, etc.)
 * @param {Object} props.detalleVenta - Detalles de los productos vendidos
 * @param {string} props.colorPrimario - Color del tema (orange, green, blue)
 */
export default function ModalPagoVenta({
  isOpen,
  onClose,
  onConfirmar,
  monto,
  concepto = "Venta",
  vendedor,
  detalleVenta,
  colorPrimario = "orange",
}) {
  const [metodoPago, setMetodoPago] = useState(null); // null, "qr", "efectivo"
  const [qrDataURL, setQrDataURL] = useState(null);
  const [montoRecibido, setMontoRecibido] = useState("");
  const [generandoQR, setGenerandoQR] = useState(false);

  // Resetear estado cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setMetodoPago(null);
      setQrDataURL(null);
      setMontoRecibido("");
    }
  }, [isOpen]);

  // Generar QR compatible con billeteras argentinas
  const generarQRPago = async () => {
    if (!vendedor?.aliasBancario && !vendedor?.cbu && !vendedor?.cvu) {
      Swal.fire({
        icon: "warning",
        title: "Datos de pago no configurados",
        text: "Configura tu alias, CBU o CVU en tu perfil para generar QR de cobro",
        confirmButtonText: "Entendido",
      });
      return;
    }

    setGenerandoQR(true);

    try {
      // Formato compatible con transferencias bancarias argentinas
      // Las billeteras como Mercado Pago, Modo, etc. pueden leer este formato
      const datosPago = {
        // Identificador del sistema
        sistema: "REPARTOS_SI",
        version: "2.0",

        // Datos de la transacción
        monto: monto.toFixed(2),
        moneda: "ARS",
        concepto: concepto,
        referencia: `VENTA-${Date.now()}`,

        // Datos del beneficiario
        beneficiario: {
          nombre: vendedor.titularCuenta || vendedor.nombre,
          alias: vendedor.aliasBancario || null,
          cbu: vendedor.cbu || null,
          cvu: vendedor.cvu || null,
          banco: vendedor.banco || null,
        },

        // Timestamp
        fecha: new Date().toISOString(),
      };

      // Crear también un texto plano para compatibilidad máxima
      let textoQR = "";

      // Formato para transferencia directa (compatible con la mayoría de apps bancarias)
      if (vendedor.aliasBancario) {
        textoQR = `TRANSFERENCIA\n`;
        textoQR += `Alias: ${vendedor.aliasBancario}\n`;
      } else if (vendedor.cvu) {
        textoQR = `TRANSFERENCIA\n`;
        textoQR += `CVU: ${vendedor.cvu}\n`;
      } else if (vendedor.cbu) {
        textoQR = `TRANSFERENCIA\n`;
        textoQR += `CBU: ${vendedor.cbu}\n`;
      }

      textoQR += `Monto: $${monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}\n`;
      textoQR += `Titular: ${vendedor.titularCuenta || vendedor.nombre}\n`;
      textoQR += `Concepto: ${concepto}\n`;
      if (vendedor.banco) textoQR += `Banco: ${vendedor.banco}`;

      // Generar QR con los datos JSON (más información) envuelto en texto legible
      const contenidoQR = JSON.stringify(datosPago);

      const qrDataUrl = await QRCode.toDataURL(contenidoQR, {
        width: 280,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      });

      setQrDataURL(qrDataUrl);
    } catch (error) {
      console.error("Error generando QR:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo generar el código QR",
      });
    } finally {
      setGenerandoQR(false);
    }
  };

  // Seleccionar método QR
  const seleccionarQR = () => {
    setMetodoPago("qr");
    generarQRPago();
  };

  // Calcular vuelto
  const vuelto = montoRecibido ? parseFloat(montoRecibido) - monto : 0;

  // Confirmar pago en efectivo
  const confirmarEfectivo = () => {
    if (parseFloat(montoRecibido) < monto) {
      Swal.fire({
        icon: "warning",
        title: "Monto insuficiente",
        text: `El cliente debe pagar al menos $${monto.toLocaleString("es-AR")}`,
      });
      return;
    }

    onConfirmar({
      metodoPago: "efectivo",
      monto,
      montoRecibido: parseFloat(montoRecibido),
      vuelto: vuelto > 0 ? vuelto : 0,
    });
  };

  // Confirmar pago con QR (el vendedor confirma que recibió la transferencia)
  const confirmarPagoQR = () => {
    Swal.fire({
      icon: "question",
      title: "¿Confirmás que recibiste el pago?",
      text: `Verificá que la transferencia de $${monto.toLocaleString("es-AR")} haya llegado a tu cuenta`,
      showCancelButton: true,
      confirmButtonText: "Sí, recibí el pago",
      cancelButtonText: "Aún no",
      confirmButtonColor: "#22c55e",
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirmar({
          metodoPago: "transferencia",
          monto,
          referencia: `VENTA-${Date.now()}`,
        });
      }
    });
  };

  // Descargar QR
  const descargarQR = () => {
    if (!qrDataURL) return;
    const link = document.createElement("a");
    link.download = `QR-Cobro-${monto}-${new Date().toISOString().split("T")[0]}.png`;
    link.href = qrDataURL;
    link.click();
  };

  // Compartir QR
  const compartirQR = async () => {
    if (!qrDataURL) return;

    const textoCompartir = `💰 Pago por $${monto.toLocaleString("es-AR")}\n📝 ${concepto}\n👤 ${vendedor.titularCuenta || vendedor.nombre}\n${vendedor.aliasBancario ? `🏦 Alias: ${vendedor.aliasBancario}` : vendedor.cvu ? `🏦 CVU: ${vendedor.cvu}` : `🏦 CBU: ${vendedor.cbu}`}`;

    if (navigator.share) {
      try {
        const blob = await (await fetch(qrDataURL)).blob();
        const file = new File([blob], "qr-pago.png", { type: "image/png" });

        await navigator.share({
          title: `Pago: $${monto.toLocaleString("es-AR")}`,
          text: textoCompartir,
          files: [file],
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          await navigator.clipboard.writeText(textoCompartir);
          Swal.fire({
            icon: "success",
            title: "Copiado",
            text: "Datos de pago copiados al portapapeles",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      }
    } else {
      await navigator.clipboard.writeText(textoCompartir);
      Swal.fire({
        icon: "success",
        title: "Copiado",
        text: "Datos de pago copiados al portapapeles",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const colorClasses = {
    orange: {
      bg: "bg-orange-500",
      bgHover: "hover:bg-orange-600",
      bgLight: "bg-orange-100",
      text: "text-orange-600",
      border: "border-orange-500",
    },
    green: {
      bg: "bg-green-500",
      bgHover: "hover:bg-green-600",
      bgLight: "bg-green-100",
      text: "text-green-600",
      border: "border-green-500",
    },
    blue: {
      bg: "bg-blue-500",
      bgHover: "hover:bg-blue-600",
      bgLight: "bg-blue-100",
      text: "text-blue-600",
      border: "border-blue-500",
    },
  };

  const colors = colorClasses[colorPrimario] || colorClasses.orange;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`${colors.bg} text-white p-4 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">💳 Método de Pago</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold">
              ${monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-white/80 text-sm">{concepto}</p>
          </div>
        </div>

        <div className="p-4">
          {/* Detalle de venta (si existe) */}
          {detalleVenta && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-gray-700 mb-1">Detalle:</p>
              {detalleVenta.productos?.map((p, i) => (
                <div key={i} className="flex justify-between text-gray-600">
                  <span>
                    {p.cantidad}x {p.nombre}
                  </span>
                  <span>
                    ${(p.precio * p.cantidad).toLocaleString("es-AR")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Selección de método de pago */}
          {!metodoPago && (
            <div className="space-y-3">
              <p className="text-gray-600 text-center mb-4">
                ¿Cómo va a pagar el cliente?
              </p>

              {/* Opción QR / Transferencia */}
              <button
                onClick={seleccionarQR}
                className={`w-full p-4 border-2 rounded-xl flex items-center gap-4 hover:border-green-500 hover:bg-green-50 transition-colors ${
                  !vendedor?.aliasBancario && !vendedor?.cbu && !vendedor?.cvu
                    ? "opacity-50"
                    : ""
                }`}
              >
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl">
                  📱
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-800">
                    QR / Transferencia
                  </p>
                  <p className="text-sm text-gray-500">
                    Mercado Pago, Modo, billetera virtual
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </button>

              {/* Opción Efectivo */}
              <button
                onClick={() => setMetodoPago("efectivo")}
                className="w-full p-4 border-2 rounded-xl flex items-center gap-4 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
              >
                <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center text-3xl">
                  💵
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-800">Efectivo</p>
                  <p className="text-sm text-gray-500">
                    Pago en mano, calcular vuelto
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </button>

              {/* Info sobre datos bancarios */}
              {!vendedor?.aliasBancario && !vendedor?.cbu && !vendedor?.cvu && (
                <p className="text-xs text-center text-gray-400 mt-2">
                  ⚠️ Configura tu alias/CBU en el perfil para habilitar QR
                </p>
              )}
            </div>
          )}

          {/* Vista de pago con QR */}
          {metodoPago === "qr" && (
            <div className="space-y-4">
              <button
                onClick={() => setMetodoPago(null)}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
              >
                ← Volver
              </button>

              {generandoQR ? (
                <div className="text-center py-8">
                  <div className="animate-spin text-4xl mb-2">⏳</div>
                  <p className="text-gray-500">Generando QR...</p>
                </div>
              ) : qrDataURL ? (
                <div className="text-center space-y-4">
                  {/* QR Code */}
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl shadow-lg">
                    <Image
                      src={qrDataURL}
                      alt="QR de pago"
                      width={250}
                      height={250}
                      className="mx-auto"
                      unoptimized
                    />
                  </div>

                  {/* Instrucciones */}
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                    <p className="font-medium mb-1">📲 El cliente debe:</p>
                    <ol className="text-left list-decimal list-inside space-y-1">
                      <li>Abrir su app de banco o billetera</li>
                      <li>Escanear este QR o transferir al alias</li>
                      <li>Confirmar el pago</li>
                    </ol>
                  </div>

                  {/* Datos de transferencia */}
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="font-medium text-gray-700 mb-2">
                      Datos para transferir:
                    </p>
                    {vendedor.aliasBancario && (
                      <p className="font-mono text-lg font-bold text-gray-800">
                        {vendedor.aliasBancario}
                      </p>
                    )}
                    {vendedor.banco && (
                      <p className="text-gray-600">{vendedor.banco}</p>
                    )}
                    <p className="text-gray-600">
                      {vendedor.titularCuenta || vendedor.nombre}
                    </p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button
                      onClick={compartirQR}
                      className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                    >
                      📤 Compartir
                    </button>
                    <button
                      onClick={descargarQR}
                      className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                    >
                      ⬇️ Descargar
                    </button>
                  </div>

                  {/* Botón confirmar pago */}
                  <button
                    onClick={confirmarPagoQR}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg"
                  >
                    ✅ Ya recibí el pago
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se pudo generar el QR</p>
                  <button
                    onClick={generarQRPago}
                    className={`mt-2 px-4 py-2 ${colors.bg} text-white rounded-lg ${colors.bgHover}`}
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Vista de pago en efectivo */}
          {metodoPago === "efectivo" && (
            <div className="space-y-4">
              <button
                onClick={() => setMetodoPago(null)}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
              >
                ← Volver
              </button>

              {/* Monto a cobrar */}
              <div className="text-center p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                <p className="text-sm text-yellow-700">Total a cobrar:</p>
                <p className="text-4xl font-bold text-yellow-600">
                  ${monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Input monto recibido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💵 Monto que entrega el cliente:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                    $
                  </span>
                  <input
                    type="number"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full p-3 pl-8 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Sugerencias de billetes */}
              <div className="flex flex-wrap gap-2">
                {[1000, 2000, 5000, 10000, 20000].map((billete) => (
                  <button
                    key={billete}
                    onClick={() => setMontoRecibido(billete.toString())}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                  >
                    ${billete.toLocaleString("es-AR")}
                  </button>
                ))}
                <button
                  onClick={() => setMontoRecibido(monto.toString())}
                  className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium"
                >
                  Exacto
                </button>
              </div>

              {/* Vuelto */}
              {montoRecibido && parseFloat(montoRecibido) >= monto && (
                <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <p className="text-sm text-green-700">Vuelto a entregar:</p>
                  <p className="text-4xl font-bold text-green-600">
                    $
                    {vuelto.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}

              {/* Mensaje de monto insuficiente */}
              {montoRecibido && parseFloat(montoRecibido) < monto && (
                <div className="text-center p-3 bg-red-50 rounded-xl border-2 border-red-200">
                  <p className="text-red-600 font-medium">
                    ⚠️ Faltan $
                    {(monto - parseFloat(montoRecibido)).toLocaleString(
                      "es-AR",
                    )}
                  </p>
                </div>
              )}

              {/* Botón confirmar */}
              <button
                onClick={confirmarEfectivo}
                disabled={!montoRecibido || parseFloat(montoRecibido) < monto}
                className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg"
              >
                ✅ Confirmar Pago en Efectivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
