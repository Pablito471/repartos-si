import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import { useAuth } from "@/context/AuthContext";
import { formatNumber, formatDateTime } from "@/utils/formatters";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { showSuccessAlert, showConfirmAlert, showToast } from "@/utils/alerts";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import CalificarModal from "@/components/CalificarModal";
import {
  generarPDFEntrega,
  descargarPDF,
  abrirPDF,
} from "@/utils/pdfGenerator";
import Icons from "@/components/Icons";

export default function DetallePedido() {
  const router = useRouter();
  const { id } = router.query;
  const { pedidos, cambiarEstadoPedido, fletes, crearEnvio } = useDeposito();
  const { usuarios, getPromedioCalificaciones, getCalificacionesUsuario } =
    useAuth();

  const [pedido, setPedido] = useState(null);
  const [mostrarModalEnvio, setMostrarModalEnvio] = useState(false);
  const [mostrarModalCalificar, setMostrarModalCalificar] = useState(false);
  const [envioData, setEnvioData] = useState({
    vehiculo: "",
    conductor: "",
    fleteId: "",
    notas: "",
  });
  const [promedioCliente, setPromedioCliente] = useState(0);
  const [totalCalificacionesCliente, setTotalCalificacionesCliente] =
    useState(0);

  useEffect(() => {
    if (id) {
      const pedidoEncontrado = pedidos.find((p) => String(p.id) === String(id));
      setPedido(pedidoEncontrado);
    }
  }, [id, pedidos]);

  // Obtener usuario cliente
  const getUsuarioCliente = () => {
    if (!pedido?.clienteId) return null;
    return usuarios.find(
      (u) =>
        u.tipoUsuario === "cliente" &&
        (u.id === pedido.clienteId ||
          u.email === pedido.clienteId ||
          u.nombre === pedido.cliente),
    );
  };

  const usuarioCliente = pedido ? getUsuarioCliente() : null;

  // Cargar calificaciones del cliente
  useEffect(() => {
    const cargarCalificaciones = async () => {
      if (usuarioCliente?.id) {
        const [prom, cals] = await Promise.all([
          getPromedioCalificaciones(usuarioCliente.id),
          getCalificacionesUsuario(usuarioCliente.id),
        ]);
        setPromedioCliente(prom || 0);
        setTotalCalificacionesCliente(Array.isArray(cals) ? cals.length : 0);
      }
    };
    cargarCalificaciones();
  }, [usuarioCliente?.id, getPromedioCalificaciones, getCalificacionesUsuario]);

  if (!pedido) {
    return (
      <DepositoLayout>
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">🔍</span>
          <h2 className="text-xl font-semibold text-gray-700">
            Pedido no encontrado
          </h2>
          <Link href="/depositos/pedidos" className="btn-primary mt-4">
            Volver a pedidos
          </Link>
        </div>
      </DepositoLayout>
    );
  }

  const handleCambiarEstado = async (nuevoEstado, textoEstado) => {
    const confirmado = await showConfirmAlert(
      "Cambiar estado",
      `¿Marcar pedido #${pedido.id} como "${textoEstado}"?`,
    );

    if (confirmado) {
      try {
        await cambiarEstadoPedido(pedido.id, nuevoEstado);
        showToast("success", `Pedido actualizado a ${textoEstado}`);
      } catch (error) {
        showToast(
          "error",
          "Error al cambiar estado: " + (error.message || "Error desconocido"),
        );
      }
    }
  };

  const handleGenerarPDF = async () => {
    try {
      const baseUrl = window.location.origin;

      // Datos del cliente
      const cliente = usuarioCliente || {
        id: pedido.clienteId,
        nombre: pedido.cliente,
      };

      // Datos del depósito
      const depositoInfo = {
        nombre: pedido.deposito || "Depósito",
        direccion: "Dirección del depósito",
      };

      // Generar PDF
      const { pdf, codigoEntrega } = await generarPDFEntrega(
        pedido,
        cliente,
        depositoInfo,
        baseUrl,
      );

      // Guardar entrega pendiente en localStorage para que el cliente pueda confirmar
      const entregasPendientes = JSON.parse(
        localStorage.getItem("repartos_entregas_pendientes") || "[]",
      );

      // Verificar si ya existe una entrega para este pedido
      const existeEntrega = entregasPendientes.find(
        (e) => e.pedidoId === pedido.id && !e.confirmada,
      );

      if (!existeEntrega) {
        entregasPendientes.push({
          codigoEntrega,
          pedidoId: pedido.id,
          clienteId: cliente.id,
          productos: pedido.productos,
          total: pedido.total,
          deposito: pedido.deposito,
          fecha: new Date().toISOString(),
          confirmada: false,
        });

        localStorage.setItem(
          "repartos_entregas_pendientes",
          JSON.stringify(entregasPendientes),
        );
      }

      // Descargar PDF
      descargarPDF(pdf, `entrega-pedido-${pedido.id}.pdf`);

      showSuccessAlert(
        "PDF Generado",
        "El comprobante de entrega ha sido descargado. Entregue este documento al transportista.",
      );
    } catch (error) {
      console.error("Error generando PDF:", error);
      showToast("error", "Error al generar el PDF");
    }
  };

  // Handler para cuando se selecciona un flete - auto-completar vehículo y conductor
  const handleFleteChange = (fleteId) => {
    const fleteSeleccionado = fletes.find(
      (f) => String(f.id) === String(fleteId),
    );

    if (fleteSeleccionado) {
      // Construir string del vehículo con los datos del flete
      const vehiculoStr =
        [
          fleteSeleccionado.vehiculoTipo,
          fleteSeleccionado.vehiculoPatente,
          fleteSeleccionado.vehiculoCapacidad,
        ]
          .filter(Boolean)
          .join(" - ") || fleteSeleccionado.nombre;

      setEnvioData({
        ...envioData,
        fleteId: fleteId,
        vehiculo: vehiculoStr,
        conductor: fleteSeleccionado.nombre || "",
      });
    } else {
      setEnvioData({
        ...envioData,
        fleteId: fleteId,
        vehiculo: "",
        conductor: "",
      });
    }
  };

  const handleCrearEnvio = async (e) => {
    e.preventDefault();

    if (!envioData.vehiculo || !envioData.conductor) {
      showToast("error", "Completa los datos de vehículo y conductor");
      return;
    }

    // fleteId es opcional pero recomendado para notificaciones
    if (!envioData.fleteId && fletes.length > 0) {
      showToast(
        "warning",
        "Se recomienda asignar un flete para las notificaciones",
      );
    }

    const nuevoEnvio = {
      pedidoId: pedido.id,
      fleteId: envioData.fleteId || null, // Importante: asignar el flete
      cliente: pedido.cliente,
      tipo: pedido.tipoEnvio,
      vehiculo: envioData.vehiculo,
      conductor: envioData.conductor,
      direccion: pedido.direccion,
      fechaSalida: formatDateTime(new Date()),
      fechaEstimada: formatDateTime(new Date(Date.now() + 2 * 60 * 60 * 1000)),
      notas: envioData.notas,
    };

    try {
      // El backend requiere que el pedido esté en estado "listo" para crear el envío
      // Seguir las transiciones: pendiente→preparando→listo
      let estadoActual = pedido.estado;

      if (estadoActual === "pendiente") {
        await cambiarEstadoPedido(pedido.id, "preparando");
        estadoActual = "preparando";
      }
      if (estadoActual === "preparando") {
        await cambiarEstadoPedido(pedido.id, "listo");
        estadoActual = "listo";
      }

      // Crear el envío (el backend cambiará automáticamente el estado a "enviado")
      await crearEnvio(nuevoEnvio);

      setMostrarModalEnvio(false);
      showSuccessAlert("¡Envío creado!", "El pedido ha sido despachado");
    } catch (error) {
      showToast(
        "error",
        "Error al crear envío: " + (error.message || "Error desconocido"),
      );
    }
  };

  const tipoEnvioInfo = {
    envio: { icon: "🚚", texto: "Envío a domicilio" },
    flete: { icon: "🚛", texto: "Flete" },
    retiro: { icon: "🏭", texto: "Retiro en depósito" },
  };

  const prioridadInfo = {
    alta: { color: "bg-red-500", texto: "Alta", colorText: "text-red-600" },
    media: {
      color: "bg-yellow-500",
      texto: "Media",
      colorText: "text-yellow-600",
    },
    baja: { color: "bg-green-500", texto: "Baja", colorText: "text-green-600" },
  };

  return (
    <DepositoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Link
                href="/depositos/pedidos"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Volver
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">
              Pedido #{pedido.id}
            </h1>
            <p className="text-gray-600">{pedido.cliente}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <EstadoBadgeLarge estado={pedido.estado} />
          </div>
        </div>

        {/* Main Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Client Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <span>👤</span>
              <span>Cliente</span>
            </h3>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-800">
                {pedido.cliente}
              </p>
              <p className="text-gray-500">{pedido.clienteId}</p>

              {/* Calificación del cliente */}
              {usuarioCliente && (
                <div className="pt-2 mt-2 border-t">
                  <div className="flex items-center gap-2">
                    <StarRating rating={promedioCliente} size="sm" />
                    <span className="text-sm text-gray-500">
                      ({totalCalificacionesCliente})
                    </span>
                  </div>
                  <button
                    onClick={() => setMostrarModalCalificar(true)}
                    className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    ⭐ Calificar cliente
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <span>📍</span>
              <span>Entrega</span>
            </h3>
            <div className="space-y-2">
              <p className="text-gray-800">{pedido.direccion}</p>
              <p className="text-gray-500 flex items-center space-x-1">
                <span>{tipoEnvioInfo[pedido.tipoEnvio].icon}</span>
                <span>{tipoEnvioInfo[pedido.tipoEnvio].texto}</span>
              </p>
            </div>
          </div>

          {/* Order Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <span>📋</span>
              <span>Información</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha:</span>
                <span className="text-gray-800">{pedido.fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Prioridad:</span>
                <span
                  className={`font-medium ${prioridadInfo[pedido.prioridad].colorText}`}
                >
                  {prioridadInfo[pedido.prioridad].texto}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total:</span>
                <span className="text-lg font-bold text-primary">
                  ${formatNumber(pedido.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <span>📦</span>
            <span>Productos del Pedido</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b">
                  <th className="pb-3">Producto</th>
                  <th className="pb-3 text-center">Cantidad</th>
                  <th className="pb-3 text-right">Precio Unit.</th>
                  <th className="pb-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.productos.map((prod, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-4 font-medium text-gray-800">
                      {prod.nombre}
                    </td>
                    <td className="py-4 text-center">{prod.cantidad}</td>
                    <td className="py-4 text-right">${prod.precio}</td>
                    <td className="py-4 text-right font-medium">
                      ${formatNumber(prod.cantidad * prod.precio)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="py-4 font-semibold">
                    Total del Pedido
                  </td>
                  <td className="py-4 text-right text-xl font-bold text-primary">
                    ${formatNumber(pedido.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Acciones</h3>
          <div className="flex flex-wrap gap-3">
            {pedido.estado === "pendiente" && (
              <button
                onClick={() => handleCambiarEstado("preparando", "Preparando")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                📋 Iniciar Preparación
              </button>
            )}

            {pedido.estado === "preparando" && (
              <button
                onClick={() => handleCambiarEstado("listo", "Listo")}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                ✅ Marcar como Listo
              </button>
            )}

            {pedido.estado === "listo" && (
              <>
                {pedido.tipoEnvio === "retiro" ? (
                  <button
                    onClick={() =>
                      handleCambiarEstado("entregado", "Entregado")
                    }
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    🏭 Confirmar Retiro
                  </button>
                ) : (
                  <button
                    onClick={() => setMostrarModalEnvio(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    🚚 Despachar Envío
                  </button>
                )}
              </>
            )}

            {pedido.estado === "enviado" && (
              <button
                onClick={() => handleCambiarEstado("entregado", "Entregado")}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                ✔️ Confirmar Entrega
              </button>
            )}

            {/* Botón Generar PDF con QR */}
            {["listo", "enviado"].includes(pedido.estado) && (
              <button
                onClick={handleGenerarPDF}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
              >
                <Icons.Document className="w-5 h-5" />
                Generar PDF de Entrega
              </button>
            )}

            <button
              onClick={handleGenerarPDF}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <Icons.Printer className="w-5 h-5" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">
            Historial del Pedido
          </h3>
          <div className="space-y-4">
            <TimelineItem
              icon="📝"
              titulo="Pedido creado"
              fecha={pedido.fecha}
              activo={true}
            />
            <TimelineItem
              icon="📋"
              titulo="En preparación"
              fecha={pedido.estado !== "pendiente" ? pedido.fecha : "Pendiente"}
              activo={pedido.estado !== "pendiente"}
            />
            <TimelineItem
              icon="✅"
              titulo="Listo para envío"
              fecha={
                ["listo", "enviado", "entregado"].includes(pedido.estado)
                  ? pedido.fecha
                  : "Pendiente"
              }
              activo={["listo", "enviado", "entregado"].includes(pedido.estado)}
            />
            <TimelineItem
              icon="🚚"
              titulo="Enviado"
              fecha={
                ["enviado", "entregado"].includes(pedido.estado)
                  ? pedido.fecha
                  : "Pendiente"
              }
              activo={["enviado", "entregado"].includes(pedido.estado)}
            />
            <TimelineItem
              icon="✔️"
              titulo="Entregado"
              fecha={pedido.estado === "entregado" ? pedido.fecha : "Pendiente"}
              activo={pedido.estado === "entregado"}
              ultimo={true}
            />
          </div>
        </div>
      </div>

      {/* Modal Despachar Envío */}
      {mostrarModalEnvio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Despachar Envío
                </h2>
                <button
                  onClick={() => setMostrarModalEnvio(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleCrearEnvio} className="p-6 space-y-4">
              {/* Selector de flete primero para auto-completar los demás campos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flete asignado{" "}
                  {fletes.length > 0 && (
                    <span className="text-orange-500">*</span>
                  )}
                </label>
                <select
                  className="input-field"
                  value={envioData.fleteId}
                  onChange={(e) => handleFleteChange(e.target.value)}
                  required={fletes.length > 0}
                >
                  <option value="">Seleccionar flete...</option>
                  {fletes.map((f) => (
                    <option key={f.id} value={f.id}>
                      🚚 {f.nombre} {f.telefono && `- ${f.telefono}`}
                    </option>
                  ))}
                </select>
                {fletes.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay fletes relacionados. Puedes crear el envío sin
                    asignar flete.
                  </p>
                )}
                {fletes.length > 0 && (
                  <p className="text-xs text-blue-500 mt-1">
                    💡 Al seleccionar un flete se completarán automáticamente
                    los datos del vehículo y conductor
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehículo
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={envioData.vehiculo}
                  onChange={(e) =>
                    setEnvioData({ ...envioData, vehiculo: e.target.value })
                  }
                  placeholder="Ej: Camioneta - ABC123 - 500kg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conductor
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={envioData.conductor}
                  onChange={(e) =>
                    setEnvioData({ ...envioData, conductor: e.target.value })
                  }
                  placeholder="Nombre del conductor"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Instrucciones especiales..."
                  value={envioData.notas}
                  onChange={(e) =>
                    setEnvioData({ ...envioData, notas: e.target.value })
                  }
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalEnvio(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  🚚 Despachar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Calificación */}
      {mostrarModalCalificar && usuarioCliente && (
        <CalificarModal
          usuario={usuarioCliente}
          onClose={() => setMostrarModalCalificar(false)}
        />
      )}
    </DepositoLayout>
  );
}

function EstadoBadgeLarge({ estado }) {
  const estilos = {
    pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
    preparando: "bg-blue-100 text-blue-800 border-blue-300",
    listo: "bg-purple-100 text-purple-800 border-purple-300",
    enviado: "bg-green-100 text-green-800 border-green-300",
    entregado: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const textos = {
    pendiente: "⏳ Pendiente",
    preparando: "📋 Preparando",
    listo: "✅ Listo para envío",
    enviado: "🚚 Enviado",
    entregado: "✔️ Entregado",
  };

  return (
    <span
      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 ${estilos[estado]}`}
    >
      {textos[estado]}
    </span>
  );
}

function TimelineItem({ icon, titulo, fecha, activo, ultimo = false }) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${activo ? "bg-green-100" : "bg-gray-100"}`}
        >
          <span className={activo ? "" : "grayscale opacity-50"}>{icon}</span>
        </div>
        {!ultimo && (
          <div
            className={`w-0.5 h-8 ${activo ? "bg-green-300" : "bg-gray-200"}`}
          />
        )}
      </div>
      <div className="pt-2">
        <p
          className={`font-medium ${activo ? "text-gray-800" : "text-gray-400"}`}
        >
          {titulo}
        </p>
        <p className={`text-sm ${activo ? "text-gray-500" : "text-gray-300"}`}>
          {fecha}
        </p>
      </div>
    </div>
  );
}
