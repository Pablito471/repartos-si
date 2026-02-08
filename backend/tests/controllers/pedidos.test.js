// Mock de modelos antes de importar el controlador
jest.mock("../../src/models", () => require("../mocks/models"));

// Configurar variables de entorno para tests
process.env.JWT_SECRET = "test-secret-key";

const pedidosController = require("../../src/controllers/pedidosController");
const { Pedido, Usuario, Producto, mockUsuarios } = require("../mocks/models");

describe("Pedidos Controller", () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
            usuario: mockUsuarios[0], // cliente@test.com
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe("listar", () => {
        it("debería listar pedidos del usuario", async () => {
            Pedido.findAll.mockResolvedValue([
                {
                    id: "ped-1",
                    numero: "PED-001",
                    clienteId: mockUsuarios[0].id,
                    depositoId: "dep-1",
                    estado: "pendiente",
                    total: 5000.0,
                    productos: [],
                    createdAt: new Date(),
                },
            ]);

            await pedidosController.listar(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
        });

        it("debería filtrar por estado", async () => {
            mockReq.query = { estado: "pendiente" };

            Pedido.findAll.mockResolvedValue([]);

            await pedidosController.listar(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
        });
    });

    describe("crear", () => {
        it("debería crear un pedido correctamente", async () => {
            mockReq.body = {
                depositoId: "dep-1",
                productos: [
                    { productoId: "prod-1", cantidad: 2 },
                    { productoId: "prod-2", cantidad: 3 },
                ],
                direccion: "Calle Test 123",
                notas: "Entregar por la mañana",
            };

            Pedido.create.mockResolvedValue({
                id: "nuevo-ped",
                numero: "PED-002",
                clienteId: mockUsuarios[0].id,
                depositoId: "dep-1",
                estado: "pendiente",
                total: 3500.0,
                createdAt: new Date(),
            });

            Usuario.findByPk.mockResolvedValue({
                id: "dep-1",
                nombre: "Depósito Test",
                tipoUsuario: "deposito",
            });

            await pedidosController.crear(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it("debería rechazar pedido sin productos", async () => {
            mockReq.body = {
                depositoId: "dep-1",
                productos: [],
            };

            await pedidosController.crear(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it("debería rechazar si depósito no existe", async () => {
            mockReq.body = {
                depositoId: "dep-inexistente",
                productos: [{ productoId: "prod-1", cantidad: 1 }],
            };

            Usuario.findByPk.mockResolvedValue(null);

            await pedidosController.crear(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe("obtenerPorId", () => {
        it("debería obtener un pedido por ID", async () => {
            mockReq.params = { id: "ped-1" };

            Pedido.findOne.mockResolvedValue({
                id: "ped-1",
                numero: "PED-001",
                estado: "pendiente",
                total: 5000.0,
            });

            await pedidosController.obtenerPorId(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
        });

        it("debería rechazar si pedido no existe", async () => {
            mockReq.params = { id: "ped-inexistente" };
            Pedido.findOne.mockResolvedValue(null);

            await pedidosController.obtenerPorId(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            const error = mockNext.mock.calls[0][0];
            expect(error.statusCode).toBe(404);
        });
    });

    describe("cambiarEstado", () => {
        it("debería cambiar estado de pedido", async () => {
            mockReq.params = { id: "ped-1" };
            mockReq.body = { estado: "confirmado" };

            const mockPedido = {
                id: "ped-1",
                estado: "pendiente",
                update: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue(true),
            };

            Pedido.findOne.mockResolvedValue(mockPedido);

            await pedidosController.cambiarEstado(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
        });

        it("debería rechazar estado inválido", async () => {
            mockReq.params = { id: "ped-1" };
            mockReq.body = { estado: "estado-invalido" };

            await pedidosController.cambiarEstado(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });
});
