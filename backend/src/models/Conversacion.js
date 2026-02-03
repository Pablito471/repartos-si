const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Conversacion = sequelize.define(
  "Conversacion",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    estado: {
      type: DataTypes.ENUM("activa", "cerrada", "archivada"),
      defaultValue: "activa",
    },
    ultimoMensaje: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ultimoMensajeFecha: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    mensajesNoLeidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    mensajesNoLeidosAdmin: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "conversaciones",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["usuario_id", "admin_id"],
      },
    ],
  },
);

module.exports = Conversacion;
