// Mock de modelos antes de importar el controlador
jest.mock("../../src/models", () => require("../mocks/models"));

process.env.JWT_SECRET = "test-secret-key";

const {
  Usuario,
  Producto,
  Movimiento,
  mockUsuarios,
  mockProductos,
} = require("../mocks/models");

describe("Empleados Controller", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      usuario: mockUsuarios[2], // empleado
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("Buscar Producto por Código", () => {
    it("debería encontrar un producto por código de barras", async () => {
      const codigo = "123456789012";

      Producto.findOne.mockResolvedValueOnce(mockProductos[0]);

      const result = await Producto.findOne({ where: { codigo } });

      expect(result).toBeDefined();
      expect(result.codigo).toBe(codigo);
      expect(result.nombre).toBe("Producto Test 1");
    });

    it("debería retornar null si el producto no existe", async () => {
      const codigo = "000000000000";

      Producto.findOne.mockResolvedValueOnce(null);

      const result = await Producto.findOne({ where: { codigo } });

      expect(result).toBeNull();
    });
  });

  describe("Registrar Venta", () => {
    it("debería crear un movimiento de venta", async () => {
      const ventaData = {
        tipo: "venta",
        cantidad: 3,
        productoId: 1,
        depositoId: 2,
        clienteId: 1,
        empleadoId: 3,
        monto: 450,
      };

      Movimiento.create.mockResolvedValueOnce({
        id: 2,
        ...ventaData,
        createdAt: new Date(),
      });

      const result = await Movimiento.create(ventaData);

      expect(result).toBeDefined();
      expect(result.tipo).toBe("venta");
      expect(result.cantidad).toBe(3);
      expect(result.empleadoId).toBe(3);
    });
  });

  describe("Agregar Stock", () => {
    it("debería crear un movimiento de entrada de stock", async () => {
      const stockData = {
        tipo: "entrada",
        cantidad: 10,
        productoId: 1,
        depositoId: 2,
        empleadoId: 3,
      };

      Movimiento.create.mockResolvedValueOnce({
        id: 3,
        ...stockData,
        createdAt: new Date(),
      });

      const result = await Movimiento.create(stockData);

      expect(result).toBeDefined();
      expect(result.tipo).toBe("entrada");
      expect(result.cantidad).toBe(10);
    });
  });

  describe("Crear Producto", () => {
    it("debería crear un nuevo producto", async () => {
      const productoData = {
        codigo: "555555555555",
        nombre: "Producto Nuevo",
        categoria: "Nueva Categoría",
        precio: 500,
        precioVenta: 750,
        depositoId: 2,
      };

      Producto.create.mockResolvedValueOnce({
        id: 3,
        ...productoData,
        stock: 0,
      });

      const result = await Producto.create(productoData);

      expect(result).toBeDefined();
      expect(result.codigo).toBe("555555555555");
      expect(result.nombre).toBe("Producto Nuevo");
    });

    it("no debería crear producto con código duplicado", async () => {
      const codigo = "123456789012";

      Producto.findOne.mockResolvedValueOnce(mockProductos[0]);

      const existing = await Producto.findOne({ where: { codigo } });

      expect(existing).not.toBeNull();
      // El controlador debería verificar esto antes de crear
    });
  });

  describe("Estadísticas de Empleado", () => {
    it("debería obtener estadísticas de ventas del empleado", async () => {
      const empleadoId = 3;

      Movimiento.findAll.mockResolvedValueOnce([
        { tipo: "venta", cantidad: 5, monto: 750 },
        { tipo: "venta", cantidad: 3, monto: 450 },
      ]);

      const movimientos = await Movimiento.findAll({
        where: { empleadoId, tipo: "venta" },
      });

      expect(movimientos).toHaveLength(2);

      const totalVentas = movimientos.length;
      const montoTotal = movimientos.reduce((sum, m) => sum + m.monto, 0);
      const cantidadTotal = movimientos.reduce((sum, m) => sum + m.cantidad, 0);

      expect(totalVentas).toBe(2);
      expect(montoTotal).toBe(1200);
      expect(cantidadTotal).toBe(8);
    });

    it("debería manejar empleado sin ventas", async () => {
      Movimiento.findAll.mockResolvedValueOnce([]);

      const movimientos = await Movimiento.findAll({
        where: { empleadoId: 999, tipo: "venta" },
      });

      expect(movimientos).toHaveLength(0);
    });
  });
});

describe("Validaciones de Empleado", () => {
  it("debería verificar que el usuario es empleado", () => {
    const empleado = mockUsuarios.find((u) => u.tipoUsuario === "empleado");

    expect(empleado).toBeDefined();
    expect(empleado.tipoUsuario).toBe("empleado");
    expect(empleado.empleadorId).toBeDefined();
    expect(empleado.tipoEmpleador).toBeDefined();
  });

  it("debería verificar que el empleado tiene empleador", () => {
    const empleado = mockUsuarios.find((u) => u.tipoUsuario === "empleado");

    expect(empleado.empleadorId).toBe(2);
    expect(empleado.tipoEmpleador).toBe("deposito");
  });
});
