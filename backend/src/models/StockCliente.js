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
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
    },
    precioCosto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "precio_costo",
    },
    precioVenta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "precio_venta",
    },
    // Campo legacy - mantener para compatibilidad con datos existentes
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
    pedidoId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "pedidos",
        key: "id",
      },
    },
    codigoBarras: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "codigo_barras",
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "General",
    },
    // Campos para productos a granel
    esGranel: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "es_granel",
    },
    unidadMedida: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "unidad",
      field: "unidad_medida",
    },
    precioUnidad: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "precio_unidad",
    },
    imagen: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "stock_clientes",
    indexes: [
      {
        fields: ["cliente_id", "nombre"],
      },
      {
        fields: ["pedido_id"],
      },
      {
        fields: ["cliente_id", "codigo_barras"],
      },
      {
        fields: ["cliente_id", "categoria"],
      },
    ],
  },
);

module.exports = StockCliente;
