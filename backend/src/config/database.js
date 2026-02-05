const { Sequelize } = require("sequelize");
require("dotenv").config();

// Configuración para soportar DATABASE_URL (Vercel/Railway/Heroku) o variables individuales
const sequelizeOptions = {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
  // Configuración SSL para producción (requerido por Neon, Supabase, etc.)
  dialectOptions:
    process.env.NODE_ENV === "production"
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
};

let sequelize;

// Usar DATABASE_URL si está disponible (formato: postgresql://user:pass@host:port/db)
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, sequelizeOptions);
} else {
  // Usar variables individuales
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      ...sequelizeOptions,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
    },
  );
}

module.exports = sequelize;
