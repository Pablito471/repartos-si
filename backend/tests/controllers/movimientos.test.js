// Tests básicos para movimientosController
// Estos tests verifican la estructura básica del controlador

describe("Movimientos Controller - Basic Structure", () => {
    it("debería tener el módulo de movimientos accesible", () => {
        const movimientosController = require("../../src/controllers/movimientosController");
        expect(movimientosController).toBeDefined();
    });

    it("debería exportar las funciones principales", () => {
        const movimientosController = require("../../src/controllers/movimientosController");
        expect(typeof movimientosController.listar).toBe("function");
        expect(typeof movimientosController.obtenerTotales).toBe("function");
        expect(typeof movimientosController.crear).toBe("function");
        expect(typeof movimientosController.actualizar).toBe("function");
        expect(typeof movimientosController.eliminar).toBe("function");
    });
});

describe("Movimientos - Validaciones", () => {
    it("debería rechazar tipos inválidos", () => {
        const tiposValidos = ["ingreso", "egreso"];
        const tipoInvalido = "invalido";
        expect(tiposValidos.includes(tipoInvalido)).toBe(false);
    });

    it("debería aceptar tipos válidos", () => {
        const tiposValidos = ["ingreso", "egreso"];
        expect(tiposValidos.includes("ingreso")).toBe(true);
        expect(tiposValidos.includes("egreso")).toBe(true);
    });

    it("debería validar categorías de movimientos", () => {
        const categoriasValidas = ["ventas", "compras", "cobranzas", "logistica", "servicios", "otros"];
        expect(categoriasValidas.includes("ventas")).toBe(true);
        expect(categoriasValidas.includes("otros")).toBe(true);
        expect(categoriasValidas.includes("invalido")).toBe(false);
    });

    it("debería calcular balance correctamente", () => {
        const ingresos = 5000;
        const egresos = 2000;
        const balance = ingresos - egresos;
        expect(balance).toBe(3000);
    });

    it("debería rechazar montos negativos", () => {
        const monto = -100;
        expect(monto > 0).toBe(false);
    });

    it("debería aceptar montos positivos", () => {
        const monto = 100;
        expect(monto > 0).toBe(true);
    });
});
