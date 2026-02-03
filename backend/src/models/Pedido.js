const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pedido = sequelize.define(
  "Pedido",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    numero: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      unique: true,
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
    tipoEnvio: {
      type: DataTypes.ENUM("envio", "flete", "retiro"),
      allowNull: false,
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM(
        "pendiente",
        "preparando",
        "listo",
        "enviado",
        "entregado",
        "cancelado",
      ),
      defaultValue: "pendiente",
    },
    prioridad: {
      type: DataTypes.ENUM("baja", "media", "alta"),
      defaultValue: "media",
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fechaEntregaEstimada: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fechaEntrega: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "pedidos",
  },
);

module.exports = Pedido;
