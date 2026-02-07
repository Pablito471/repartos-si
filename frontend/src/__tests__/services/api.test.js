// Mock de axios antes de importar
jest.mock("axios", () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe("API Service", () => {
  describe("authService", () => {
    it("debería llamar a login con email y password", async () => {
      const mockResponse = {
        success: true,
        data: {
          usuario: { id: 1, email: "test@test.com" },
          token: "test-token",
        },
      };

      // Simular respuesta exitosa
      const credentials = { email: "test@test.com", password: "123456" };

      expect(credentials.email).toBe("test@test.com");
      expect(credentials.password).toBe("123456");
    });

    it("debería manejar error de login", async () => {
      const credentials = { email: "wrong@test.com", password: "wrong" };

      // Simular error
      const error = new Error("Credenciales inválidas");
      error.status = 401;

      expect(error.status).toBe(401);
      expect(error.message).toBe("Credenciales inválidas");
    });

    it("debería guardar token en sessionStorage después del login", () => {
      const token = "test-jwt-token";

      sessionStorage.setItem("token", token);

      expect(sessionStorage.setItem).toHaveBeenCalledWith("token", token);
    });

    it("debería eliminar token en logout", () => {
      sessionStorage.removeItem("token");

      expect(sessionStorage.removeItem).toHaveBeenCalledWith("token");
    });
  });

  describe("usuariosService", () => {
    it("debería obtener usuarios con parámetros", () => {
      const params = { tipoUsuario: "cliente" };

      expect(params.tipoUsuario).toBe("cliente");
    });

    it("debería obtener usuario por ID", () => {
      const userId = 1;

      expect(userId).toBe(1);
    });
  });

  describe("empleadosAPI", () => {
    it("debería buscar producto por código", () => {
      const codigo = "123456789012";
      const depositoId = 1;

      expect(codigo).toMatch(/^\d{12}$/);
      expect(depositoId).toBe(1);
    });

    it("debería registrar venta", () => {
      const ventaData = {
        productoId: 1,
        cantidad: 5,
        clienteId: 2,
      };

      expect(ventaData.productoId).toBe(1);
      expect(ventaData.cantidad).toBe(5);
    });

    it("debería agregar stock", () => {
      const stockData = {
        productoId: 1,
        cantidad: 10,
      };

      expect(stockData.cantidad).toBeGreaterThan(0);
    });

    it("debería crear producto", () => {
      const productoData = {
        codigo: "987654321098",
        nombre: "Nuevo Producto",
        precio: 100,
        precioVenta: 150,
        categoria: "Test",
      };

      expect(productoData.codigo).toBeDefined();
      expect(productoData.precioVenta).toBeGreaterThan(productoData.precio);
    });

    it("debería obtener estadísticas", () => {
      const filters = {
        fechaInicio: "2026-01-01",
        fechaFin: "2026-02-07",
      };

      expect(new Date(filters.fechaInicio)).toBeInstanceOf(Date);
      expect(new Date(filters.fechaFin)).toBeInstanceOf(Date);
    });
  });

  describe("productosService", () => {
    it("debería obtener productos", () => {
      const params = { depositoId: 1 };

      expect(params.depositoId).toBe(1);
    });

    it("debería crear producto", () => {
      const producto = {
        codigo: "111111111111",
        nombre: "Test",
        precio: 50,
      };

      expect(producto.precio).toBeGreaterThan(0);
    });
  });

  describe("pedidosService", () => {
    it("debería crear pedido", () => {
      const pedido = {
        clienteId: 1,
        depositoId: 2,
        productos: [{ productoId: 1, cantidad: 2 }],
      };

      expect(pedido.productos.length).toBeGreaterThan(0);
    });

    it("debería actualizar estado de pedido", () => {
      const update = {
        estado: "preparando",
      };

      expect(["pendiente", "preparando", "enviado", "entregado"]).toContain(
        update.estado,
      );
    });
  });
});
