const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CodigoAlternativoCliente = sequelize.define(
    "CodigoAlternativoCliente",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        clienteId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "cliente_id",
            references: {
                model: "usuarios",
                key: "id",
            },
        },
        // Nombre del producto al que está asociado (en stock del cliente)
        nombreProducto: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "nombre_producto",
        },
        codigo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "codigos_alternativos_cliente",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ["cliente_id", "codigo"],
                where: { activo: true },
            },
        ],
    }
);

module.exports = CodigoAlternativoCliente;
