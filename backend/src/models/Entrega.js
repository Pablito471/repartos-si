const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Entrega = sequelize.define(
  "Entrega",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigoEntrega: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    pedidoId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "pedidos",
        key: "id",
      },
    },
    clienteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    depositoId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    productos: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    confirmada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    fechaConfirmacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "entregas",
  },
);

module.exports = Entrega;
