const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Calificacion = sequelize.define(
  "Calificacion",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    calificadorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    calificadoId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    pedidoId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "pedidos",
        key: "id",
      },
    },
    puntuacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "calificaciones",
  },
);

module.exports = Calificacion;
