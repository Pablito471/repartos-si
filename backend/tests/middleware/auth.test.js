const jwt = require("jsonwebtoken");

// Mock de modelos
jest.mock("../../src/models", () => require("../mocks/models"));

process.env.JWT_SECRET = "test-secret-key";

const { Usuario, mockUsuarios } = require("../mocks/models");

// Importar middleware después del mock
const auth = require("../../src/middleware/auth");

describe("Auth Middleware", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      header: jest.fn(),
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("auth middleware", () => {
    it("debería pasar con token válido", async () => {
      const token = jwt.sign(
        { id: 1, email: "cliente@test.com", tipoUsuario: "cliente" },
        process.env.JWT_SECRET,
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      Usuario.findByPk.mockResolvedValueOnce(mockUsuarios[0]);

      await auth.auth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.usuario).toBeDefined();
    });

    it("debería rechazar sin token", async () => {
      mockReq.header.mockReturnValue(null);

      await auth.auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Acceso denegado. Token no proporcionado.",
      });
    });

    it("debería rechazar token inválido", async () => {
      mockReq.header.mockReturnValue("Bearer invalid-token");

      await auth.auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Token inválido.",
      });
    });

    it("debería rechazar token expirado", async () => {
      const token = jwt.sign(
        { id: 1, email: "cliente@test.com" },
        process.env.JWT_SECRET,
        { expiresIn: "-1s" }, // Token ya expirado
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await auth.auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Token expirado.",
      });
    });

    it("debería rechazar usuario no encontrado", async () => {
      const token = jwt.sign(
        { id: 999, email: "noexiste@test.com" },
        process.env.JWT_SECRET,
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      Usuario.findByPk.mockResolvedValueOnce(null);

      await auth.auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Usuario no encontrado.",
      });
    });

    it("debería rechazar usuario desactivado", async () => {
      const token = jwt.sign(
        { id: 4, email: "desactivado@test.com" },
        process.env.JWT_SECRET,
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      Usuario.findByPk.mockResolvedValueOnce(mockUsuarios[3]); // Usuario desactivado

      await auth.auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Usuario desactivado.",
      });
    });
  });

  describe("requireRole middleware", () => {
    it("debería pasar con rol correcto", () => {
      mockReq.usuario = mockUsuarios[0]; // cliente

      const middleware = auth.requireRole("cliente", "deposito");
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("debería rechazar con rol incorrecto", () => {
      mockReq.usuario = mockUsuarios[0]; // cliente

      const middleware = auth.requireRole("admin");
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "No tienes permiso para realizar esta acción.",
      });
    });

    it("debería rechazar sin usuario autenticado", () => {
      mockReq.usuario = null;

      const middleware = auth.requireRole("cliente");
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe("authEmpleado middleware", () => {
    it("debería pasar con empleado válido", () => {
      mockReq.usuario = mockUsuarios[2]; // empleado

      const middleware = auth.authEmpleado;
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("debería rechazar no empleado", () => {
      mockReq.usuario = mockUsuarios[0]; // cliente

      const middleware = auth.authEmpleado;
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});

describe("JWT Utilities", () => {
  it("debería generar token con payload correcto", () => {
    const payload = {
      id: 1,
      email: "test@test.com",
      tipoUsuario: "cliente",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.tipoUsuario).toBe(payload.tipoUsuario);
  });

  it("debería incluir timestamps en el token", () => {
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.iat).toBeDefined(); // issued at
  });
});
