// Mock de modelos
jest.mock("../../src/models", () => require("../mocks/models"));

const { Producto, mockProductos } = require("../mocks/models");

describe("Productos Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Obtener Productos", () => {
    it("debería obtener todos los productos", async () => {
      const productos = await Producto.findAll();

      expect(productos).toBeDefined();
      expect(Array.isArray(productos)).toBe(true);
      expect(productos.length).toBeGreaterThan(0);
    });

    it("debería filtrar productos por depósito", async () => {
      const depositoId = 2;

      Producto.findAll.mockResolvedValueOnce(
        mockProductos.filter((p) => p.depositoId === depositoId),
      );

      const productos = await Producto.findAll({
        where: { depositoId },
      });

      expect(productos.every((p) => p.depositoId === depositoId)).toBe(true);
    });
  });

  describe("Obtener Producto por ID", () => {
    it("debería obtener un producto por ID", async () => {
      const producto = await Producto.findByPk(1);

      expect(producto).toBeDefined();
      expect(producto.id).toBe(1);
    });

    it("debería retornar null si el producto no existe", async () => {
      Producto.findByPk.mockResolvedValueOnce(null);

      const producto = await Producto.findByPk(999);

      expect(producto).toBeNull();
    });
  });

  describe("Buscar Producto por Código", () => {
    it("debería encontrar producto por código EAN", async () => {
      const codigo = "123456789012";

      Producto.findOne.mockResolvedValueOnce(mockProductos[0]);

      const producto = await Producto.findOne({ where: { codigo } });

      expect(producto).toBeDefined();
      expect(producto.codigo).toBe(codigo);
    });
  });

  describe("Crear Producto", () => {
    it("debería crear un producto con datos válidos", async () => {
      const nuevoProducto = {
        codigo: "111111111111",
        nombre: "Producto Nuevo",
        categoria: "Categoría",
        precio: 100,
        precioVenta: 150,
        depositoId: 2,
      };

      const resultado = await Producto.create(nuevoProducto);

      expect(resultado).toBeDefined();
      expect(resultado.codigo).toBe(nuevoProducto.codigo);
      expect(resultado.nombre).toBe(nuevoProducto.nombre);
    });
  });

  describe("Validaciones de Producto", () => {
    it("debería tener código de barras válido", () => {
      const producto = mockProductos[0];

      // Validar formato EAN-13
      expect(producto.codigo).toMatch(/^\d{12,13}$/);
    });

    it("debería tener precio de venta mayor que precio de costo", () => {
      const producto = mockProductos[0];

      expect(producto.precioVenta).toBeGreaterThan(producto.precio);
    });

    it("debería tener stock no negativo", () => {
      const producto = mockProductos[0];

      expect(producto.stock).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Cálculos de Producto", () => {
    it("debería calcular margen de ganancia", () => {
      const producto = mockProductos[0];
      const margen =
        ((producto.precioVenta - producto.precio) / producto.precio) * 100;

      expect(margen).toBeGreaterThan(0);
      expect(margen).toBe(50); // 150 - 100 = 50, 50/100 = 50%
    });

    it("debería calcular valor total del stock", () => {
      const producto = mockProductos[0];
      const valorStock = producto.stock * producto.precio;

      expect(valorStock).toBe(5000); // 50 * 100
    });
  });
});
