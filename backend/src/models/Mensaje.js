const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Mensaje = sequelize.define(
  "Mensaje",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversacionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    remitenteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    destinatarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM("texto", "imagen", "archivo"),
      defaultValue: "texto",
    },
    entregado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    fechaEntregado: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    leido: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    fechaLeido: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "mensajes",
    underscored: true,
    indexes: [
      {
        fields: ["conversacion_id"],
      },
      {
        fields: ["remitente_id"],
      },
      {
        fields: ["destinatario_id"],
      },
      {
        fields: ["created_at"],
      },
    ],
  },
);

module.exports = Mensaje;
