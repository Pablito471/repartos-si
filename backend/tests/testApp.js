// Test app - versión modificada para testing
require("dotenv").config({ path: ".env.test" });
const express = require("express");
const cors = require("cors");
const routes = require("../src/routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const createTestApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", routes);

  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Test API",
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Ruta no encontrada",
    });
  });

  app.use(errorHandler);

  return app;
};

module.exports = createTestApp;
