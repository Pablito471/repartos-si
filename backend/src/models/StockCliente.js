const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StockCliente = sequelize.define(
  "StockCliente",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clienteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
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
      defaultValue: 0,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    entregaId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "entregas",
        key: "id",
      },
    },
  },
  {
    tableName: "stock_clientes",
    indexes: [
      {
        fields: ["cliente_id", "nombre"],
      },
    ],
  },
);

module.exports = StockCliente;
