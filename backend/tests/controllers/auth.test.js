const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Mock de modelos antes de importar el controlador
jest.mock("../../src/models", () => require("../mocks/models"));

// Mock de email service
jest.mock("../../src/services/emailService", () => ({
  enviarEmailBienvenida: jest.fn().mockResolvedValue(true),
  enviarEmailRecuperacion: jest.fn().mockResolvedValue(true),
}));

// Configurar variables de entorno para tests
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1d";
process.env.FRONTEND_URL = "http://localhost:3000";

const authController = require("../../src/controllers/authController");
const { Usuario, mockUsuarios } = require("../mocks/models");

describe("Auth Controller", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      usuario: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("debería iniciar sesión correctamente con credenciales válidas", async () => {
      mockReq.body = {
        email: "cliente@test.com",
        password: "123456",
      };

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.token).toBeDefined();
      expect(response.data.usuario).toBeDefined();
    });

    it("debería rechazar credenciales inválidas (email)", async () => {
      mockReq.body = {
        email: "noexiste@test.com",
        password: "123456",
      };

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Credenciales inválidas");
    });

    it("debería rechazar credenciales inválidas (password)", async () => {
      mockReq.body = {
        email: "cliente@test.com",
        password: "wrongpassword",
      };

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });

    it("debería rechazar usuario desactivado", async () => {
      mockReq.body = {
        email: "desactivado@test.com",
        password: "123456",
      };

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });
  });

  describe("registro", () => {
    it("debería registrar un nuevo usuario correctamente", async () => {
      mockReq.body = {
        email: "nuevo@test.com",
        password: "123456",
        tipoUsuario: "cliente",
        nombre: "Nuevo Usuario",
        telefono: "111222333",
        direccion: "Nueva Dirección",
      };

      // Mock para que no encuentre usuario existente
      Usuario.findOne.mockResolvedValueOnce(null);

      await authController.registro(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
    });

    it("debería rechazar email duplicado", async () => {
      mockReq.body = {
        email: "cliente@test.com",
        password: "123456",
        tipoUsuario: "cliente",
        nombre: "Usuario Duplicado",
      };

      await authController.registro(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("El email ya está registrado");
    });

    it("debería rechazar contraseña débil", async () => {
      mockReq.body = {
        email: "nuevo@test.com",
        password: "123", // muy corta
        tipoUsuario: "cliente",
        nombre: "Usuario Test",
      };

      await authController.registro(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
    });
  });

  describe("getMe", () => {
    it("debería retornar el usuario actual", async () => {
      mockReq.usuario = mockUsuarios[0];

      await authController.getMe(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.usuario).toBeDefined();
    });
  });
});

describe("JWT Token", () => {
  it("debería generar un token válido", () => {
    const payload = { id: 1, email: "test@test.com", tipoUsuario: "cliente" };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    expect(token).toBeDefined();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
  });

  it("debería rechazar token inválido", () => {
    expect(() => {
      jwt.verify("invalid-token", process.env.JWT_SECRET);
    }).toThrow();
  });
});
