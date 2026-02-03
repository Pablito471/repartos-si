const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Envio = sequelize.define(
  "Envio",
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
    fleteId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    vehiculo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    conductor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "en_camino", "entregado", "fallido"),
      defaultValue: "pendiente",
    },
    fechaSalida: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fechaEntrega: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fechaEstimada: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ubicacionActual: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "envios",
  },
);

module.exports = Envio;
