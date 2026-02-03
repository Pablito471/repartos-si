const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Movimiento = sequelize.define(
  "Movimiento",
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
    tipo: {
      type: DataTypes.ENUM("ingreso", "egreso"),
      allowNull: false,
    },
    concepto: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    categoria: {
      type: DataTypes.ENUM(
        "ventas",
        "compras",
        "cobranzas",
        "logistica",
        "servicios",
        "otros",
      ),
      defaultValue: "otros",
    },
    pedidoId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "pedidos",
        key: "id",
      },
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "movimientos",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Movimiento;
