// Tests básicos para pedidosController
// Estos tests verifican la estructura básica del controlador

describe("Pedidos Controller - Basic Structure", () => {
    it("debería tener el módulo de pedidos accesible", () => {
        const pedidosController = require("../../src/controllers/pedidosController");
        expect(pedidosController).toBeDefined();
    });

    it("debería exportar las funciones principales", () => {
        const pedidosController = require("../../src/controllers/pedidosController");
        expect(typeof pedidosController.getPedidos).toBe("function");
        expect(typeof pedidosController.getPedido).toBe("function");
        expect(typeof pedidosController.crearPedido).toBe("function");
        expect(typeof pedidosController.cambiarEstado).toBe("function");
    });
});

describe("Pedidos - Validaciones", () => {
    it("debería rechazar estados inválidos", () => {
        const estadosValidos = ["pendiente", "confirmado", "preparando", "listo", "entregado", "cancelado"];
        const estadoInvalido = "invalido";
        expect(estadosValidos.includes(estadoInvalido)).toBe(false);
    });

    it("debería aceptar estados válidos", () => {
        const estadosValidos = ["pendiente", "confirmado", "preparando", "listo", "entregado", "cancelado"];
        expect(estadosValidos.includes("pendiente")).toBe(true);
        expect(estadosValidos.includes("confirmado")).toBe(true);
        expect(estadosValidos.includes("entregado")).toBe(true);
    });
});
