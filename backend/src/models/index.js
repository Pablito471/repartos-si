const sequelize = require("../config/database");
const Usuario = require("./Usuario");
const Producto = require("./Producto");
const Pedido = require("./Pedido");
const PedidoProducto = require("./PedidoProducto");
const Envio = require("./Envio");
const Calificacion = require("./Calificacion");
const Entrega = require("./Entrega");
const StockCliente = require("./StockCliente");
const UsuarioRelacion = require("./UsuarioRelacion");
const Mensaje = require("./Mensaje");
const Conversacion = require("./Conversacion");
const Movimiento = require("./Movimiento");
const ProductoRelacion = require("./ProductoRelacion");
const CodigoAlternativo = require("./CodigoAlternativo");
const CodigoAlternativoCliente = require("./CodigoAlternativoCliente");

// ============ RELACIONES ============

// Usuario (Depósito) -> Productos
Usuario.hasMany(Producto, {
  foreignKey: "depositoId",
  as: "productos",
});
Producto.belongsTo(Usuario, {
  foreignKey: "depositoId",
  as: "deposito",
});

// Usuario (Cliente) -> Pedidos (como cliente)
Usuario.hasMany(Pedido, {
  foreignKey: "clienteId",
  as: "pedidosComoCliente",
});
Pedido.belongsTo(Usuario, {
  foreignKey: "clienteId",
  as: "cliente",
});

// Usuario (Depósito) -> Pedidos (como depósito)
Usuario.hasMany(Pedido, {
  foreignKey: "depositoId",
  as: "pedidosComoDeposito",
});
Pedido.belongsTo(Usuario, {
  foreignKey: "depositoId",
  as: "deposito",
});

// Pedido -> PedidoProducto
Pedido.hasMany(PedidoProducto, {
  foreignKey: "pedidoId",
  as: "productos",
});
PedidoProducto.belongsTo(Pedido, {
  foreignKey: "pedidoId",
  as: "pedido",
});

// Producto -> PedidoProducto
Producto.hasMany(PedidoProducto, {
  foreignKey: "productoId",
  as: "pedidoProductos",
});
PedidoProducto.belongsTo(Producto, {
  foreignKey: "productoId",
  as: "producto",
});

// Pedido -> Envio
Pedido.hasOne(Envio, {
  foreignKey: "pedidoId",
  as: "envio",
});
Envio.belongsTo(Pedido, {
  foreignKey: "pedidoId",
  as: "pedido",
});

// Usuario (Flete) -> Envio
Usuario.hasMany(Envio, {
  foreignKey: "fleteId",
  as: "enviosComoFlete",
});
Envio.belongsTo(Usuario, {
  foreignKey: "fleteId",
  as: "flete",
});

// Calificaciones
Usuario.hasMany(Calificacion, {
  foreignKey: "calificadorId",
  as: "calificacionesDadas",
});
Usuario.hasMany(Calificacion, {
  foreignKey: "calificadoId",
  as: "calificacionesRecibidas",
});
Calificacion.belongsTo(Usuario, {
  foreignKey: "calificadorId",
  as: "calificador",
});
Calificacion.belongsTo(Usuario, {
  foreignKey: "calificadoId",
  as: "calificado",
});
Calificacion.belongsTo(Pedido, {
  foreignKey: "pedidoId",
  as: "pedido",
});

// Entregas
Pedido.hasOne(Entrega, {
  foreignKey: "pedidoId",
  as: "entrega",
});
Entrega.belongsTo(Pedido, {
  foreignKey: "pedidoId",
  as: "pedido",
});
Usuario.hasMany(Entrega, {
  foreignKey: "clienteId",
  as: "entregasComoCliente",
});
Entrega.belongsTo(Usuario, {
  foreignKey: "clienteId",
  as: "cliente",
});
Usuario.hasMany(Entrega, {
  foreignKey: "depositoId",
  as: "entregasComoDeposito",
});
Entrega.belongsTo(Usuario, {
  foreignKey: "depositoId",
  as: "depositoOrigen",
});

// Stock Cliente
Usuario.hasMany(StockCliente, {
  foreignKey: "clienteId",
  as: "stock",
});
StockCliente.belongsTo(Usuario, {
  foreignKey: "clienteId",
  as: "cliente",
});
Entrega.hasMany(StockCliente, {
  foreignKey: "entregaId",
  as: "stockGenerado",
});
StockCliente.belongsTo(Entrega, {
  foreignKey: "entregaId",
  as: "entrega",
});

// Relaciones entre usuarios
UsuarioRelacion.belongsTo(Usuario, {
  foreignKey: "usuarioOrigenId",
  as: "usuarioOrigen",
});
UsuarioRelacion.belongsTo(Usuario, {
  foreignKey: "usuarioDestinoId",
  as: "usuarioDestino",
});
Usuario.hasMany(UsuarioRelacion, {
  foreignKey: "usuarioOrigenId",
  as: "relacionesOrigen",
});
Usuario.hasMany(UsuarioRelacion, {
  foreignKey: "usuarioDestinoId",
  as: "relacionesDestino",
});

// Conversaciones y Mensajes
Conversacion.belongsTo(Usuario, {
  foreignKey: "usuarioId",
  as: "usuario",
});
Conversacion.belongsTo(Usuario, {
  foreignKey: "adminId",
  as: "admin",
});
Usuario.hasMany(Conversacion, {
  foreignKey: "usuarioId",
  as: "conversacionesComoUsuario",
});
Usuario.hasMany(Conversacion, {
  foreignKey: "adminId",
  as: "conversacionesComoAdmin",
});

Mensaje.belongsTo(Usuario, {
  foreignKey: "remitenteId",
  as: "remitente",
});
Mensaje.belongsTo(Usuario, {
  foreignKey: "destinatarioId",
  as: "destinatario",
});
Mensaje.belongsTo(Conversacion, {
  foreignKey: "conversacionId",
  as: "conversacion",
});
Conversacion.hasMany(Mensaje, {
  foreignKey: "conversacionId",
  as: "mensajes",
});

// Movimientos contables
Usuario.hasMany(Movimiento, {
  foreignKey: "usuarioId",
  as: "movimientos",
});
Movimiento.belongsTo(Usuario, {
  foreignKey: "usuarioId",
  as: "usuario",
});
Movimiento.belongsTo(Pedido, {
  foreignKey: "pedidoId",
  as: "pedido",
});
Pedido.hasMany(Movimiento, {
  foreignKey: "pedidoId",
  as: "movimientos",
});

// Producto -> ProductoRelacion (producto principal)
Producto.hasMany(ProductoRelacion, {
  foreignKey: "productoPrincipalId",
  as: "relacionesPrincipales",
});
ProductoRelacion.belongsTo(Producto, {
  foreignKey: "productoPrincipalId",
  as: "productoPrincipal",
});

// Producto -> ProductoRelacion (producto relacionado)
Producto.hasMany(ProductoRelacion, {
  foreignKey: "productoRelacionadoId",
  as: "relacionesRelacionadas",
});
ProductoRelacion.belongsTo(Producto, {
  foreignKey: "productoRelacionadoId",
  as: "productoRelacionado",
});

// Usuario (Depósito) -> ProductoRelacion
Usuario.hasMany(ProductoRelacion, {
  foreignKey: "depositoId",
  as: "relacionesProductos",
});
ProductoRelacion.belongsTo(Usuario, {
  foreignKey: "depositoId",
  as: "deposito",
});

// Producto -> CodigoAlternativo (códigos de barras alternativos)
Producto.hasMany(CodigoAlternativo, {
  foreignKey: "productoId",
  as: "codigosAlternativos",
});
CodigoAlternativo.belongsTo(Producto, {
  foreignKey: "productoId",
  as: "producto",
});

// Usuario (Depósito) -> CodigoAlternativo
Usuario.hasMany(CodigoAlternativo, {
  foreignKey: "depositoId",
  as: "codigosAlternativosDeposito",
});
CodigoAlternativo.belongsTo(Usuario, {
  foreignKey: "depositoId",
  as: "deposito",
});

module.exports = {
  sequelize,
  Usuario,
  Producto,
  Pedido,
  PedidoProducto,
  Envio,
  Calificacion,
  Entrega,
  StockCliente,
  UsuarioRelacion,
  Mensaje,
  Conversacion,
  Movimiento,
  ProductoRelacion,
  CodigoAlternativo,
  CodigoAlternativoCliente,
};

