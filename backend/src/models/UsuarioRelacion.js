const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UsuarioRelacion = sequelize.define(
  "UsuarioRelacion",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuarioOrigenId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    usuarioDestinoId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    tipoRelacion: {
      type: DataTypes.ENUM(
        "cliente_deposito", // Cliente vinculado a un depósito
        "flete_deposito", // Flete vinculado a un depósito
        "deposito_flete", // Depósito vinculado a un flete
      ),
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: "usuario_relaciones",
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["usuario_origen_id", "usuario_destino_id", "tipo_relacion"],
      },
    ],
  },
);

module.exports = UsuarioRelacion;
