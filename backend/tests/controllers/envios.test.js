// Mock de modelos antes de importar el controlador
jest.mock("../../src/models", () => require("../mocks/models"));

// Configurar variables de entorno para tests
process.env.JWT_SECRET = "test-secret-key";

const enviosController = require("../../src/controllers/enviosController");
const { Envio, Pedido, Usuario, mockUsuarios } = require("../mocks/models");

describe("Envios Controller", () => {
    let mockReq;
    let mockRes;
    let mockNext;

    const mockFlete = {
        id: "flete-1",
        nombre: "Flete Test",
        email: "flete@test.com",
        tipoUsuario: "flete",
        activo: true,
    };

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
            usuario: mockFlete,
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe("listar", () => {
        it("debería listar envíos", async () => {
            Envio.findAll.mockResolvedValue([
                {
                    id: "env-1",
                    pedidoId: "ped-1",
                    fleteId: mockFlete.id,
                    estado: "pendiente",
                    createdAt: new Date(),
                },
            ]);

            await enviosController.listar(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
        });
    });

    describe("getEnviosActivosFlete", () => {
        it("debería obtener envíos activos del flete", async () => {
            Envio.findAll.mockResolvedValue([
                {
                    id: "env-1",
                    pedidoId: "ped-1",
                    fleteId: mockFlete.id,
                    estado: "en_camino",
                    createdAt: new Date(),
                },
            ]);

            await enviosController.getEnviosActivosFlete(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
            const response = mockRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
        });
    });

    describe("crear", () => {
        it("debería crear un envío correctamente", async () => {
            mockReq.usuario = mockUsuarios[1]; // deposito
            mockReq.body = {
                pedidoId: "ped-1",
                fleteId: mockFlete.id,
                fechaEstimada: new Date().toISOString(),
            };

            Pedido.findByPk.mockResolvedValue({
                id: "ped-1",
                depositoId: mockUsuarios[1].id,
                estado: "confirmado",
                update: jest.fn().mockResolvedValue(true),
            });

            Usuario.findByPk.mockResolvedValue(mockFlete);

            Envio.create.mockResolvedValue({
                id: "nuevo-env",
                pedidoId: "ped-1",
                fleteId: mockFlete.id,
                estado: "pendiente",
                createdAt: new Date(),
            });

            await enviosController.crear(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
        });

        it("debería rechazar si pedido no existe", async () => {
            mockReq.usuario = mockUsuarios[1]; // deposito
            mockReq.body = {
                pedidoId: "ped-inexistente",
                fleteId: mockFlete.id,
            };

            Pedido.findByPk.mockResolvedValue(null);

            await enviosController.crear(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe("cambiarEstado", () => {
        it("debería cambiar estado de envío a entregado", async () => {
            mockReq.params = { id: "env-1" };
            mockReq.body = { estado: "entregado" };

            const mockEnvio = {
                id: "env-1",
                fleteId: mockFlete.id,
                estado: "en_camino",
                update: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue(true),
                pedido: {
                    update: jest.fn().mockResolvedValue(true),
                },
            };

            Envio.findOne.mockResolvedValue(mockEnvio);

            await enviosController.cambiarEstado(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
        });

        it("debería cambiar estado a en_camino (recogido)", async () => {
            mockReq.params = { id: "env-1" };
            mockReq.body = { estado: "en_camino" };

            const mockEnvio = {
                id: "env-1",
                fleteId: mockFlete.id,
                estado: "pendiente",
                update: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue(true),
            };

            Envio.findOne.mockResolvedValue(mockEnvio);

            await enviosController.cambiarEstado(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
        });

        it("debería rechazar estado inválido", async () => {
            mockReq.params = { id: "env-1" };
            mockReq.body = { estado: "estado-invalido" };

            await enviosController.cambiarEstado(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it("debería rechazar si envío no existe", async () => {
            mockReq.params = { id: "env-inexistente" };
            mockReq.body = { estado: "entregado" };

            Envio.findOne.mockResolvedValue(null);

            await enviosController.cambiarEstado(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            const error = mockNext.mock.calls[0][0];
            expect(error.statusCode).toBe(404);
        });
    });

    describe("actualizarUbicacion", () => {
        it("debería actualizar ubicación del envío", async () => {
            mockReq.params = { id: "env-1" };
            mockReq.body = {
                latitud: -34.6037,
                longitud: -58.3816,
            };

            const mockEnvio = {
                id: "env-1",
                fleteId: mockFlete.id,
                update: jest.fn().mockResolvedValue(true),
            };

            Envio.findOne.mockResolvedValue(mockEnvio);

            await enviosController.actualizarUbicacion(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalled();
        });
    });
});
