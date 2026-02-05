// Servicio de Pusher para tiempo real en Vercel (serverless)
const Pusher = require("pusher");
require("dotenv").config();

let pusher = null;

const initPusher = () => {
  if (!pusher) {
    pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return pusher;
};

const getPusher = () => {
  if (!pusher) {
    return initPusher();
  }
  return pusher;
};

// ============================================
// Funciones para emitir eventos
// ============================================

// Emitir a un usuario específico
const emitirAUsuario = (usuarioId, evento, datos) => {
  const p = getPusher();
  if (p) {
    p.trigger(`private-user-${usuarioId}`, evento, datos);
  }
};

// Emitir a una conversación
const emitirAConversacion = (conversacionId, evento, datos) => {
  const p = getPusher();
  if (p) {
    p.trigger(`private-conversation-${conversacionId}`, evento, datos);
  }
};

// Emitir a un grupo de usuarios por rol
const emitirARol = (rol, evento, datos) => {
  const p = getPusher();
  if (p) {
    // 'admin', 'deposito', 'flete', 'cliente'
    p.trigger(`private-role-${rol}`, evento, datos);
  }
};

// ============================================
// Funciones específicas de notificaciones
// ============================================

const emitirNotificacion = (usuarioId, notificacion) => {
  emitirAUsuario(usuarioId, "notificacion", notificacion);
};

const emitirNuevoPedido = (depositoId, pedido) => {
  console.log(
    `[Pusher] Emitiendo nuevo_pedido a user_${depositoId}:`,
    pedido.id,
  );
  // Emitir al depósito específico
  emitirAUsuario(depositoId, "nuevo_pedido", pedido);
  // También a los admins
  emitirARol("admin", "nuevo_pedido", pedido);
};

const emitirPedidoActualizado = (clienteId, pedido) => {
  console.log(
    `[Pusher] Emitiendo pedido_actualizado a user_${clienteId}:`,
    pedido.id,
  );
  emitirAUsuario(clienteId, "pedido_actualizado", pedido);
};

const emitirEnvioAsignado = (fleteId, envio) => {
  console.log(`[Pusher] Emitiendo envio_asignado a user_${fleteId}:`, envio.id);
  emitirAUsuario(fleteId, "envio_asignado", envio);
};

const emitirEnvioEnCamino = (clienteId, envio) => {
  console.log(`[Pusher] Emitiendo envio_en_camino a user_${clienteId}`);
  emitirAUsuario(clienteId, "envio_en_camino", envio);
};

const emitirEnvioEntregado = (clienteId, envio) => {
  console.log(`[Pusher] Emitiendo envio_entregado a user_${clienteId}`);
  emitirAUsuario(clienteId, "envio_entregado", envio);
};

const emitirEnvioEntregadoDeposito = (depositoId, envio) => {
  console.log(
    `[Pusher] Emitiendo envio_entregado_deposito a user_${depositoId}`,
  );
  emitirAUsuario(depositoId, "envio_entregado_deposito", envio);
};

const emitirCuentaEstado = (usuarioId, activo, mensaje) => {
  emitirAUsuario(usuarioId, "cuenta_estado", { activo, mensaje });
};

const emitirStockBajo = (depositoId, producto, cantidad) => {
  emitirAUsuario(depositoId, "stock_bajo", { producto, cantidad });
};

// ============================================
// Funciones de Chat
// ============================================

const emitirNuevoMensaje = (
  conversacionId,
  mensaje,
  remitenteId,
  destinatarioId,
) => {
  // Emitir a la conversación
  emitirAConversacion(conversacionId, "nuevo_mensaje", mensaje);

  // También emitir directamente a los usuarios para asegurar entrega
  emitirAUsuario(remitenteId, "nuevo_mensaje", mensaje);
  emitirAUsuario(destinatarioId, "nuevo_mensaje", mensaje);

  // Notificar al destinatario
  emitirAUsuario(destinatarioId, "notificacion_mensaje", {
    conversacionId,
    mensaje,
  });
};

const emitirEscribiendo = (conversacionId, usuario) => {
  emitirAConversacion(conversacionId, "usuario_escribiendo", {
    usuarioId: usuario.id,
    nombre: usuario.nombre,
    conversacionId,
  });
};

const emitirDejoEscribir = (conversacionId, usuarioId) => {
  emitirAConversacion(conversacionId, "usuario_dejo_escribir", {
    usuarioId,
    conversacionId,
  });
};

const emitirMensajesLeidos = (conversacionId, lectorId) => {
  emitirAConversacion(conversacionId, "mensajes_leidos", {
    conversacionId,
    lectorId,
  });
};

module.exports = {
  initPusher,
  getPusher,
  emitirAUsuario,
  emitirAConversacion,
  emitirARol,
  emitirNotificacion,
  emitirNuevoPedido,
  emitirPedidoActualizado,
  emitirEnvioAsignado,
  emitirEnvioEnCamino,
  emitirEnvioEntregado,
  emitirEnvioEntregadoDeposito,
  emitirCuentaEstado,
  emitirStockBajo,
  emitirNuevoMensaje,
  emitirEscribiendo,
  emitirDejoEscribir,
  emitirMensajesLeidos,
};
