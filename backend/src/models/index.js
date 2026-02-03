const sequelize = require("../config/database");
const Usuario = require("./Usuario");
const Producto = require("./Producto");
const Pedido = require("./Pedido");
const PedidoProducto = require("./PedidoProducto");
const Envio = require("./Envio");
const Calificacion = require("./Calificacion");
const Entrega = require("./Entrega");
const StockCliente = require("./StockCliente");

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
};
