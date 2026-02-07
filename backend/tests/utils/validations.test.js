describe("Validaciones", () => {
  describe("Validación de Email", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it("debería validar email correcto", () => {
      expect(emailRegex.test("test@test.com")).toBe(true);
      expect(emailRegex.test("user.name@domain.com")).toBe(true);
      expect(emailRegex.test("user+tag@domain.com")).toBe(true);
    });

    it("debería rechazar email incorrecto", () => {
      expect(emailRegex.test("test")).toBe(false);
      expect(emailRegex.test("test@")).toBe(false);
      expect(emailRegex.test("@domain.com")).toBe(false);
      expect(emailRegex.test("test@domain")).toBe(false);
    });
  });

  describe("Validación de Código de Barras", () => {
    const ean13Regex = /^\d{13}$/;
    const ean8Regex = /^\d{8}$/;
    const upcRegex = /^\d{12}$/;

    it("debería validar EAN-13", () => {
      expect(ean13Regex.test("1234567890123")).toBe(true);
      expect(ean13Regex.test("123456789012")).toBe(false); // 12 dígitos
    });

    it("debería validar EAN-8", () => {
      expect(ean8Regex.test("12345678")).toBe(true);
      expect(ean8Regex.test("1234567")).toBe(false);
    });

    it("debería validar UPC-A", () => {
      expect(upcRegex.test("123456789012")).toBe(true);
      expect(upcRegex.test("12345678901")).toBe(false);
    });
  });

  describe("Validación de Contraseña", () => {
    const validarPassword = (password) => {
      const errores = [];
      if (password.length < 6) {
        errores.push("Mínimo 6 caracteres");
      }
      return { valido: errores.length === 0, errores };
    };

    it("debería validar contraseña fuerte", () => {
      const resultado = validarPassword("123456");
      expect(resultado.valido).toBe(true);
    });

    it("debería rechazar contraseña corta", () => {
      const resultado = validarPassword("123");
      expect(resultado.valido).toBe(false);
      expect(resultado.errores).toContain("Mínimo 6 caracteres");
    });
  });

  describe("Validación de Teléfono", () => {
    const telefonoRegex = /^[\d\-\s\+\(\)]{7,20}$/;

    it("debería validar teléfono correcto", () => {
      expect(telefonoRegex.test("123456789")).toBe(true);
      expect(telefonoRegex.test("+54 11 1234-5678")).toBe(true);
      expect(telefonoRegex.test("(011) 4567-8901")).toBe(true);
    });

    it("debería rechazar teléfono inválido", () => {
      expect(telefonoRegex.test("abc")).toBe(false);
      expect(telefonoRegex.test("123")).toBe(false); // muy corto
    });
  });
});

describe("Formateo", () => {
  describe("Formateo de Moneda", () => {
    const formatearMoneda = (valor) => {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(valor);
    };

    it("debería formatear valores monetarios", () => {
      const formatted = formatearMoneda(1500);
      expect(formatted).toContain("1.500");
    });

    it("debería manejar decimales", () => {
      const formatted = formatearMoneda(1500.5);
      expect(formatted).toContain("1.500");
    });
  });

  describe("Formateo de Fecha", () => {
    const formatearFecha = (fecha) => {
      return new Date(fecha).toLocaleDateString("es-AR");
    };

    it("debería formatear fecha correctamente", () => {
      const fecha = new Date("2026-02-07");
      const formatted = formatearFecha(fecha);
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });
});

describe("Cálculos", () => {
  describe("Cálculo de Totales", () => {
    const calcularTotal = (items) => {
      return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    };

    it("debería calcular total de items", () => {
      const items = [
        { precio: 100, cantidad: 2 },
        { precio: 50, cantidad: 3 },
      ];
      expect(calcularTotal(items)).toBe(350);
    });

    it("debería retornar 0 para lista vacía", () => {
      expect(calcularTotal([])).toBe(0);
    });
  });

  describe("Cálculo de Margen", () => {
    const calcularMargen = (precioVenta, precioCosto) => {
      return ((precioVenta - precioCosto) / precioCosto) * 100;
    };

    it("debería calcular margen de ganancia", () => {
      expect(calcularMargen(150, 100)).toBe(50);
      expect(calcularMargen(200, 100)).toBe(100);
    });
  });

  describe("Cálculo de Estadísticas", () => {
    const calcularEstadisticas = (movimientos) => {
      return {
        totalVentas: movimientos.length,
        montoTotal: movimientos.reduce((sum, m) => sum + m.monto, 0),
        productosVendidos: movimientos.reduce((sum, m) => sum + m.cantidad, 0),
      };
    };

    it("debería calcular estadísticas correctamente", () => {
      const movimientos = [
        { monto: 500, cantidad: 5 },
        { monto: 300, cantidad: 3 },
        { monto: 200, cantidad: 2 },
      ];

      const stats = calcularEstadisticas(movimientos);

      expect(stats.totalVentas).toBe(3);
      expect(stats.montoTotal).toBe(1000);
      expect(stats.productosVendidos).toBe(10);
    });
  });
});
