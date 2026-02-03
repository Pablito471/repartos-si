const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PedidoProducto = sequelize.define(
  "PedidoProducto",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pedidoId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "pedidos",
        key: "id",
      },
    },
    productoId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "productos",
        key: "id",
      },
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "pedido_productos",
  },
);

module.exports = PedidoProducto;
