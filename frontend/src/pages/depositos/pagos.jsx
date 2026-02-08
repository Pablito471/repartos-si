import { useState, useEffect } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";

/**
 * Página de Pagos QR para Depósito
 * Genera un QR estático con el alias de Mercado Pago para pegar en el mostrador
 */
export default function DepositoPagos() {
    const { usuario, actualizarPerfil } = useAuth();
    const [qrMostrador, setQrMostrador] = useState(null);
    const [editandoAlias, setEditandoAlias] = useState(false);
    const [alias, setAlias] = useState(usuario?.aliasBancario || "");
    const [banco, setBanco] = useState(usuario?.banco || "Mercado Pago");
    const [titular, setTitular] = useState(usuario?.titularCuenta || usuario?.nombre || "");

    // Generar QR automáticamente cuando hay alias
    useEffect(() => {
        if (usuario?.aliasBancario) {
            generarQRMostrador(usuario.aliasBancario);
        }
    }, [usuario?.aliasBancario]);

    const generarQRMostrador = async (aliasValue) => {
        if (!aliasValue) return;

        // Crear texto simple con el alias para el QR
        const textoQR = aliasValue.toUpperCase();

        try {
            const qrDataUrl = await QRCode.toDataURL(textoQR, {
                width: 400,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#FFFFFF",
                },
                errorCorrectionLevel: "H",
            });
            setQrMostrador(qrDataUrl);
        } catch (error) {
            console.error("Error generando QR:", error);
        }
    };

    const guardarAlias = async () => {
        if (!alias || alias.length < 6) {
            Swal.fire({
                icon: "warning",
                title: "Alias inválido",
                text: "El alias debe tener al menos 6 caracteres",
            });
            return;
        }

        try {
            await actualizarPerfil({
                aliasBancario: alias.toUpperCase(),
                banco: banco,
                titularCuenta: titular,
            });

            await generarQRMostrador(alias);
            setEditandoAlias(false);

            Swal.fire({
                icon: "success",
                title: "¡Listo!",
                text: "Tu alias de pago ha sido guardado",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo guardar el alias",
            });
        }
    };

    const descargarQR = () => {
        if (!qrMostrador) return;
        const link = document.createElement("a");
        link.download = `QR-Pago-${alias || "mercadopago"}.png`;
        link.href = qrMostrador;
        link.click();
    };

    const imprimirQR = () => {
        if (!qrMostrador) return;
        const ventana = window.open("", "_blank");
        ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR de Pago - ${usuario?.nombre || "Depósito"}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              padding: 20px;
            }
            img {
              max-width: 300px;
              margin: 20px 0;
            }
            .titulo {
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            .alias {
              font-size: 20px;
              color: #009EE3;
              font-weight: bold;
              margin-top: 10px;
            }
            .instrucciones {
              font-size: 14px;
              color: #666;
              margin-top: 15px;
            }
            .logo {
              font-size: 40px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">💳</div>
            <div class="titulo">Pagá con QR</div>
            <img src="${qrMostrador}" alt="QR de Pago"/>
            <div class="alias">${alias?.toUpperCase() || ""}</div>
            <div class="instrucciones">
              Escaneá con Mercado Pago, Modo o tu billetera
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
        ventana.document.close();
    };

    return (
        <DepositoLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">💳 Pagos QR</h1>
                    <p className="text-gray-600">
                        Generá tu QR para pegar en el mostrador
                    </p>
                </div>

                {/* QR Principal para Mostrador */}
                <div className="card">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Lado izquierdo - Configuración */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    📱 QR para el Mostrador
                                </h2>
                                <button
                                    onClick={() => setEditandoAlias(!editandoAlias)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${editandoAlias
                                            ? "bg-gray-200 text-gray-700"
                                            : "bg-orange-500 text-white hover:bg-orange-600"
                                        }`}
                                >
                                    {editandoAlias ? "Cancelar" : "✏️ Configurar"}
                                </button>
                            </div>

                            {editandoAlias ? (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Alias de Mercado Pago
                                        </label>
                                        <input
                                            type="text"
                                            value={alias}
                                            onChange={(e) => setAlias(e.target.value.toUpperCase())}
                                            placeholder="Ej: MITIENDA.MP"
                                            className="input-field w-full uppercase text-lg font-mono"
                                            maxLength={20}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Este es el alias que usarás para recibir pagos
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Billetera / Banco
                                        </label>
                                        <select
                                            value={banco}
                                            onChange={(e) => setBanco(e.target.value)}
                                            className="input-field w-full"
                                        >
                                            <option value="Mercado Pago">Mercado Pago</option>
                                            <option value="Ualá">Ualá</option>
                                            <option value="Naranja X">Naranja X</option>
                                            <option value="Banco Nación">Banco Nación</option>
                                            <option value="Banco Provincia">Banco Provincia</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Titular de la Cuenta
                                        </label>
                                        <input
                                            type="text"
                                            value={titular}
                                            onChange={(e) => setTitular(e.target.value)}
                                            placeholder="Nombre del titular"
                                            className="input-field w-full"
                                        />
                                    </div>

                                    <button
                                        onClick={guardarAlias}
                                        className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                                    >
                                        💾 Guardar y Generar QR
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-3xl">🏦</span>
                                            <div>
                                                <p className="text-sm text-gray-500">{banco || "Mercado Pago"}</p>
                                                <p className="text-xl font-bold text-blue-600 font-mono">
                                                    {usuario?.aliasBancario || alias || "Sin configurar"}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {titular || usuario?.nombre}
                                        </p>
                                    </div>

                                    {!usuario?.aliasBancario && !alias && (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                            <p className="text-yellow-700 text-sm">
                                                ⚠️ Configurá tu alias para generar el QR del mostrador
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Lado derecho - QR */}
                        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl min-w-[300px]">
                            {qrMostrador ? (
                                <>
                                    <div className="bg-white p-4 rounded-xl shadow-lg">
                                        <Image
                                            src={qrMostrador}
                                            alt="QR de Pago"
                                            width={250}
                                            height={250}
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <p className="mt-4 text-lg font-bold text-gray-700">
                                        {usuario?.aliasBancario || alias}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Escaneá con cualquier billetera
                                    </p>

                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={descargarQR}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                                        >
                                            📥 Descargar
                                        </button>
                                        <button
                                            onClick={imprimirQR}
                                            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                                        >
                                            🖨️ Imprimir
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <span className="text-6xl block mb-4">📱</span>
                                    <p>Configurá tu alias para generar el QR</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Instrucciones */}
                <div className="card bg-gradient-to-r from-orange-50 to-yellow-50">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        📋 Cómo usar tu QR de Mostrador
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">1️⃣</span>
                            <div>
                                <p className="font-medium text-gray-700">Configurá tu alias</p>
                                <p className="text-sm text-gray-500">
                                    Ingresá el alias de tu cuenta de Mercado Pago
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">2️⃣</span>
                            <div>
                                <p className="font-medium text-gray-700">Imprimí el QR</p>
                                <p className="text-sm text-gray-500">
                                    Descargá e imprimí el código para tu mostrador
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">3️⃣</span>
                            <div>
                                <p className="font-medium text-gray-700">Recibí pagos</p>
                                <p className="text-sm text-gray-500">
                                    Tus clientes escanean y pagan al instante
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info sobre compatibilidad */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        ✅ Compatible con
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { nombre: "Mercado Pago", emoji: "💙" },
                            { nombre: "Modo", emoji: "💜" },
                            { nombre: "Ualá", emoji: "💚" },
                            { nombre: "Naranja X", emoji: "🧡" },
                            { nombre: "Personal Pay", emoji: "💛" },
                            { nombre: "BIMO", emoji: "🔵" },
                        ].map((app) => (
                            <span
                                key={app.nombre}
                                className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700"
                            >
                                {app.emoji} {app.nombre}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </DepositoLayout>
    );
}
