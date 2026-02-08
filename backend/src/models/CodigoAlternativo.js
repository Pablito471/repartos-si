const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CodigoAlternativo = sequelize.define(
    "CodigoAlternativo",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        productoId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "productos",
                key: "id",
            },
        },
        codigo: {
            type: DataTypes.STRING,
            allowNull: false,
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
        tableName: "codigos_alternativos",
        indexes: [
            {
                unique: true,
                fields: ["deposito_id", "codigo"],
            },
        ],
    },
);

module.exports = CodigoAlternativo;
