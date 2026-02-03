const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcryptjs");

const Usuario = sequelize.define(
  "Usuario",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tipoUsuario: {
      type: DataTypes.ENUM("admin", "cliente", "deposito", "flete"),
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    foto: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    esOculto: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Campos específicos para depósitos
    horarioApertura: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    horarioCierre: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diasLaborales: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
    },
    tiposEnvio: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    capacidadMaxima: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    alertaStockMinimo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Campos específicos para fletes
    vehiculoTipo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vehiculoPatente: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vehiculoCapacidad: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    licenciaTipo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    licenciaVencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // Datos fiscales (JSON)
    datosFiscales: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "usuarios",
    hooks: {
      beforeCreate: async (usuario) => {
        if (usuario.password) {
          usuario.password = await bcrypt.hash(usuario.password, 10);
        }
      },
      beforeUpdate: async (usuario) => {
        if (usuario.changed("password")) {
          usuario.password = await bcrypt.hash(usuario.password, 10);
        }
      },
    },
  },
);

// Método para comparar passwords
Usuario.prototype.validarPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Método para ocultar password en las respuestas
Usuario.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = Usuario;
