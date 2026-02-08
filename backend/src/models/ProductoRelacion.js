const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductoRelacion = sequelize.define(
  "ProductoRelacion",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productoPrincipalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "productos",
        key: "id",
      },
    },
    productoRelacionadoId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "productos",
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
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "productos_relaciones",
    indexes: [
      {
        unique: true,
        fields: ["producto_principal_id", "producto_relacionado_id"],
      },
    ],
  },
);

module.exports = ProductoRelacion;
