// Mock de modelos antes de importar el controlador
jest.mock("../../src/models", () => require("../mocks/models"));

// Configurar variables de entorno para tests
process.env.JWT_SECRET = "test-secret-key";

const movimientosController = require("../../src/controllers/movimientosController");
const { Movimiento, Usuario, mockUsuarios } = require("../mocks/models");

describe("Movimientos Controller", () => {
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
        it("debería listar movimientos del usuario", async () => {
            Movimiento.findAll.mockResolvedValue([
                {
                    id: "mov-1",
                    usuarioId: mockUsuarios[0].id,
                    tipo: "ingreso",
                    concepto: "Cobro pedido",
                    monto: 1500.0,
                    categoria: "ventas",
                    createdAt: new Date(),
                },
                {
                    id: "mov-2",
                    usuarioId: mockUsuarios[0].id,
                    tipo: "egreso",
                    concepto: "Compra stock",
                    monto: 500.0,
                    categoria: "compras",
                    createdAt: new Date(),
                },
            ]);

            await movimientosController.listar(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.data).toHaveLength(2);
        });

        it("debería filtrar por tipo", async () => {
            mockReq.query = { tipo: "ingreso" };

            Movimiento.findAll.mockResolvedValue([
                {
                    id: "mov-1",
                    tipo: "ingreso",
                    concepto: "Cobro",
                    monto: 1000.0,
                    createdAt: new Date(),
                },
            ]);

            await movimientosController.listar(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
        });
    });

    describe("crear", () => {
        it("debería crear un movimiento de ingreso", async () => {
            mockReq.body = {
                tipo: "ingreso",
                concepto: "Cobro de venta",
                monto: 2500.0,
                categoria: "ventas",
            };

            Movimiento.create.mockResolvedValue({
                id: "nuevo-mov",
                usuarioId: mockUsuarios[0].id,
                tipo: "ingreso",
                concepto: "Cobro de venta",
                monto: 2500.0,
                categoria: "ventas",
                createdAt: new Date(),
            });

            await movimientosController.crear(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalled();
            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.data.monto).toBe(2500.0);
        });

        it("debería rechazar tipo inválido", async () => {
            mockReq.body = {
                tipo: "invalido",
                concepto: "Test",
                monto: 100,
            };

            await movimientosController.crear(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            const error = mockNext.mock.calls[0][0];
            expect(error.statusCode).toBe(400);
        });

        it("debería rechazar monto negativo", async () => {
            mockReq.body = {
                tipo: "ingreso",
                concepto: "Test",
                monto: -100,
            };

            await movimientosController.crear(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            const error = mockNext.mock.calls[0][0];
            expect(error.statusCode).toBe(400);
        });

        it("debería rechazar datos incompletos", async () => {
            mockReq.body = {
                tipo: "ingreso",
                // falta concepto y monto
            };

            await movimientosController.crear(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            const error = mockNext.mock.calls[0][0];
            expect(error.statusCode).toBe(400);
        });
    });

    describe("obtenerTotales", () => {
        it("debería calcular totales correctamente", async () => {
            Movimiento.findAll.mockResolvedValue([
                { tipo: "ingreso", monto: 1000.0 },
                { tipo: "ingreso", monto: 2000.0 },
                { tipo: "egreso", monto: 500.0 },
            ]);

            await movimientosController.obtenerTotales(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.data.ingresos).toBe(3000);
            expect(response.data.egresos).toBe(500);
            expect(response.data.balance).toBe(2500);
        });
    });

    describe("eliminar", () => {
        it("debería eliminar un movimiento existente", async () => {
            mockReq.params = { id: "mov-1" };

            const mockMovimiento = {
                id: "mov-1",
                usuarioId: mockUsuarios[0].id,
                destroy: jest.fn().mockResolvedValue(true),
            };

            Movimiento.findOne.mockResolvedValue(mockMovimiento);

            await movimientosController.eliminar(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
        });

        it("debería rechazar si no existe el movimiento", async () => {
            mockReq.params = { id: "no-existe" };
            Movimiento.findOne.mockResolvedValue(null);

            await movimientosController.eliminar(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            const error = mockNext.mock.calls[0][0];
            expect(error.statusCode).toBe(404);
        });
    });
});
